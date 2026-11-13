using Azure;
using Azure.Data.Tables;
using DefikarteBackend.Interfaces;

namespace DefikarteBackend.Repository
{
    /// <summary>
    /// Fixed window counter in Table Storage with optimistic concurrency, so it is exact across instances.
    /// One row per key and window: PartitionKey = day (yyyyMMdd UTC), RowKey = "{key}|{windowSeconds}|{windowStartUnix}".
    /// </summary>
    public class TableStorageRateLimitRepository : IRateLimitRepository
    {
        private const string CountProperty = "Count";
        private const int MaxTries = 3;

        private readonly TableClient _table;
        private readonly TimeProvider _time;

        public TableStorageRateLimitRepository(TableClient table, TimeProvider time)
        {
            _table = table;
            _time = time;
        }

        public async Task<bool> TryAcquireAsync(string key, int limit, TimeSpan window)
        {
            var windowStart = GetWindowStart(_time.GetUtcNow(), window);
            var partitionKey = windowStart.ToString("yyyyMMdd");
            var rowKey = $"{key}|{(long)window.TotalSeconds}|{windowStart.ToUnixTimeSeconds()}";

            for (var attempt = 0; attempt < MaxTries; attempt++)
            {
                var existing = await _table.GetEntityIfExistsAsync<TableEntity>(partitionKey, rowKey).ConfigureAwait(false);
                if (!existing.HasValue)
                {
                    try
                    {
                        await _table.AddEntityAsync(new TableEntity(partitionKey, rowKey) { [CountProperty] = 1 }).ConfigureAwait(false);
                        return true;
                    }
                    catch (RequestFailedException ex) when (ex.Status == 409)
                    {
                        continue; // somebody else was faster, read again
                    }
                }

                var entity = existing.Value!;
                var count = entity.GetInt32(CountProperty) ?? 0;
                if (count >= limit)
                {
                    return false;
                }

                entity[CountProperty] = count + 1;
                try
                {
                    await _table.UpdateEntityAsync(entity, entity.ETag, TableUpdateMode.Replace).ConfigureAwait(false);
                    return true;
                }
                catch (RequestFailedException ex) when (ex.Status == 412)
                {
                    // somebody else counted in the meantime, read again
                }
            }

            // so many parallel calls for the same key that it cannot be counted exactly: not allowed
            return false;
        }

        public async Task<int> DeleteBeforeAsync(DateOnly cutoff)
        {
            var filter = $"PartitionKey lt '{cutoff:yyyyMMdd}'";
            var rows = new List<TableEntity>();
            await foreach (var row in _table.QueryAsync<TableEntity>(filter, select: ["PartitionKey", "RowKey"]).ConfigureAwait(false))
            {
                rows.Add(row);
            }

            // a transaction is limited to 100 operations in one partition
            foreach (var partition in rows.GroupBy(x => x.PartitionKey))
            {
                foreach (var batch in partition.Chunk(100))
                {
                    await _table.SubmitTransactionAsync(batch.Select(x => new TableTransactionAction(TableTransactionActionType.Delete, x))).ConfigureAwait(false);
                }
            }

            return rows.Count;
        }

        /// <summary>Start of the fixed window that contains <paramref name="now"/>.</summary>
        public static DateTimeOffset GetWindowStart(DateTimeOffset now, TimeSpan window)
        {
            var seconds = (long)window.TotalSeconds;
            return DateTimeOffset.FromUnixTimeSeconds(now.ToUnixTimeSeconds() / seconds * seconds);
        }
    }
}
