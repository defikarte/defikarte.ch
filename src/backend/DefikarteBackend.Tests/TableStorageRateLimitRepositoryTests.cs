using Azure.Data.Tables;
using DefikarteBackend.Repository;

namespace DefikarteBackend.Tests
{
    /// <summary>
    /// Runs against Azurite (UseDevelopmentStorage=true) with a table of its own that is deleted afterwards.
    /// Skipped if Azurite is not running.
    /// </summary>
    [TestFixture]
    [Category("Azurite")]
    public class TableStorageRateLimitRepositoryTests
    {
        private static readonly DateTimeOffset Start = new(2026, 11, 13, 10, 0, 30, TimeSpan.Zero);

        private TableClient _table;
        private FakeTimeProvider _time;
        private TableStorageRateLimitRepository _repository;

        [OneTimeSetUp]
        public async Task CheckAzurite()
        {
            // once for all tests, so a machine without Azurite does not wait for every test
            try
            {
                var probe = new TableClient("UseDevelopmentStorage=true", "ratelimitprobe");
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await probe.CreateIfNotExistsAsync(cts.Token);
                await probe.DeleteAsync(cts.Token);
            }
            catch (Exception ex)
            {
                Assert.Ignore($"Azurite is not available: {ex.Message}");
            }
        }

        [SetUp]
        public async Task Setup()
        {
            _table = new TableClient("UseDevelopmentStorage=true", "ratelimittest" + Guid.NewGuid().ToString("N"));
            await _table.CreateIfNotExistsAsync();
            _time = new FakeTimeProvider(Start);
            _repository = new TableStorageRateLimitRepository(_table, _time);
        }

        [TearDown]
        public async Task TearDown()
        {
            if (_table != null)
            {
                await _table.DeleteAsync();
            }
        }

        [Test]
        public async Task TryAcquireAsync_ShouldRejectTheCallAfterTheLimit()
        {
            Assert.That(await _repository.TryAcquireAsync("key", 2, TimeSpan.FromMinutes(1)), Is.True);
            Assert.That(await _repository.TryAcquireAsync("key", 2, TimeSpan.FromMinutes(1)), Is.True);
            Assert.That(await _repository.TryAcquireAsync("key", 2, TimeSpan.FromMinutes(1)), Is.False);
        }

        [Test]
        public async Task TryAcquireAsync_ShouldAllowAgainInTheNextWindow()
        {
            await _repository.TryAcquireAsync("key", 1, TimeSpan.FromMinutes(1));
            Assert.That(await _repository.TryAcquireAsync("key", 1, TimeSpan.FromMinutes(1)), Is.False);

            _time.Advance(TimeSpan.FromSeconds(30));

            Assert.That(await _repository.TryAcquireAsync("key", 1, TimeSpan.FromMinutes(1)), Is.True);
        }

        [Test]
        public async Task TryAcquireAsync_ShouldCountKeysAndWindowLengthsSeparately()
        {
            await _repository.TryAcquireAsync("a", 1, TimeSpan.FromMinutes(1));

            Assert.That(await _repository.TryAcquireAsync("b", 1, TimeSpan.FromMinutes(1)), Is.True);
            Assert.That(await _repository.TryAcquireAsync("a", 1, TimeSpan.FromHours(1)), Is.True);
        }

        [Test]
        public async Task TryAcquireAsync_GivenParallelCalls_ShouldNeverLetMoreThanTheLimitThrough()
        {
            var results = await Task.WhenAll(Enumerable.Range(0, 30).Select(_ => _repository.TryAcquireAsync("busy", 5, TimeSpan.FromMinutes(1))));

            var allowed = results.Count(x => x);
            Assert.That(allowed, Is.InRange(1, 5));

            // the stored count never exceeds the limit either
            var entity = (await _table.QueryAsync<TableEntity>().ToListAsync()).Single();
            Assert.That(entity.GetInt32("Count"), Is.EqualTo(allowed));
        }

        [Test]
        public async Task DeleteBeforeAsync_ShouldDeleteOldDaysAndKeepTheOthers()
        {
            await _repository.TryAcquireAsync("old", 5, TimeSpan.FromMinutes(1));
            _time.Set(Start.AddDays(3));
            await _repository.TryAcquireAsync("recent", 5, TimeSpan.FromMinutes(1));

            var deleted = await _repository.DeleteBeforeAsync(DateOnly.FromDateTime(Start.AddDays(2).UtcDateTime));

            Assert.That(deleted, Is.EqualTo(1));
            var rows = await _table.QueryAsync<TableEntity>().ToListAsync();
            Assert.That(rows.Single().RowKey, Does.StartWith("recent|"));
        }

        [Test]
        public async Task DeleteBeforeAsync_ShouldDeleteMoreThanOneBatchOfAPartition()
        {
            for (var i = 0; i < 130; i++)
            {
                await _repository.TryAcquireAsync($"key{i}", 5, TimeSpan.FromMinutes(1));
            }

            var deleted = await _repository.DeleteBeforeAsync(DateOnly.FromDateTime(Start.AddDays(1).UtcDateTime));

            Assert.That(deleted, Is.EqualTo(130));
            Assert.That(await _table.QueryAsync<TableEntity>().ToListAsync(), Is.Empty);
        }
    }

    internal static class AsyncPageableExtensions
    {
        public static async Task<List<T>> ToListAsync<T>(this Azure.AsyncPageable<T> pageable)
            where T : notnull
        {
            var result = new List<T>();
            await foreach (var item in pageable)
            {
                result.Add(item);
            }

            return result;
        }
    }
}
