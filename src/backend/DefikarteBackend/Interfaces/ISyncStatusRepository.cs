using DefikarteBackend.Model;

namespace DefikarteBackend.Interfaces
{
    public interface ISyncStatusRepository
    {
        Task<SyncStatus?> GetAsync();

        Task UpdateAsync(SyncStatus status);
    }
}
