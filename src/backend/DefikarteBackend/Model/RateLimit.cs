namespace DefikarteBackend.Model
{
    /// <summary>At most <paramref name="Limit"/> calls per <paramref name="Window"/>.</summary>
    public record RateLimitRule(int Limit, TimeSpan Window);

    /// <summary>
    /// What is limited for one function.
    /// </summary>
    /// <param name="PerCaller">
    /// Tight rules for one caller, which is the anonymous install id. Callers without a valid install id
    /// (old app versions, scripts) are limited by their IP with these rules.
    /// </param>
    /// <param name="PerIp">Loose rules for one IP, so rotating install ids does not help.</param>
    /// <param name="Global">Rules for all callers together, because install ids and IPs can both be rotated.</param>
    /// <param name="FailOpen">
    /// Whether a call is allowed if the counters cannot be read. Reports of a missing AED must not be blocked
    /// by a storage hiccup, a removal must not go through without a limit.
    /// </param>
    public record RateLimitPolicy(
        IReadOnlyList<RateLimitRule> PerCaller,
        IReadOnlyList<RateLimitRule> PerIp,
        IReadOnlyList<RateLimitRule> Global,
        bool FailOpen);

    public enum RateLimitOutcome
    {
        Allowed,
        Limited,

        /// <summary>The counters are not available and the policy does not allow calls without them.</summary>
        Unavailable,
    }

    /// <summary>The hashes are null if the caller sent no valid install id or the IP is unknown.</summary>
    public record RateLimitDecision(RateLimitOutcome Outcome, TimeSpan RetryAfter, string? InstallIdHash, string? IpHash);

    /// <summary>
    /// The limited functions. To limit another endpoint, add its function name here.
    /// </summary>
    public static class RateLimitPolicies
    {
        private static readonly RateLimitPolicy Write = new(
            PerCaller: [new RateLimitRule(2, TimeSpan.FromMinutes(1))],
            PerIp: [new RateLimitRule(20, TimeSpan.FromMinutes(1))],
            Global: [],
            FailOpen: true);

        private static readonly RateLimitPolicy Removal = new(
            PerCaller: [new RateLimitRule(2, TimeSpan.FromHours(1)), new RateLimitRule(5, TimeSpan.FromDays(1))],
            PerIp: [new RateLimitRule(10, TimeSpan.FromDays(1))],
            Global: [new RateLimitRule(20, TimeSpan.FromDays(1))],
            FailOpen: false);

        private static readonly Dictionary<string, RateLimitPolicy> Policies = new()
        {
            ["AED_POST_V3"] = Write,
            ["AED_PUT_V3"] = Write,
            ["AED_REMOVAL_POST_V3"] = Removal,
        };

        public static bool TryGet(string functionName, out RateLimitPolicy policy)
        {
            return Policies.TryGetValue(functionName, out policy!);
        }
    }
}
