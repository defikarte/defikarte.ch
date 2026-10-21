using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using DefikarteBackend.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace DefikarteBackend.Tests
{
    [TestFixture]
    public class UpdateGeoJsonCacheServiceTests
    {
        private InMemoryGeoJsonCacheRepository _osmCache;
        private InMemoryGeoJsonCacheRepository _localCache;
        private UpdateGeoJsonCacheService _service;

        [SetUp]
        public void Setup()
        {
            _osmCache = new InMemoryGeoJsonCacheRepository(DataSourceType.Osm, CreateFeature("1"), CreateFeature("2"));
            _localCache = new InMemoryGeoJsonCacheRepository(DataSourceType.Local);
            _service = new UpdateGeoJsonCacheService(
                new Mock<ILogger<UpdateGeoJsonCacheService>>().Object,
                new Mock<IServiceConfiguration>().Object,
                new Mock<ICacheRepository<OsmNode>>().Object,
                [_osmCache, _localCache]);
        }

        [Test]
        public async Task RemoveFeatureInLocalCacheAsync_ShouldRemoveTheFeatureFromTheOsmCache()
        {
            await _service.RemoveFeatureInLocalCacheAsync("1");

            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Is.EqualTo(new[] { "2" }));
        }

        [Test]
        public async Task TryUpdateAndCombineCacheAsync_GivenOverpassDataWithARemovedFeature_ShouldLeaveItOut()
        {
            await _service.RemoveFeatureInLocalCacheAsync("1");

            // overpass has not caught up with the deletion yet
            await _service.TryUpdateAndCombineCacheAsync(new FeatureCollection { Features = [CreateFeature("1"), CreateFeature("2")] });

            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Is.EqualTo(new[] { "2" }));
        }

        [Test]
        public async Task CleanupOldItemsInLocalCacheAsync_ShouldKeepARecentRemoval()
        {
            await _service.RemoveFeatureInLocalCacheAsync("1");

            await _service.CleanupOldItemsInLocalCacheAsync();

            Assert.That(_localCache.Data.Features.Select(x => x.Id), Is.EqualTo(new[] { "1" }));
        }

        [Test]
        public async Task CleanupOldItemsInLocalCacheAsync_ShouldDropARemovalAfterAnHour()
        {
            await _service.RemoveFeatureInLocalCacheAsync("1");
            _localCache.Data.Features[0].Properties["timestamp"] = DateTime.UtcNow.AddHours(-2).ToString("u");

            await _service.CleanupOldItemsInLocalCacheAsync();

            Assert.That(_localCache.Data.Features, Is.Empty);
        }

        private static Feature CreateFeature(string id) => new()
        {
            Id = id,
            Geometry = new PointGeometry { Coordinates = [8.5, 47.3] },
            Properties = new Dictionary<string, string> { { "emergency", "defibrillator" } },
        };

        private sealed class InMemoryGeoJsonCacheRepository(DataSourceType dataSourceType, params Feature[] features) : IGeoJsonCacheRepository
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
}
