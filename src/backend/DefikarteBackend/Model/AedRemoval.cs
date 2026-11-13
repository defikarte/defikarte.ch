using Azure;
using Azure.Data.Tables;

namespace DefikarteBackend.Model
{
    public static class AedRemovalStatus
    {
        /// <summary>Requested, hidden on the map, not yet deleted in OSM.</summary>
        public const string Pending = "pending";

        /// <summary>Deleted in OSM.</summary>
        public const string Applied = "applied";

        /// <summary>Deleted in OSM and confirmed as legitimate by an admin.</summary>
        public const string Verified = "verified";

        /// <summary>Brought back by an admin after it was deleted.</summary>
        public const string Restored = "restored";

        /// <summary>Stopped by an admin before it was deleted.</summary>
        public const string Cancelled = "cancelled";

        /// <summary>Could not be deleted in OSM, the AED is visible again.</summary>
        public const string Failed = "failed";

        public static readonly string[] All = [Pending, Applied, Verified, Restored, Cancelled, Failed];

        private static readonly Dictionary<string, string[]> Transitions = new()
        {
            [Pending] = [Applied, Verified, Cancelled, Failed],
            [Applied] = [Verified, Restored],
            [Verified] = [Restored],
        };

        public static bool CanTransition(string from, string to)
        {
            return Transitions.TryGetValue(from, out var allowed) && allowed.Contains(to);
        }
    }

    /// <summary>
    /// One request to remove an AED, stored in Table Storage as audit log. Contains no raw IPs.
    /// </summary>
    public class AedRemoval : ITableEntity
    {
        // yyyyMM of the request
        public string PartitionKey { get; set; } = string.Empty;

        // "{yyyyMM}-{guid}", this is the id used by the admin endpoints
        public string RowKey { get; set; } = string.Empty;

        public DateTimeOffset? Timestamp { get; set; }

        public ETag ETag { get; set; }

        public long NodeId { get; set; }

        public string Status { get; set; } = AedRemovalStatus.Pending;

        public string Reason { get; set; } = string.Empty;

        public string? Comment { get; set; }

        public string Reporter { get; set; } = string.Empty;

        /// <summary>The <c>x-functions-clientid</c> of the request.</summary>
        public string ClientId { get; set; } = string.Empty;

        /// <summary>HMAC of the install id of the caller, null for old clients. Never the raw id.</summary>
        public string? InstallIdHash { get; set; }

        /// <summary>HMAC of the IP of the caller. Never the raw IP.</summary>
        public string? IpHash { get; set; }

        public DateTimeOffset RequestedAt { get; set; }

        public DateTimeOffset ApplyAfter { get; set; }

        /// <summary>Set while an instance deletes in OSM, so a second instance does not do the same.</summary>
        public DateTimeOffset? ApplyStartedAt { get; set; }

        public int Attempts { get; set; }

        public DateTimeOffset? AppliedAt { get; set; }

        /// <summary><c>timer</c>, <c>request</c> (no delay) or <c>admin</c>.</summary>
        public string? AppliedBy { get; set; }

        public DateTimeOffset? VerifiedAt { get; set; }

        public string? VerifiedBy { get; set; }

        public DateTimeOffset? RestoredAt { get; set; }

        public DateTimeOffset? CancelledAt { get; set; }

        public long? ChangesetId { get; set; }

        /// <summary>The version of the node after the delete, needed to undelete it.</summary>
        public long? DeletedVersion { get; set; }

        /// <summary>Id of the node after a restore. Differs from <see cref="NodeId"/> if it had to be created anew.</summary>
        public long? RestoredNodeId { get; set; }

        public string? FailureReason { get; set; }

        /// <summary>JSON of <see cref="AedSnapshot"/>, taken at request and again right before the delete.</summary>
        public string? Snapshot { get; set; }

        [System.Runtime.Serialization.IgnoreDataMember]
        public string Id => RowKey;
    }

    /// <summary>What is needed to bring a deleted node back.</summary>
    public class AedSnapshot
    {
        public long Id { get; set; }

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public long? Version { get; set; }

        public Dictionary<string, string> Tags { get; set; } = [];
    }
}
