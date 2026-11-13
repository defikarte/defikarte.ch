using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using Microsoft.Extensions.Logging;

namespace DefikarteBackend.Services
{
    public class UpdateGeoJsonCacheService : IUpdateGeoJsonCacheService
    {
        // Marks a feature in the local cache as removed, so it is also removed from the overpass data. This
        // starts when the removal is requested (the node still exists in OSM until the delay is over) and
        // lasts until overpass has caught up with the delete. The marker has its own expiry (removedUntil)
        // instead of the 1 hour of other local items, which would bring the AED back while it is still in overpass.
        private const string RemovedProperty = "removed";
        private const string RemovedUntilProperty = "removedUntil";
        private const string TimestampFormat = "yyyy-MM-dd HH:mm:ssZ";

        private readonly ILogger<UpdateGeoJsonCacheService> _logger;
        private readonly IEnumerable<IGeoJsonCacheRepository> _geoJsonCacheRepositories;

        public UpdateGeoJsonCacheService(
            ILogger<UpdateGeoJsonCacheService> logger,
            IServiceConfiguration config,
            ICacheRepository<OsmNode> cacheRepository,
            IEnumerable<IGeoJsonCacheRepository> geoJsonCacheRepository)
        {
            _logger = logger;
            _geoJsonCacheRepositories = geoJsonCacheRepository;
        }

        public async Task<bool> TryUpdateAndCombineCacheAsync(FeatureCollection geoJson)
        {
            var localCacheRepository = _geoJsonCacheRepositories.FirstOrDefault(x => x.DataSourceType == DataSourceType.Local);
            var osmCacheRepository = _geoJsonCacheRepositories.FirstOrDefault(x => x.DataSourceType == DataSourceType.Osm);
            if (localCacheRepository == null && osmCacheRepository != null)
            {
                return await osmCacheRepository.TryUpdateCacheAsync(geoJson).ConfigureAwait(false);
            }

            if (localCacheRepository != null && osmCacheRepository != null)
            {
                var temporaryData = await SafeGetAsync(localCacheRepository).ConfigureAwait(false);
                AddOrUpdateItems(temporaryData, geoJson, applyRemovals: true);
                return await osmCacheRepository.TryUpdateCacheAsync(geoJson).ConfigureAwait(false);
            }

            return false;
        }

        public async Task CleanupOldItemsInLocalCacheAsync()
        {
            try
            {
                var localCacheRepository = _geoJsonCacheRepositories.FirstOrDefault(x => x.DataSourceType == DataSourceType.Local);

                if (localCacheRepository == null || await localCacheRepository.ExistsAsync() == false)
                {
                    return; // No cache to cleanse
                }

                var currentTime = DateTime.UtcNow;

                var geoJson = await SafeGetAsync(localCacheRepository).ConfigureAwait(false);

                geoJson.Features.RemoveAll(feature => IsExpired(feature, currentTime));
                await localCacheRepository.TryUpdateCacheAsync(geoJson).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error {nameof(CleanupOldItemsInLocalCacheAsync)}");
            }
        }

        public async Task AddOrUpdateFeaturesInLocalCacheAsync(FeatureCollection newOrUpdatedFeatures)
        {
            var localCacheRepository = _geoJsonCacheRepositories.FirstOrDefault(x => x.DataSourceType == DataSourceType.Local);

            if (localCacheRepository != null)
            {
                var geoJson = await SafeGetAsync(localCacheRepository).ConfigureAwait(false);
                AddOrUpdateItems(newOrUpdatedFeatures, geoJson);
                await localCacheRepository.TryUpdateCacheAsync(geoJson).ConfigureAwait(false);
            }
            else
            {
                // Without a local repository, we're powerless
                _logger.LogWarning("No local cache available. Do not keep track of added or updated items.");
            }


            var osmCacheRepository = _geoJsonCacheRepositories.FirstOrDefault(x => x.DataSourceType == DataSourceType.Osm);
            if (osmCacheRepository != null)
            {
                var geoJson = await osmCacheRepository.GetAsync().ConfigureAwait(false);
                AddOrUpdateItems(newOrUpdatedFeatures, geoJson, applyRemovals: true);
                await osmCacheRepository.TryUpdateCacheAsync(geoJson).ConfigureAwait(false);
            }
            else
            {
                // Without osm repository, we're powerless
                _logger.LogWarning("No osm cache available. Do not keep track of added or updated items.");
            }
        }

        public async Task RemoveFeatureInLocalCacheAsync(string id, DateTime removedUntilUtc)
        {
            var removedFeature = new Feature
            {
                Id = id,
                Properties = new Dictionary<string, string>
                {
                    { "timestamp", DateTime.UtcNow.ToString("u") },
                    { RemovedProperty, "yes" },
                    { RemovedUntilProperty, removedUntilUtc.ToUniversalTime().ToString("u") },
                },
            };

            await AddOrUpdateFeaturesInLocalCacheAsync(new FeatureCollection { Features = [removedFeature] }).ConfigureAwait(false);
        }

        /// <summary>
        /// Local items expire after an hour, a removal marker when its removedUntil is over.
        /// </summary>
        public static bool IsExpired(Feature feature, DateTime nowUtc)
        {
            if (feature.Properties.ContainsKey(RemovedProperty)
                && feature.Properties.TryGetValue(RemovedUntilProperty, out var removedUntilStr)
                && TryParseTimestamp(removedUntilStr, out var removedUntil))
            {
                return removedUntil < nowUtc;
            }

            return feature.Properties.TryGetValue("timestamp", out var timestampStr)
                && TryParseTimestamp(timestampStr, out var timestamp)
                && timestamp < nowUtc.AddHours(-1);
        }

        private static bool TryParseTimestamp(string? value, out DateTime result)
        {
            return DateTime.TryParseExact(
                value,
                TimestampFormat,
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
                out result);
        }

        private static void AddOrUpdateItems(FeatureCollection newOrUpdatedFeatures, FeatureCollection geoJson, bool applyRemovals = false)
        {
            foreach (var newFeature in newOrUpdatedFeatures.Features)
            {
                var existingFeatureIndex = geoJson.Features.FindIndex(feature => feature.Id == newFeature.Id);

                if (applyRemovals && newFeature.Properties.ContainsKey(RemovedProperty))
                {
                    if (existingFeatureIndex != -1)
                    {
                        geoJson.Features.RemoveAt(existingFeatureIndex);
                    }

                    continue;
                }

                if (existingFeatureIndex != -1)
                {
                    // Replace the existing feature
                    geoJson.Features[existingFeatureIndex] = newFeature;
                }
                else
                {
                    // Add the new feature
                    geoJson.Features.Add(newFeature);
                }
            }
        }

        private static async Task<FeatureCollection> SafeGetAsync(IGeoJsonCacheRepository geoJsonCacheRepository)
        {
            if (!await geoJsonCacheRepository.ExistsAsync())
            {
                return new FeatureCollection();
            }

            return await geoJsonCacheRepository.GetAsync().ConfigureAwait(false);
        }
    }
}
