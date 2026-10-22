using DefikarteBackend.Model;

namespace DefikarteBackend.Helpers
{
    public static class HealthEvaluator
    {
        // SimpleCacheTimer runs every 15 minutes. Three missed runs mean the timer itself is not running.
        private static readonly TimeSpan TimerNotRunningAfter = TimeSpan.FromMinutes(45);

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

            if (status.LastAttemptUtc == null || nowUtc - status.LastAttemptUtc > TimerNotRunningAfter)
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
