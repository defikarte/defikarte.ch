using Azure;
using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using DefikarteBackend.Services;
using Microsoft.Extensions.Logging;
using Moq;
using OsmSharp;
using OsmSharp.Tags;
using System.Reflection;

namespace DefikarteBackend.Tests
{
    [TestFixture]
    public class AedRemovalServiceTests
    {
        private const long NodeId = 100;

        private InMemoryGeoJsonCacheRepository _osmCache;
        private InMemoryGeoJsonCacheRepository _localCache;
        private InMemoryAedRemovalRepository _repository;
        private Mock<IOsmNodeService> _osm;
        private Mock<IServiceConfiguration> _config;
        private FakeTimeProvider _time;
        private AedRemovalService _service;

        [SetUp]
        public void Setup()
        {
            _osmCache = new InMemoryGeoJsonCacheRepository(DataSourceType.Osm, CreateFeature("100"), CreateFeature("200"));
            _localCache = new InMemoryGeoJsonCacheRepository(DataSourceType.Local);
            _repository = new InMemoryAedRemovalRepository();
            _time = new FakeTimeProvider(DateTimeOffset.UtcNow);

            _config = new Mock<IServiceConfiguration>();
            _config.SetupGet(x => x.AedRemovalDelayHours).Returns(24);

            _osm = new Mock<IOsmNodeService>();
            _osm.Setup(x => x.GetNodeAsync(NodeId)).ReturnsAsync(() => CreateNode(NodeId, "defibrillator"));
            _osm.Setup(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>())).ReturnsAsync((7L, 4L));
            _osm.Setup(x => x.RestoreNodeAsync(It.IsAny<AedSnapshot>(), It.IsAny<long?>(), It.IsAny<string>()))
                .ReturnsAsync(() => CreateNode(NodeId, "defibrillator"));

            var cache = new UpdateGeoJsonCacheService(
                new Mock<ILogger<UpdateGeoJsonCacheService>>().Object,
                _config.Object,
                new Mock<ICacheRepository<OsmNode>>().Object,
                [_osmCache, _localCache]);

            _service = new AedRemovalService(_repository, _osm.Object, cache, _config.Object, _time, new Mock<ILogger<AedRemovalService>>().Object);
        }

