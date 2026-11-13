using DefikarteBackend.Interfaces;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace DefikarteBackend.Functions
{
    /// <summary>
    /// Table Storage has no time to live, so the counters of past days are deleted here.
    /// </summary>
    public class RateLimitCleanupTimer
    {
        private readonly ILogger<RateLimitCleanupTimer> _logger;
        private readonly IRateLimitRepository _repository;
        private readonly TimeProvider _time;

        public RateLimitCleanupTimer(ILogger<RateLimitCleanupTimer> logger, IRateLimitRepository repository, TimeProvider time)
        {
            _logger = logger;
            _repository = repository;
            _time = time;
        }

        [Function(nameof(RateLimitCleanupTimer))]
        public async Task RunAsync([TimerTrigger("0 0 3 * * *")] TimerInfo myTimer)
        {
            try
            {
                var yesterday = DateOnly.FromDateTime(_time.GetUtcNow().UtcDateTime).AddDays(-1);
                var deleted = await _repository.DeleteBeforeAsync(yesterday).ConfigureAwait(false);
                _logger.LogInformation("Deleted {Count} old rate limit counters", deleted);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error running {nameof(RateLimitCleanupTimer)}");
            }
        }
    }
}
