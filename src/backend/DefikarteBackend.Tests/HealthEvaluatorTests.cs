using DefikarteBackend.Helpers;
using DefikarteBackend.Model;

namespace DefikarteBackend.Tests
{
    [TestFixture]
    public class HealthEvaluatorTests
    {
        private const int MaxAgeMinutes = 60;
        private const int MinAedCount = 10000;
        private static readonly DateTime Now = new(2026, 10, 22, 10, 0, 0, DateTimeKind.Utc);

        [Test]
        public void Evaluate_FreshSync_IsHealthy()
        {
            var status = SyncStatus.Next(null, SyncStatus.Success, 15000, Now.AddMinutes(-5));

            var report = HealthEvaluator.Evaluate(status, Now, MaxAgeMinutes, MinAedCount);

            Assert.That(report.Status, Is.EqualTo(HealthReport.Healthy));
            Assert.That(report.AgeMinutes, Is.EqualTo(5));
            Assert.That(report.Reasons, Is.Empty);
        }

        [Test]
        public void Evaluate_OneFailureWithFreshData_IsDegraded()
        {
            var success = SyncStatus.Next(null, SyncStatus.Success, 15000, Now.AddMinutes(-20));
            var status = SyncStatus.Next(success, SyncStatus.Error, 0, Now.AddMinutes(-5));

            var report = HealthEvaluator.Evaluate(status, Now, MaxAgeMinutes, MinAedCount);

            Assert.That(report.Status, Is.EqualTo(HealthReport.Degraded));
            Assert.That(report.ConsecutiveFailures, Is.EqualTo(1));
        }

        [Test]
        public void Evaluate_OldSuccess_IsStale()
        {
            var success = SyncStatus.Next(null, SyncStatus.Success, 15000, Now.AddMinutes(-90));
            var status = SyncStatus.Next(success, SyncStatus.Error, 0, Now.AddMinutes(-5));

            var report = HealthEvaluator.Evaluate(status, Now, MaxAgeMinutes, MinAedCount);

            Assert.That(report.Status, Is.EqualTo(HealthReport.Unhealthy));
            Assert.That(report.Reasons, Is.EqualTo(new[] { "stale" }));
        }

        [Test]
        public void Evaluate_TooFewAeds_IsUnhealthy()
        {
            var status = SyncStatus.Next(null, SyncStatus.Success, 50, Now.AddMinutes(-5));

            var report = HealthEvaluator.Evaluate(status, Now, MaxAgeMinutes, MinAedCount);

            Assert.That(report.Status, Is.EqualTo(HealthReport.Unhealthy));
            Assert.That(report.Reasons, Does.Contain("too-few-aeds"));
        }

        [Test]
        public void Evaluate_NoRecentAttempt_TimerNotRunning()
        {
            var status = SyncStatus.Next(null, SyncStatus.Success, 15000, Now.AddMinutes(-50));

            var report = HealthEvaluator.Evaluate(status, Now, MaxAgeMinutes, MinAedCount);

            Assert.That(report.Status, Is.EqualTo(HealthReport.Unhealthy));
            Assert.That(report.Reasons, Is.EqualTo(new[] { "timer-not-running" }));
        }

        [Test]
        public void Evaluate_NoStatus_IsUnhealthy()
        {
            var report = HealthEvaluator.Evaluate(null, Now, MaxAgeMinutes, MinAedCount);

            Assert.That(report.Status, Is.EqualTo(HealthReport.Unhealthy));
            Assert.That(report.Reasons, Is.EqualTo(new[] { "status-missing" }));
        }

        [Test]
        public void Next_Failure_KeepsLastSuccessAndCountsFailures()
        {
            var success = SyncStatus.Next(null, SyncStatus.Success, 15000, Now.AddMinutes(-30));

            var first = SyncStatus.Next(success, SyncStatus.RejectedTooFew, 0, Now.AddMinutes(-15));
            var second = SyncStatus.Next(first, SyncStatus.Error, 0, Now);

            Assert.That(second.LastSuccessUtc, Is.EqualTo(Now.AddMinutes(-30)));
            Assert.That(second.LastAttemptUtc, Is.EqualTo(Now));
            Assert.That(second.AedCount, Is.EqualTo(15000));
            Assert.That(second.ConsecutiveFailures, Is.EqualTo(2));
            Assert.That(second.LastResult, Is.EqualTo(SyncStatus.Error));
        }

        [Test]
        public void Next_Success_ResetsFailures()
        {
            var failure = SyncStatus.Next(null, SyncStatus.Error, 0, Now.AddMinutes(-15));

            var status = SyncStatus.Next(failure, SyncStatus.Success, 15100, Now);

            Assert.That(status.ConsecutiveFailures, Is.EqualTo(0));
            Assert.That(status.LastSuccessUtc, Is.EqualTo(Now));
            Assert.That(status.AedCount, Is.EqualTo(15100));
        }
    }
}