        [Test]
        public async Task RequestAsync_ShouldStoreAPendingRemovalAndHideTheAedWithoutTouchingOsm()
        {
            var result = await _service.RequestAsync(NodeId, CreateRequest(), "web");

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.Done));
            var removal = _repository.All.Single();
            Assert.That(removal.Status, Is.EqualTo(AedRemovalStatus.Pending));
            Assert.That(removal.ApplyAfter, Is.EqualTo(_time.GetUtcNow().AddHours(24)));
            Assert.That(removal.Snapshot, Is.Not.Empty);
            Assert.That(removal.ClientId, Is.EqualTo("web"));
            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Is.EqualTo(new[] { "200" }));
            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task RequestAsync_ShouldKeepTheAedHiddenAfterAnHourWhileOverpassStillHasIt()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(5));
            var cache = CreateCacheService();

            await cache.CleanupOldItemsInLocalCacheAsync();
            await cache.TryUpdateAndCombineCacheAsync(new FeatureCollection { Features = [CreateFeature("100"), CreateFeature("200")] });

            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Is.EqualTo(new[] { "200" }));
        }

        [Test]
        public async Task RequestAsync_GivenAPendingRemovalOfTheSameAed_ShouldNotCreateASecondOne()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            var second = await _service.RequestAsync(NodeId, CreateRequest(), "app");

            Assert.That(second.Outcome, Is.EqualTo(AedRemovalOutcome.Done));
            Assert.That(_repository.All.Count(), Is.EqualTo(1));
        }

        [Test]
        public async Task RequestAsync_GivenANodeThatIsNoAed_ShouldRejectItAndStoreNothing()
        {
            _osm.Setup(x => x.GetNodeAsync(NodeId)).ReturnsAsync(CreateNode(NodeId, "bench"));

            var result = await _service.RequestAsync(NodeId, CreateRequest(), "web");

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.NotAnAed));
            Assert.That(_repository.All, Is.Empty);
        }

        [Test]
        public async Task RequestAsync_GivenAMissingNode_ShouldReturnNotFound()
        {
            _osm.Setup(x => x.GetNodeAsync(NodeId)).ReturnsAsync((Node?)null);

            var result = await _service.RequestAsync(NodeId, CreateRequest(), "web");

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.NotFound));
        }

        [Test]
        public void RequestAsync_WhenTheAuditRowCannotBeWritten_ShouldNotRemoveAnything()
        {
            _repository.FailOnAdd = true;

            Assert.ThrowsAsync<InvalidOperationException>(() => _service.RequestAsync(NodeId, CreateRequest(), "web"));

            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()), Times.Never);
            Assert.That(_osmCache.Data.Features, Has.Count.EqualTo(2));
        }

        [Test]
        public async Task RequestAsync_GivenNoDelay_ShouldDeleteInOsmRightAway()
        {
            _config.SetupGet(x => x.AedRemovalDelayHours).Returns(0);

            var result = await _service.RequestAsync(NodeId, CreateRequest(), "web");

            Assert.That(result.Removal?.Status, Is.EqualTo(AedRemovalStatus.Applied));
            Assert.That(result.Removal?.AppliedBy, Is.EqualTo("request"));
            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), "Remove AED (dismantled)"), Times.Once);
        }

        [Test]
        public async Task ApplyDueAsync_BeforeTheDelayIsOver_ShouldNotDelete()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(23));

            var applied = await _service.ApplyDueAsync();

            Assert.That(applied, Is.EqualTo(0));
            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task ApplyDueAsync_AfterTheDelay_ShouldDeleteInOsmAndKeepTheOnlyReasonInTheChangeset()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(25));

            var applied = await _service.ApplyDueAsync();

            Assert.That(applied, Is.EqualTo(1));
            var removal = _repository.All.Single();
            Assert.That(removal.Status, Is.EqualTo(AedRemovalStatus.Applied));
            Assert.That(removal.AppliedBy, Is.EqualTo("timer"));
            Assert.That(removal.ChangesetId, Is.EqualTo(7));
            Assert.That(removal.DeletedVersion, Is.EqualTo(4));
            // no name, comment or ids of ours in OSM
            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), "Remove AED (dismantled)"), Times.Once);
        }

        [Test]
        public async Task ApplyDueAsync_WhenAnotherInstanceIsAlreadyDeleting_ShouldDeleteOnlyOnce()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(25));
            _osm.Setup(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()))
                .Returns(async () =>
                {
                    // a second run while the first one is in the middle of the delete
                    await _service.ApplyDueAsync();
                    return (7L, 4L);
                });

            await _service.ApplyDueAsync();

            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task ApplyDueAsync_WhenTheNodeIsNoAedAnymore_ShouldFailAndShowTheNodeAgain()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(25));
            _osm.Setup(x => x.GetNodeAsync(NodeId)).ReturnsAsync(CreateNode(NodeId, "bench"));

            await _service.ApplyDueAsync();

            Assert.That(_repository.All.Single().Status, Is.EqualTo(AedRemovalStatus.Failed));
            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Does.Contain("100"));
            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task ApplyDueAsync_WhenOsmFails_ShouldTryAgainLaterAndGiveUpAfterFiveAttempts()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(25));
            _osm.Setup(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>())).ThrowsAsync(new HttpRequestException("OSM is down"));

            await _service.ApplyDueAsync();
            Assert.That(_repository.All.Single().Status, Is.EqualTo(AedRemovalStatus.Pending));
            Assert.That(_repository.All.Single().Attempts, Is.EqualTo(1));

            for (var i = 0; i < 4; i++)
            {
                await _service.ApplyDueAsync();
            }

            Assert.That(_repository.All.Single().Status, Is.EqualTo(AedRemovalStatus.Failed));
            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Does.Contain("100"));
        }

        [Test]
        public async Task VerifyAsync_GivenAPendingRemoval_ShouldDeleteItNowAndVerifyIt()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");

            var result = await _service.VerifyAsync(_repository.All.Single().Id, "marc");

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.Done));
            var removal = _repository.All.Single();
            Assert.That(removal.Status, Is.EqualTo(AedRemovalStatus.Verified));
            Assert.That(removal.AppliedBy, Is.EqualTo("admin"));
            Assert.That(removal.VerifiedBy, Is.EqualTo("marc"));
            Assert.That(removal.AppliedAt, Is.Not.Null);
            Assert.That(removal.VerifiedAt, Is.Not.Null);
            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task VerifyAsync_GivenAnAppliedRemoval_ShouldOnlyVerifyIt()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(25));
            await _service.ApplyDueAsync();

            var result = await _service.VerifyAsync(_repository.All.Single().Id, "marc");

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.Done));
            Assert.That(_repository.All.Single().Status, Is.EqualTo(AedRemovalStatus.Verified));
            Assert.That(_repository.All.Single().AppliedBy, Is.EqualTo("timer"));
            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()), Times.Once);
        }

        [Test]
        public async Task VerifyAsync_GivenACancelledRemoval_ShouldBeRejected()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            await _service.CancelAsync(_repository.All.Single().Id);

            var result = await _service.VerifyAsync(_repository.All.Single().Id, "marc");

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.InvalidState));
            Assert.That(_repository.All.Single().Status, Is.EqualTo(AedRemovalStatus.Cancelled));
        }

        [Test]
        public async Task CancelAsync_GivenAPendingRemoval_ShouldShowTheAedAgainAndNeverDeleteIt()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");

            var result = await _service.CancelAsync(_repository.All.Single().Id);
            _time.Advance(TimeSpan.FromHours(25));
            await _service.ApplyDueAsync();

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.Done));
            Assert.That(_repository.All.Single().Status, Is.EqualTo(AedRemovalStatus.Cancelled));
            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Does.Contain("100"));
            // the marker is replaced, so the next overpass sync does not hide it either
            Assert.That(_localCache.Data.Features.Any(x => x.Properties.ContainsKey("removed")), Is.False);
            _osm.Verify(x => x.DeleteNodeAsync(It.IsAny<Node>(), It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task CancelAsync_GivenAnAppliedRemoval_ShouldBeRejected()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(25));
            await _service.ApplyDueAsync();

            var result = await _service.CancelAsync(_repository.All.Single().Id);

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.InvalidState));
        }

        [Test]
        public async Task RestoreAsync_GivenAnAppliedRemoval_ShouldRestoreInOsmAndShowTheAed()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");
            _time.Advance(TimeSpan.FromHours(25));
            await _service.ApplyDueAsync();
            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Does.Not.Contain("100"));

            var result = await _service.RestoreAsync(_repository.All.Single().Id);

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.Done));
            var removal = _repository.All.Single();
            Assert.That(removal.Status, Is.EqualTo(AedRemovalStatus.Restored));
            Assert.That(removal.RestoredNodeId, Is.EqualTo(NodeId));
            _osm.Verify(x => x.RestoreNodeAsync(It.Is<AedSnapshot>(s => s.Id == NodeId && s.Tags["emergency"] == "defibrillator"), 4L, It.IsAny<string>()), Times.Once);
            Assert.That(_osmCache.Data.Features.Select(x => x.Id), Does.Contain("100"));
        }

        [Test]
        public async Task RestoreAsync_GivenAPendingRemoval_ShouldBeRejected()
        {
            await _service.RequestAsync(NodeId, CreateRequest(), "web");

            var result = await _service.RestoreAsync(_repository.All.Single().Id);

            Assert.That(result.Outcome, Is.EqualTo(AedRemovalOutcome.InvalidState));
            _osm.Verify(x => x.RestoreNodeAsync(It.IsAny<AedSnapshot>(), It.IsAny<long?>(), It.IsAny<string>()), Times.Never);
        }

        private UpdateGeoJsonCacheService CreateCacheService() => new(
            new Mock<ILogger<UpdateGeoJsonCacheService>>().Object,
            _config.Object,
            new Mock<ICacheRepository<OsmNode>>().Object,
            [_osmCache, _localCache]);

        private static AedRemovalRequest CreateRequest() => new() { Reason = "dismantled", Reporter = "Anna", Comment = "gone" };

        private static Feature CreateFeature(string id) => new()
        {
            Id = id,
            Geometry = new PointGeometry { Coordinates = [8.5, 47.3] },
            Properties = new Dictionary<string, string> { { "emergency", "defibrillator" } },
        };

        private static Node CreateNode(long id, string emergency) => new()
        {
            Id = id,
            Version = 3,
            Latitude = 47.3,
            Longitude = 8.5,
            Tags = new TagsCollection { new Tag("emergency", emergency), new Tag("defibrillator:location", "lobby") },
        };

        private sealed class FakeTimeProvider(DateTimeOffset start) : TimeProvider
        {
            private DateTimeOffset _now = start;

            public override DateTimeOffset GetUtcNow() => _now;

            public void Advance(TimeSpan by) => _now += by;
        }

        /// <summary>Behaves like Table Storage: rows are copies and an update needs the current ETag.</summary>
        private sealed class InMemoryAedRemovalRepository : IAedRemovalRepository
        {
            private readonly Dictionary<string, AedRemoval> _rows = [];
            private int _version;

            public bool FailOnAdd { get; set; }

            public IEnumerable<AedRemoval> All => _rows.Values.Select(Copy).OrderBy(x => x.RequestedAt);

            public Task AddAsync(AedRemoval removal)
            {
                if (FailOnAdd)
                {
                    throw new InvalidOperationException("Storage is down.");
                }

                removal.ETag = new ETag((++_version).ToString());
                _rows[removal.RowKey] = Copy(removal);
                return Task.CompletedTask;
            }

            public Task<AedRemoval?> GetAsync(string id) => Task.FromResult(_rows.TryGetValue(id, out var row) ? Copy(row) : null);

            public Task<IReadOnlyList<AedRemoval>> ListAsync(string? status, int max) =>
                Task.FromResult<IReadOnlyList<AedRemoval>>(All.Where(x => status == null || x.Status == status).Take(max).ToList());

            public Task<AedRemoval?> FindPendingByNodeAsync(long nodeId) =>
                Task.FromResult(All.FirstOrDefault(x => x.NodeId == nodeId && x.Status == AedRemovalStatus.Pending));

            public Task<IReadOnlyList<AedRemoval>> ListPendingAsync() => ListAsync(AedRemovalStatus.Pending, int.MaxValue);

            public Task<bool> TryUpdateAsync(AedRemoval removal)
            {
                if (_rows[removal.RowKey].ETag != removal.ETag)
                {
                    return Task.FromResult(false);
                }

                removal.ETag = new ETag((++_version).ToString());
                _rows[removal.RowKey] = Copy(removal);
                return Task.FromResult(true);
            }

            private static AedRemoval Copy(AedRemoval removal) =>
                (AedRemoval)typeof(object).GetMethod("MemberwiseClone", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(removal, null)!;
        }
    }
}
