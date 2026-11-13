using DefikarteBackend.Interfaces;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace DefikarteBackend.Functions
{
    /// <summary>
    /// Deletes the AEDs in OSM whose removal request is older than the configured delay.
    /// </summary>
    public class AedRemovalApplyTimer
    {
        private readonly ILogger<AedRemovalApplyTimer> _logger;
        private readonly IAedRemovalService _service;

        public AedRemovalApplyTimer(ILogger<AedRemovalApplyTimer> logger, IAedRemovalService service)
        {
            _logger = logger;
            _service = service;
        }

        [Function(nameof(AedRemovalApplyTimer))]
        public async Task RunAsync([TimerTrigger("0 */10 * * * *")] TimerInfo myTimer)
        {
            try
            {
                var applied = await _service.ApplyDueAsync().ConfigureAwait(false);
                if (applied > 0)
                {
                    _logger.LogInformation("Deleted {Count} AEDs after their removal delay", applied);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error running {nameof(AedRemovalApplyTimer)}");
            }
        }
    }
}
