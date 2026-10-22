namespace DefikarteBackend.Model
{
    /// <summary>
    /// Result of the last overpass sync runs. Written by <c>SimpleCacheTimer</c>, read by the health endpoint.
    /// </summary>
    public class SyncStatus
    {
        public const string Success = "success";
        public const string RejectedTooFew = "rejected-too-few";
        public const string CacheWriteFailed = "cache-write-failed";
        public const string Error = "error";

        public DateTime? LastAttemptUtc { get; set; }

        public DateTime? LastSuccessUtc { get; set; }

        public string LastResult { get; set; } = string.Empty;

        public int AedCount { get; set; }

        public int ConsecutiveFailures { get; set; }

        /// <summary>
        /// Returns the status after a sync run. Success data (time, count) is only replaced by a successful run.
        /// </summary>
        public static SyncStatus Next(SyncStatus? previous, string result, int aedCount, DateTime nowUtc)
        {
            if (result == Success)
            {
                return new SyncStatus
                {
                    LastAttemptUtc = nowUtc,
                    LastSuccessUtc = nowUtc,
                    LastResult = result,
                    AedCount = aedCount,
                    ConsecutiveFailures = 0,
                };
            }

            return new SyncStatus
            {
                LastAttemptUtc = nowUtc,
                LastSuccessUtc = previous?.LastSuccessUtc,
                LastResult = result,
                AedCount = previous?.AedCount ?? 0,
                ConsecutiveFailures = (previous?.ConsecutiveFailures ?? 0) + 1,
            };
        }
    }
}
