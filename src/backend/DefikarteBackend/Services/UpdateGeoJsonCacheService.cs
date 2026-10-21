using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using Microsoft.Extensions.Logging;

namespace DefikarteBackend.Services
{
    public class UpdateGeoJsonCacheService : IUpdateGeoJsonCacheService
    {
        // Marks a feature in the local cache as deleted in OSM, so it is also removed from the
        // overpass data until that has caught up (the marker is cleaned up like other local items).
        private const string RemovedProperty = "removed";

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
                var oneHourAgo = currentTime.AddHours(-1);

                var geoJson = await SafeGetAsync(localCacheRepository).ConfigureAwait(false);

                geoJson.Features.RemoveAll(feature =>
                {
                    if (feature.Properties.TryGetValue("timestamp", out var timestampObj) && timestampObj is string timestampStr)
                    {
                        if (DateTime.TryParseExact(
                                timestampStr,
                                "yyyy-MM-dd HH:mm:ssZ",
                                System.Globalization.CultureInfo.InvariantCulture,
                                System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
                                out var timestamp))
                        {
                            return timestamp < oneHourAgo;
                        }
                    }
                    return false;
                });

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

        public async Task RemoveFeatureInLocalCacheAsync(string id)
        {
            var removedFeature = new Feature
            {
                Id = id,
                Properties = new Dictionary<string, string>
                {
                    { "timestamp", DateTime.UtcNow.ToString("u") },
                    { RemovedProperty, "yes" },
                },
            };

            await AddOrUpdateFeaturesInLocalCacheAsync(new FeatureCollection { Features = [removedFeature] }).ConfigureAwait(false);
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
