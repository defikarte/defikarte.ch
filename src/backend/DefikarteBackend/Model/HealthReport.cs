namespace DefikarteBackend.Model
{
    public class HealthReport
    {
        public const string Healthy = "healthy";
        public const string Degraded = "degraded";
        public const string Unhealthy = "unhealthy";

        public string Status { get; set; } = Unhealthy;

        public int AedCount { get; set; }

        public DateTime? LastSuccessUtc { get; set; }

        public DateTime? LastAttemptUtc { get; set; }

        public int? AgeMinutes { get; set; }

        public int MaxAgeMinutes { get; set; }

        public int ConsecutiveFailures { get; set; }

        public List<string> Reasons { get; set; } = [];
    }
}
