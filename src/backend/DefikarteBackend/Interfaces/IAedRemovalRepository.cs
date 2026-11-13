using DefikarteBackend.Model;

namespace DefikarteBackend.Interfaces
{
    public interface IAedRemovalRepository
    {
        Task AddAsync(AedRemoval removal);

        Task<AedRemoval?> GetAsync(string id);

        /// <summary>Newest first. Without status all removals of the last months.</summary>
        Task<IReadOnlyList<AedRemoval>> ListAsync(string? status, int max);

        Task<AedRemoval?> FindPendingByNodeAsync(long nodeId);

        Task<IReadOnlyList<AedRemoval>> ListPendingAsync();

        /// <summary>Saves only if nobody changed the row since it was read. False if somebody did.</summary>
        Task<bool> TryUpdateAsync(AedRemoval removal);
    }
}
