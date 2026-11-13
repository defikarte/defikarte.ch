namespace DefikarteBackend.Tests
{
    internal sealed class FakeTimeProvider(DateTimeOffset start) : TimeProvider
    {
        private DateTimeOffset _now = start;

        public override DateTimeOffset GetUtcNow() => _now;

        public void Advance(TimeSpan by) => _now += by;

        public void Set(DateTimeOffset now) => _now = now;
    }
}
