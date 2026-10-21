using DefikarteBackend.Model;

namespace DefikarteBackend.Interfaces
{
    public interface IUpdateGeoJsonCacheService
    {
        Task AddOrUpdateFeaturesInLocalCacheAsync(FeatureCollection newOrUpdatedFeatures);

        Task RemoveFeatureInLocalCacheAsync(string id);

        Task CleanupOldItemsInLocalCacheAsync();

        Task<bool> TryUpdateAndCombineCacheAsync(FeatureCollection geoJson);
    }
}