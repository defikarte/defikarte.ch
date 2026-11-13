using DefikarteBackend.Helpers;
using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Extensions.Logging;
using System.Net;

namespace DefikarteBackend.Functions
{
    public class HealthController
    {
        private readonly IServiceConfiguration _config;
        private readonly ISyncStatusRepository _syncStatusRepository;
        private readonly ILogger<HealthController> _logger;

        public HealthController(IServiceConfiguration config, ISyncStatusRepository syncStatusRepository, ILogger<HealthController> logger)
        {
            _config = config;
            _syncStatusRepository = syncStatusRepository;
            _logger = logger;
        }

        [Function("HEALTH")]
        [OpenApiOperation(operationId: "HEALTH", tags: ["HEALTH"], Summary = "Health of the backend and age of the AED data. Used by the availability tests.")]
        [OpenApiResponseWithBody(statusCode: HttpStatusCode.OK, contentType: "application/json", bodyType: typeof(HealthReport), Description = "Healthy or degraded (data still fresh).")]
        [OpenApiResponseWithBody(statusCode: HttpStatusCode.ServiceUnavailable, contentType: "application/json", bodyType: typeof(HealthReport), Description = "Unhealthy: no data, stale data or sync not running.")]
        public async Task<IActionResult> Get(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "health")] HttpRequest req)
        {
            HealthReport report;
            try
            {
                var status = await _syncStatusRepository.GetAsync().ConfigureAwait(false);
                report = HealthEvaluator.Evaluate(status, DateTime.UtcNow, _config.HealthMaxDataAgeMinutes, _config.HealthMinAedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed.");
                report = new HealthReport { MaxAgeMinutes = _config.HealthMaxDataAgeMinutes, Reasons = ["exception"] };
            }

            if (report.Status != HealthReport.Healthy)
            {
                _logger.LogWarning("Health {HealthStatus} reasons={HealthReasons}", report.Status, string.Join(",", report.Reasons));
            }

            req.HttpContext.Response.Headers.CacheControl = "no-store";
            return new ObjectResult(report)
            {
                StatusCode = report.Status == HealthReport.Unhealthy ? StatusCodes.Status503ServiceUnavailable : StatusCodes.Status200OK,
            };
        }
    }
}
