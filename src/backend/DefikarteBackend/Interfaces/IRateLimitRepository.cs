namespace DefikarteBackend.Interfaces
{
    public interface IRateLimitRepository
    {
        /// <summary>
        /// Counts one call of <paramref name="key"/> in the current fixed window (aligned to the unix epoch).
        /// True if it is within the limit, false if the limit is reached. The count is shared by all instances.
        /// </summary>
        Task<bool> TryAcquireAsync(string key, int limit, TimeSpan window);

        /// <summary>Deletes the counters of all days before <paramref name="cutoff"/>. Returns how many.</summary>
        Task<int> DeleteBeforeAsync(DateOnly cutoff);
    }
}
