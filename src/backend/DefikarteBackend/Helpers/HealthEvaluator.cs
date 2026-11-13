using DefikarteBackend.Model;

namespace DefikarteBackend.Helpers
{
    public static class HealthEvaluator
    {
        public static HealthReport Evaluate(SyncStatus? status, DateTime nowUtc, int maxAgeMinutes, int minAedCount)
        {
            var report = new HealthReport { MaxAgeMinutes = maxAgeMinutes };
            if (status == null)
            {
                report.Reasons.Add("status-missing");
                return report;
            }

            report.AedCount = status.AedCount;
            report.LastSuccessUtc = status.LastSuccessUtc;
            report.LastAttemptUtc = status.LastAttemptUtc;
            report.ConsecutiveFailures = status.ConsecutiveFailures;

            if (status.LastSuccessUtc is { } lastSuccess)
            {
                report.AgeMinutes = (int)(nowUtc - lastSuccess).TotalMinutes;
                if (report.AgeMinutes > maxAgeMinutes)
                {
                    report.Reasons.Add("stale");
                }
            }
            else
            {
                report.Reasons.Add("stale");
            }

            if (status.AedCount < minAedCount)
            {
                report.Reasons.Add("too-few-aeds");
            }

            // The sync schedule differs per slot (OVERPASS_SYNC_SCHEDULE), and so does maxAgeMinutes. A fixed limit
            // would flag a slot that syncs less often (staging: hourly) as not running between two regular runs.
            if (status.LastAttemptUtc == null || nowUtc - status.LastAttemptUtc > TimeSpan.FromMinutes(maxAgeMinutes))
            {
                report.Reasons.Add("timer-not-running");
            }

            report.Status = report.Reasons.Count > 0
                ? HealthReport.Unhealthy
                : status.ConsecutiveFailures > 0 ? HealthReport.Degraded : HealthReport.Healthy;

            return report;
        }
    }
}
