using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;

namespace DefikarteBackend.Tests
{
    internal sealed class InMemoryGeoJsonCacheRepository(DataSourceType dataSourceType, params Feature[] features) : IGeoJsonCacheRepository
    {
        public FeatureCollection Data { get; private set; } = new FeatureCollection { Features = [.. features] };

        public DataSourceType DataSourceType => dataSourceType;

        public Task<bool> ExistsAsync() => Task.FromResult(true);

        public Task<FeatureCollection> GetAsync() => Task.FromResult(Data);

        public Task<string> GetRawAsync() => throw new NotImplementedException();

        public Task<Feature?> GetByIdAsync(string id) => Task.FromResult(Data.Features.Find(x => x.Id == id));

        public Task<bool> TryUpdateCacheAsync(FeatureCollection values)
        {
            Data = values;
            return Task.FromResult(true);
        }
    }
}
