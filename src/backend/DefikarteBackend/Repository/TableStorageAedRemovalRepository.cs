using Azure;
using Azure.Data.Tables;
using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;

namespace DefikarteBackend.Repository
{
    public class TableStorageAedRemovalRepository : IAedRemovalRepository
    {
        private readonly TableClient _table;

        public TableStorageAedRemovalRepository(TableClient table)
        {
            _table = table;
        }

        public async Task AddAsync(AedRemoval removal)
        {
            await _table.AddEntityAsync(removal).ConfigureAwait(false);
        }

        public async Task<AedRemoval?> GetAsync(string id)
        {
            // the id is "{yyyyMM}-{guid}", the month is the partition
            var separator = id.IndexOf('-');
            if (separator <= 0)
            {
                return null;
            }

            var response = await _table.GetEntityIfExistsAsync<AedRemoval>(id[..separator], id).ConfigureAwait(false);
            return response.HasValue ? response.Value : null;
        }

        public async Task<IReadOnlyList<AedRemoval>> ListAsync(string? status, int max)
        {
            var result = new List<AedRemoval>();
            var query = string.IsNullOrEmpty(status)
                ? _table.QueryAsync<AedRemoval>()
                : _table.QueryAsync<AedRemoval>(x => x.Status == status);

            await foreach (var removal in query.ConfigureAwait(false))
            {
                result.Add(removal);
            }

            return result.OrderByDescending(x => x.RequestedAt).Take(max).ToList();
        }

        public async Task<AedRemoval?> FindPendingByNodeAsync(long nodeId)
        {
            await foreach (var removal in _table.QueryAsync<AedRemoval>(x => x.NodeId == nodeId && x.Status == AedRemovalStatus.Pending).ConfigureAwait(false))
            {
                return removal;
            }

            return null;
        }

        public async Task<IReadOnlyList<AedRemoval>> ListPendingAsync()
        {
            return await ListAsync(AedRemovalStatus.Pending, int.MaxValue).ConfigureAwait(false);
        }

        public async Task<bool> TryUpdateAsync(AedRemoval removal)
        {
            try
            {
                var response = await _table.UpdateEntityAsync(removal, removal.ETag, TableUpdateMode.Replace).ConfigureAwait(false);
                removal.ETag = response.Headers.ETag ?? removal.ETag;
                return true;
            }
            catch (RequestFailedException ex) when (ex.Status == 412)
            {
                return false;
            }
        }
    }
}
