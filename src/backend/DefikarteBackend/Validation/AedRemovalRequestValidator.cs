using DefikarteBackend.Model;
using FluentValidation;

namespace DefikarteBackend.Validation
{
    public class AedRemovalRequestValidator : AbstractValidator<AedRemovalRequest>
    {
        public static readonly string[] Reasons = ["dismantled", "stolen", "destroyed", "incorrect"];

        public AedRemovalRequestValidator()
        {
            RuleFor(x => x.Reason).NotEmpty().Must(x => Reasons.Contains(x)).WithMessage($"Reason must be one of: {string.Join(", ", Reasons)}");
            RuleFor(x => x.Reporter).NotEmpty().MaximumLength(200);
            RuleFor(x => x.Comment).MaximumLength(200);
        }
    }
}
