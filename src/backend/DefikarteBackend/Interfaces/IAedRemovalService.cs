using DefikarteBackend.Model;

namespace DefikarteBackend.Interfaces
{
    public enum AedRemovalOutcome
    {
        Done,
        NotFound,
        NotAnAed,
        InvalidState,
        Failed,
    }

    public record AedRemovalResult(AedRemovalOutcome Outcome, AedRemoval? Removal = null, string? Message = null);

    public interface IAedRemovalService
    {
        /// <summary>
        /// Stores the request and hides the AED on the map. The delete in OSM follows after the configured delay.
        /// Returns the existing request if the AED already has a pending one.
        /// </summary>
        Task<AedRemovalResult> RequestAsync(long nodeId, AedRemovalRequest request, string clientId);

        /// <summary>Deletes all pending removals whose delay is over in OSM. Returns how many were deleted.</summary>
        Task<int> ApplyDueAsync();

        /// <summary>Confirms a removal. A still pending one is deleted in OSM right away.</summary>
        Task<AedRemovalResult> VerifyAsync(string id, string verifiedBy);

        /// <summary>Stops a pending removal and shows the AED again.</summary>
        Task<AedRemovalResult> CancelAsync(string id);

        /// <summary>Brings a deleted AED back in OSM and on the map.</summary>
        Task<AedRemovalResult> RestoreAsync(string id);
    }
}
