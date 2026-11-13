using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace DefikarteBackend.Services
{
    public class RateLimitService : IRateLimitService
    {
        private readonly IRateLimitRepository _repository;
        private readonly IServiceConfiguration _config;
        private readonly TimeProvider _time;
        private readonly ILogger<RateLimitService> _logger;
        private int _warnedAboutMissingKey;

        public RateLimitService(IRateLimitRepository repository, IServiceConfiguration config, TimeProvider time, ILogger<RateLimitService> logger)
        {
            _repository = repository;
            _config = config;
            _time = time;
            _logger = logger;
        }

        public async Task<RateLimitDecision> CheckAsync(string functionName, string? installIdHeader, string? ip)
        {
            if (!RateLimitPolicies.TryGet(functionName, out var policy))
            {
                return Allowed(null, null);
            }

            if (string.IsNullOrEmpty(_config.RateLimitHashKey))
            {
                // without the secret there is nothing to count with, so the limit is off (local development)
                if (Interlocked.Exchange(ref _warnedAboutMissingKey, 1) == 0)
                {
                    _logger.LogWarning("RATE_LIMIT_HASH_KEY is not configured. The rate limit is disabled.");
                }

                return Allowed(null, null);
            }

            var installId = ParseInstallId(installIdHeader);
            var installIdHash = installId == null ? null : Hash("id", installId);
            var ipHash = string.IsNullOrEmpty(ip) ? null : Hash("ip", ip);

            var checks = new List<(string Scope, string Key, RateLimitRule Rule)>();
            if (installIdHash != null)
            {
                checks.AddRange(policy.PerCaller.Select(rule => ("id", Key(functionName, "id", installIdHash, rule), rule)));
                checks.AddRange(policy.PerIp.Where(_ => ipHash != null).Select(rule => ("ip", Key(functionName, "ip", ipHash!, rule), rule)));
            }
            else if (ipHash != null)
            {
                // no install id: only the IP is known, so it gets the tight limit
                checks.AddRange(policy.PerCaller.Select(rule => ("ip-strict", Key(functionName, "ipstrict", ipHash, rule), rule)));
            }

            // last, so calls that are rejected anyway do not use up the limit of everybody
            checks.AddRange(policy.Global.Select(rule => ("global", Key(functionName, "global", null, rule), rule)));

            foreach (var (scope, key, rule) in checks)
            {
                bool allowed;
                try
                {
                    allowed = await _repository.TryAcquireAsync(key, rule.Limit, rule.Window).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Rate limit storage failed for {Function}, {Mode}", functionName, policy.FailOpen ? "allowing the call" : "rejecting the call");
                    return policy.FailOpen
                        ? Allowed(installIdHash, ipHash)
                        : new RateLimitDecision(RateLimitOutcome.Unavailable, TimeSpan.FromMinutes(1), installIdHash, ipHash);
                }

                if (!allowed)
                {
                    // the key is not logged, not even hashed
                    _logger.LogWarning("Rate limit reached for {Function}, scope {Scope}, limit {Limit} per {Window}", functionName, scope, rule.Limit, rule.Window);
                    return new RateLimitDecision(RateLimitOutcome.Limited, GetRetryAfter(rule.Window), installIdHash, ipHash);
                }
            }

            return Allowed(installIdHash, ipHash);
        }

        /// <summary>Time until the fixed window that contains now is over.</summary>
        public TimeSpan GetRetryAfter(TimeSpan window)
        {
            var seconds = (long)window.TotalSeconds;
            var elapsed = _time.GetUtcNow().ToUnixTimeSeconds() % seconds;
            return TimeSpan.FromSeconds(seconds - elapsed);
        }

        /// <summary>The install id is a random uuid. Anything else is treated like no id, so it cannot be used to flood the table.</summary>
        public static string? ParseInstallId(string? value)
        {
            return Guid.TryParseExact(value?.Trim(), "D", out var id) ? id.ToString("D") : null;
        }

        private static string Key(string functionName, string kind, string? hash, RateLimitRule rule)
        {
            var window = (long)rule.Window.TotalSeconds;
            return hash == null ? $"{functionName}:{kind}:{window}" : $"{functionName}:{kind}:{hash}:{window}";
        }

        private static RateLimitDecision Allowed(string? installIdHash, string? ipHash)
        {
            return new RateLimitDecision(RateLimitOutcome.Allowed, TimeSpan.Zero, installIdHash, ipHash);
        }

        // HMAC-SHA256 with the secret from the configuration. The kind keeps an id and an ip with the same text apart.
        private string Hash(string kind, string value)
        {
            var bytes = HMACSHA256.HashData(Encoding.UTF8.GetBytes(_config.RateLimitHashKey), Encoding.UTF8.GetBytes($"{kind}:{value}"));
            return Convert.ToHexString(bytes)[..32].ToLowerInvariant();
        }
    }
}
