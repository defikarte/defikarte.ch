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

        public SimpleCacheTimer(
            ILogger<SimpleCacheTimer> logger,
            ICacheRepository<OsmNode> cacheRepository,
            IEnumerable<IGeoJsonCacheRepository> geoJsonCacheRepositories,
            OverpassClient overpassClient,
            IUpdateGeoJsonCacheService updateGeoJsonCacheService)
        {
            _logger = logger;
            _cacheRepository = cacheRepository;
            _osmCacheRepository = geoJsonCacheRepositories.First(x => x.DataSourceType == DataSourceType.Osm);
            _overpassClient = overpassClient;
            _updateGeoJsonCacheService = updateGeoJsonCacheService;
        }

        [Function(nameof(SimpleCacheTimer))]
        public async Task RunAsync([TimerTrigger("0 */15 * * * *", RunOnStartup = true)] TimerInfo myTimer)
        {
            try
            {
                // Throws on errors or empty responses. The existing cache is kept in that case.
                var response = await _overpassClient.GetAllDefibrillatorsInSwitzerland();

                var cachedCount = await GetCachedCountAsync().ConfigureAwait(false);
                if (response.Count < cachedCount * MinAcceptedRatio)
                {
                    _logger.LogWarning($"Overpass returned {response.Count} AEDs, cache has {cachedCount}. Keep existing cache.");
                    return;
                }

                var geoJson = GeoJsonConverter.Convert2GeoJson(response);
                geoJson.Timestamp = DateTime.UtcNow;

                var cacheV1Task = _cacheRepository.TryUpdateCacheAsync(response);
                var cacheV2Task = _updateGeoJsonCacheService.TryUpdateAndCombineCacheAsync(geoJson);

                var results = await Task.WhenAll(cacheV1Task, cacheV2Task);
                var success = results.All(x => x);
                _logger.LogInformation($"Updated cache successful:{success}");

                // Only drop local edits once fresh OSM data has been stored.
                if (success)
                {
                    await _updateGeoJsonCacheService.CleanupOldItemsInLocalCacheAsync().ConfigureAwait(false);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error running {nameof(SimpleCacheTimer)}. Keep existing cache.");
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
