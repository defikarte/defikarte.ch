using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using DefikarteBackend.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace DefikarteBackend.Tests
{
    [TestFixture]
    public class RateLimitServiceTests
    {
        private const string InstallId = "3f2c1a40-9b1e-4c53-8a77-0d5b6c0f1e21";
        private const string OtherInstallId = "a1b2c3d4-0000-4000-8000-000000000001";
        private const string Ip = "203.0.113.7";

        private CountingRateLimitRepository _repository;
        private Mock<IServiceConfiguration> _config;
        private FakeTimeProvider _time;
        private RateLimitService _service;

        [SetUp]
        public void Setup()
        {
            _repository = new CountingRateLimitRepository();
            _config = new Mock<IServiceConfiguration>();
            _config.SetupGet(x => x.RateLimitHashKey).Returns("secret");
            _time = new FakeTimeProvider(DateTimeOffset.FromUnixTimeSeconds(1_800_000_030));
            _service = new RateLimitService(_repository, _config.Object, _time, new Mock<ILogger<RateLimitService>>().Object);
        }

        [Test]
        public async Task CheckAsync_GivenAFunctionWithoutPolicy_ShouldAllowWithoutCounting()
        {
            var decision = await _service.CheckAsync("AED_GET_V3", InstallId, Ip);

            Assert.That(decision.Outcome, Is.EqualTo(RateLimitOutcome.Allowed));
            Assert.That(_repository.Counts, Is.Empty);
        }

        [Test]
        public async Task CheckAsync_ShouldAllowTwoWritesPerMinuteAndRejectTheThird()
        {
            var first = await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);
            var second = await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);
            var third = await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);

            Assert.That(first.Outcome, Is.EqualTo(RateLimitOutcome.Allowed));
            Assert.That(second.Outcome, Is.EqualTo(RateLimitOutcome.Allowed));
            Assert.That(third.Outcome, Is.EqualTo(RateLimitOutcome.Limited));
        }

        [Test]
        public async Task CheckAsync_WhenRejected_ShouldTellWhenTheWindowIsOver()
        {
            // 30 seconds into a minute
            await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);
            await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);

            var decision = await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);

            Assert.That(decision.RetryAfter, Is.EqualTo(TimeSpan.FromSeconds(30)));
        }

        [Test]
        public async Task CheckAsync_ShouldCountDifferentInstallIdsOnTheSameIpSeparately()
        {
            await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);
            await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);

            var other = await _service.CheckAsync("AED_PUT_V3", OtherInstallId, Ip);

            Assert.That(other.Outcome, Is.EqualTo(RateLimitOutcome.Allowed));
        }

        [Test]
        public async Task CheckAsync_GivenManyInstallIdsOnOneIp_ShouldRejectWhenTheIpLimitIsReached()
        {
            // 20 per minute and IP, each install id only once
            for (var i = 0; i < 20; i++)
            {
                var decision = await _service.CheckAsync("AED_PUT_V3", Guid.NewGuid().ToString(), Ip);
                Assert.That(decision.Outcome, Is.EqualTo(RateLimitOutcome.Allowed), $"call {i + 1}");
            }

            var rejected = await _service.CheckAsync("AED_PUT_V3", Guid.NewGuid().ToString(), Ip);

            Assert.That(rejected.Outcome, Is.EqualTo(RateLimitOutcome.Limited));
        }

        [TestCase(null)]
        [TestCase("")]
        [TestCase("not-a-uuid")]
        [TestCase("{3f2c1a40-9b1e-4c53-8a77-0d5b6c0f1e21}")]
        public async Task CheckAsync_GivenNoValidInstallId_ShouldLimitTheIpWithTheTightLimit(string? header)
        {
            await _service.CheckAsync("AED_PUT_V3", header, Ip);
            await _service.CheckAsync("AED_PUT_V3", header, Ip);

            var third = await _service.CheckAsync("AED_PUT_V3", header, Ip);

            Assert.That(third.Outcome, Is.EqualTo(RateLimitOutcome.Limited));
            Assert.That(third.InstallIdHash, Is.Null);
        }

        [Test]
        public async Task CheckAsync_GivenAnUnknownIp_ShouldStillLimitTheInstallId()
        {
            await _service.CheckAsync("AED_PUT_V3", InstallId, null);
            await _service.CheckAsync("AED_PUT_V3", InstallId, null);

            var third = await _service.CheckAsync("AED_PUT_V3", InstallId, null);

            Assert.That(third.Outcome, Is.EqualTo(RateLimitOutcome.Limited));
            Assert.That(third.IpHash, Is.Null);
        }

        [Test]
        public async Task CheckAsync_ShouldNeverUseTheRawInstallIdOrIp()
        {
            var decision = await _service.CheckAsync("AED_REMOVAL_POST_V3", InstallId, Ip);

            Assert.That(_repository.Counts.Keys, Is.Not.Empty);
            Assert.That(_repository.Counts.Keys.Any(key => key.Contains(InstallId) || key.Contains(Ip)), Is.False);
            Assert.That(decision.InstallIdHash, Is.Not.Null.And.Not.Contain(InstallId));
            Assert.That(decision.IpHash, Is.Not.Null.And.Not.Contain(Ip));
        }

        [Test]
        public async Task CheckAsync_ShouldHashWithTheSecret()
        {
            var first = await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);
            _config.SetupGet(x => x.RateLimitHashKey).Returns("another secret");

            var second = await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);

            Assert.That(second.InstallIdHash, Is.Not.EqualTo(first.InstallIdHash));
        }

        [Test]
        public async Task CheckAsync_ForARemoval_ShouldAllowTwoPerHourPerInstallId()
        {
            await _service.CheckAsync("AED_REMOVAL_POST_V3", InstallId, Ip);
            await _service.CheckAsync("AED_REMOVAL_POST_V3", InstallId, Ip);

            var third = await _service.CheckAsync("AED_REMOVAL_POST_V3", InstallId, Ip);

            Assert.That(third.Outcome, Is.EqualTo(RateLimitOutcome.Limited));
            Assert.That(third.RetryAfter, Is.EqualTo(TimeSpan.FromSeconds(3600 - 1_800_000_030 % 3600)));
        }

        [Test]
        public async Task CheckAsync_ForARemoval_ShouldStopEverybodyAtTheGlobalLimit()
        {
            // 10 per day for all, each from another IP and install id
            for (var i = 0; i < 10; i++)
            {
                var decision = await _service.CheckAsync("AED_REMOVAL_POST_V3", Guid.NewGuid().ToString(), $"198.51.100.{i}");
                Assert.That(decision.Outcome, Is.EqualTo(RateLimitOutcome.Allowed), $"call {i + 1}");
            }

            var rejected = await _service.CheckAsync("AED_REMOVAL_POST_V3", Guid.NewGuid().ToString(), "198.51.100.99");

            Assert.That(rejected.Outcome, Is.EqualTo(RateLimitOutcome.Limited));
        }

        [Test]
        public async Task CheckAsync_ForARemoval_ShouldNotUseUpTheGlobalLimitWithRejectedCalls()
        {
            await _service.CheckAsync("AED_REMOVAL_POST_V3", InstallId, Ip);
            await _service.CheckAsync("AED_REMOVAL_POST_V3", InstallId, Ip);
            var globalBefore = _repository.Counts.Single(x => x.Key.Contains(":global:")).Value;

            await _service.CheckAsync("AED_REMOVAL_POST_V3", InstallId, Ip);

            Assert.That(_repository.Counts.Single(x => x.Key.Contains(":global:")).Value, Is.EqualTo(globalBefore));
        }

        [Test]
        public async Task CheckAsync_WhenTheStorageFailsForAWrite_ShouldAllowTheCall()
        {
            _repository.Failure = new InvalidOperationException("storage is down");

            var decision = await _service.CheckAsync("AED_POST_V3", InstallId, Ip);

            Assert.That(decision.Outcome, Is.EqualTo(RateLimitOutcome.Allowed));
        }

        [Test]
        public async Task CheckAsync_WhenTheStorageFailsForARemoval_ShouldNotAllowTheCall()
        {
            _repository.Failure = new InvalidOperationException("storage is down");

            var decision = await _service.CheckAsync("AED_REMOVAL_POST_V3", InstallId, Ip);

            Assert.That(decision.Outcome, Is.EqualTo(RateLimitOutcome.Unavailable));
        }

        [Test]
        public async Task CheckAsync_WithoutAHashKey_ShouldNotLimit()
        {
            _config.SetupGet(x => x.RateLimitHashKey).Returns(string.Empty);

            for (var i = 0; i < 5; i++)
            {
                var decision = await _service.CheckAsync("AED_PUT_V3", InstallId, Ip);
                Assert.That(decision.Outcome, Is.EqualTo(RateLimitOutcome.Allowed));
            }

            Assert.That(_repository.Counts, Is.Empty);
        }

        [Test]
        public void ParseInstallId_ShouldAcceptOnlyAUuidAndNormalizeIt()
        {
            Assert.That(RateLimitService.ParseInstallId(" 3F2C1A40-9B1E-4C53-8A77-0D5B6C0F1E21 "), Is.EqualTo(InstallId));
            Assert.That(RateLimitService.ParseInstallId("3f2c1a409b1e4c538a770d5b6c0f1e21"), Is.Null);
            Assert.That(RateLimitService.ParseInstallId(new string('a', 5000)), Is.Null);
        }

        /// <summary>Counts every key like a limiter would, without windows.</summary>
        private sealed class CountingRateLimitRepository : IRateLimitRepository
        {
            public Dictionary<string, int> Counts { get; } = [];

            public Exception? Failure { get; set; }

            public Task<bool> TryAcquireAsync(string key, int limit, TimeSpan window)
            {
                if (Failure != null)
                {
                    throw Failure;
                }

                Counts.TryGetValue(key, out var count);
                if (count >= limit)
                {
                    return Task.FromResult(false);
                }

                Counts[key] = count + 1;
                return Task.FromResult(true);
            }

            public Task<int> DeleteBeforeAsync(DateOnly cutoff) => Task.FromResult(0);
        }
    }
}
