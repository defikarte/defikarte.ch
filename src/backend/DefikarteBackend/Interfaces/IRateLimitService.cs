using DefikarteBackend.Model;

namespace DefikarteBackend.Interfaces
{
    public interface IRateLimitService
    {
        /// <summary>
        /// Counts the call of a function against its policy. Only a hash of the install id and the IP is
        /// used for the counters and returned, never the raw values.
        /// </summary>
        /// <param name="functionName">Name of the function, must have a policy.</param>
        /// <param name="installIdHeader">Value of the install id header, null or invalid if the client has none.</param>
        /// <param name="ip">IP of the caller, null if unknown.</param>
        Task<RateLimitDecision> CheckAsync(string functionName, string? installIdHeader, string? ip);
    }
}
