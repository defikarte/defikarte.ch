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
            await _service.RemoveFeatureInLocalCacheAsync("1", DateTime.UtcNow.AddHours(24));

            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Is.EqualTo(new[] { "2" }));
        }

        [Test]
        public async Task TryUpdateAndCombineCacheAsync_GivenOverpassDataWithARemovedFeature_ShouldLeaveItOut()
        {
            await _service.RemoveFeatureInLocalCacheAsync("1", DateTime.UtcNow.AddHours(24));

            // overpass still has the node, because it is not deleted in OSM yet or overpass has not caught up
            await _service.TryUpdateAndCombineCacheAsync(new FeatureCollection { Features = [CreateFeature("1"), CreateFeature("2")] });

            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Is.EqualTo(new[] { "2" }));
        }

        [Test]
        public async Task CleanupOldItemsInLocalCacheAsync_ShouldKeepARemovalUntilItsRemovedUntil()
        {
            await _service.RemoveFeatureInLocalCacheAsync("1", DateTime.UtcNow.AddHours(24));
            // the marker is older than an hour, like during the delay of a removal
            _localCache.Data.Features[0].Properties["timestamp"] = DateTime.UtcNow.AddHours(-5).ToString("u");

            await _service.CleanupOldItemsInLocalCacheAsync();

            Assert.That(_localCache.Data.Features.Select(x => x.Id), Is.EqualTo(new[] { "1" }));
        }

        [Test]
        public async Task CleanupOldItemsInLocalCacheAsync_ShouldDropARemovalAfterItsRemovedUntil()
        {
            await _service.RemoveFeatureInLocalCacheAsync("1", DateTime.UtcNow.AddMinutes(-1));

            await _service.CleanupOldItemsInLocalCacheAsync();

            Assert.That(_localCache.Data.Features, Is.Empty);
        }

        [Test]
        public async Task CleanupOldItemsInLocalCacheAsync_ShouldStillDropOtherItemsAfterAnHour()
        {
            await _service.AddOrUpdateFeaturesInLocalCacheAsync(new FeatureCollection { Features = [CreateFeature("3")] });
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
    }
}
