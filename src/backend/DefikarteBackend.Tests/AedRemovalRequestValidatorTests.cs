using DefikarteBackend.Model;
using DefikarteBackend.Validation;

namespace DefikarteBackend.Tests
{
    [TestFixture]
    public class AedRemovalRequestValidatorTests
    {
        private readonly AedRemovalRequestValidator _validator = new();

        [TestCase("dismantled")]
        [TestCase("stolen")]
        [TestCase("destroyed")]
        [TestCase("incorrect")]
        public void Validate_GivenKnownReason_ShouldBeValid(string reason)
        {
            var result = _validator.Validate(new AedRemovalRequest { Reason = reason, Reporter = "Anna" });

            Assert.That(result.IsValid, Is.True);
        }

        [TestCase(null)]
        [TestCase("")]
        [TestCase("broken")]
        public void Validate_GivenMissingOrUnknownReason_ShouldBeInvalid(string? reason)
        {
            var result = _validator.Validate(new AedRemovalRequest { Reason = reason, Reporter = "Anna" });

            Assert.That(result.IsValid, Is.False);
        }

        [Test]
        public void Validate_GivenNoReporter_ShouldBeInvalid()
        {
            var result = _validator.Validate(new AedRemovalRequest { Reason = "stolen" });

            Assert.That(result.IsValid, Is.False);
        }

        [Test]
        public void Validate_GivenTooLongComment_ShouldBeInvalid()
        {
            var result = _validator.Validate(new AedRemovalRequest { Reason = "stolen", Reporter = "Anna", Comment = new string('x', 201) });

            Assert.That(result.IsValid, Is.False);
        }
    }
}
