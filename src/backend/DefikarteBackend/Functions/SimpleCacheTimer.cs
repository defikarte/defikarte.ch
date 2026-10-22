using DefikarteBackend.Helpers;
using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using DefikarteBackend.OsmOverpassApi;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace DefikarteBackend.Functions
{
    public class SimpleCacheTimer
    {
        // Overpass may return truncated data without an error. A drop of more than 20% within one interval is never real.
        private const double MinAcceptedRatio = 0.8;

        private readonly ILogger<SimpleCacheTimer> _logger;
        private readonly ICacheRepository<OsmNode> _cacheRepository;
        private readonly IGeoJsonCacheRepository _osmCacheRepository;
        private readonly OverpassClient _overpassClient;
        private readonly IUpdateGeoJsonCacheService _updateGeoJsonCacheService;
        private readonly ISyncStatusRepository _syncStatusRepository;

        public SimpleCacheTimer(
            ILogger<SimpleCacheTimer> logger,
            ICacheRepository<OsmNode> cacheRepository,
            IEnumerable<IGeoJsonCacheRepository> geoJsonCacheRepositories,
            OverpassClient overpassClient,
            IUpdateGeoJsonCacheService updateGeoJsonCacheService,
            ISyncStatusRepository syncStatusRepository)
        {
            _logger = logger;
            _cacheRepository = cacheRepository;
            _osmCacheRepository = geoJsonCacheRepositories.First(x => x.DataSourceType == DataSourceType.Osm);
            _overpassClient = overpassClient;
            _updateGeoJsonCacheService = updateGeoJsonCacheService;
            _syncStatusRepository = syncStatusRepository;
        }

        [Function(nameof(SimpleCacheTimer))]
        public async Task RunAsync([TimerTrigger("0 */15 * * * *", RunOnStartup = true)] TimerInfo myTimer)
        {
            var result = SyncStatus.Error;
            var aedCount = 0;
            try
            {
                // Throws on errors or empty responses. The existing cache is kept in that case.
                var response = await _overpassClient.GetAllDefibrillatorsInSwitzerland();

                var cachedCount = await GetCachedCountAsync().ConfigureAwait(false);
                if (response.Count < cachedCount * MinAcceptedRatio)
                {
                    result = SyncStatus.RejectedTooFew;
                    _logger.LogWarning("Overpass sync {SyncResult} aedCount={AedCount} cachedCount={CachedCount}. Keep existing cache.", result, response.Count, cachedCount);
                    return;
                }

                var geoJson = GeoJsonConverter.Convert2GeoJson(response);
                geoJson.Timestamp = DateTime.UtcNow;

                var cacheV1Task = _cacheRepository.TryUpdateCacheAsync(response);
                var cacheV2Task = _updateGeoJsonCacheService.TryUpdateAndCombineCacheAsync(geoJson);

                var results = await Task.WhenAll(cacheV1Task, cacheV2Task);
                var success = results.All(x => x);
                result = success ? SyncStatus.Success : SyncStatus.CacheWriteFailed;
                aedCount = geoJson.Features.Count;

                if (success)
                {
                    _logger.LogInformation("Overpass sync {SyncResult} aedCount={AedCount} cachedCount={CachedCount}", result, aedCount, cachedCount);

                    // Only drop local edits once fresh OSM data has been stored.
                    await _updateGeoJsonCacheService.CleanupOldItemsInLocalCacheAsync().ConfigureAwait(false);
                }
                else
                {
                    _logger.LogError("Overpass sync {SyncResult} aedCount={AedCount} cachedCount={CachedCount}", result, aedCount, cachedCount);
                }
            }
            catch (Exception ex)
            {
                result = SyncStatus.Error;
                _logger.LogError(ex, "Overpass sync {SyncResult}. Keep existing cache.", result);
            }
            finally
            {
                await WriteSyncStatusAsync(result, aedCount).ConfigureAwait(false);
            }
        }

        private async Task WriteSyncStatusAsync(string result, int aedCount)
        {
            try
            {
                var previous = await _syncStatusRepository.GetAsync().ConfigureAwait(false);
                await _syncStatusRepository.UpdateAsync(SyncStatus.Next(previous, result, aedCount, DateTime.UtcNow)).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not write sync status.");
            }
        }

        private async Task<int> GetCachedCountAsync()
        {
            try
            {
                if (!await _osmCacheRepository.ExistsAsync().ConfigureAwait(false))
                {
                    return 0;
                }

                return (await _osmCacheRepository.GetAsync().ConfigureAwait(false)).Features.Count;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not read cached AED count.");
                return 0;
            }
        }
    }
}
