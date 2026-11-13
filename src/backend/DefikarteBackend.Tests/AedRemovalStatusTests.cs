using DefikarteBackend.Model;

namespace DefikarteBackend.Tests
{
    [TestFixture]
    public class AedRemovalStatusTests
    {
        [TestCase("pending", "applied")]
        [TestCase("pending", "verified")]
        [TestCase("pending", "cancelled")]
        [TestCase("pending", "failed")]
        [TestCase("applied", "verified")]
        [TestCase("applied", "restored")]
        [TestCase("verified", "restored")]
        public void CanTransition_ShouldAllowTheDocumentedTransitions(string from, string to)
        {
            Assert.That(AedRemovalStatus.CanTransition(from, to), Is.True);
        }

        [TestCase("pending", "restored")]
        [TestCase("applied", "cancelled")]
        [TestCase("applied", "pending")]
        [TestCase("verified", "cancelled")]
        [TestCase("verified", "applied")]
        [TestCase("cancelled", "verified")]
        [TestCase("restored", "verified")]
        [TestCase("failed", "applied")]
        [TestCase("unknown", "applied")]
        public void CanTransition_ShouldRejectEverythingElse(string from, string to)
        {
            Assert.That(AedRemovalStatus.CanTransition(from, to), Is.False);
        }
    }
}
