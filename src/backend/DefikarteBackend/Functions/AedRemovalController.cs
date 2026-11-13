using DefikarteBackend.Helpers;
using DefikarteBackend.Interfaces;
using DefikarteBackend.Middleware;
using DefikarteBackend.Model;
using DefikarteBackend.Validation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace DefikarteBackend.Functions
{
    /// <summary>
    /// Report an AED as permanently gone (public) and review the reports (admin only).
    /// </summary>
    public class AedRemovalController
    {
        private readonly IServiceConfiguration _config;
        private readonly IAedRemovalService _service;
        private readonly IAedRemovalRepository _repository;
        private readonly ILogger<AedRemovalController> _logger;

        public AedRemovalController(
            IServiceConfiguration config,
            IAedRemovalService service,
            IAedRemovalRepository repository,
            ILogger<AedRemovalController> logger)
        {
            _config = config;
            _service = service;
            _repository = repository;
            _logger = logger;
        }

        [Function("AED_REMOVAL_POST_V3")]
        [OpenApiOperation(operationId: "AED_REMOVAL_POST_V3", tags: ["AED_V3"], Summary = "Reports the AED with given ID as permanently gone. It is hidden right away and deleted in OSM after a delay, unless an admin cancels the report.")]
        [OpenApiParameter(name: "id", In = ParameterLocation.Path, Required = true, Type = typeof(long), Summary = "Id of the AED to remove.")]
        [OpenApiRequestBody("application/json", typeof(AedRemovalRequest))]
        [OpenApiResponseWithoutBody(statusCode: HttpStatusCode.Accepted, Description = "The report was accepted")]
        [OpenApiResponseWithBody(statusCode: HttpStatusCode.NotFound, contentType: "application/json", bodyType: typeof(object), Description = "The NotFound response.")]
        [OpenApiSecurity("api-key", SecuritySchemeType.ApiKey, In = OpenApiSecurityLocationType.Header, Name = "x-functions-key")]
        public async Task<IActionResult> Request(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "v3/aed/{id}/removal")] HttpRequest req, long id)
        {
            try
            {
                if (string.IsNullOrEmpty(_config.OsmApiToken) || string.IsNullOrEmpty(_config.OsmApiUrl))
                {
                    _logger.LogWarning("No valid configuration available for either token or osmApiUrl");
                    return new ObjectResult(new { Message = "Configuration error. Contact API-Admins." }) { StatusCode = StatusCodes.Status500InternalServerError };
                }

                var validationResult = await req.GetValidatedRequestAsync<AedRemovalRequest, AedRemovalRequestValidator>();
                if (validationResult == null || validationResult.IsValid == false)
                {
                    _logger.LogInformation($"Invalid request data: {JsonConvert.SerializeObject(validationResult?.Errors)}");
                    return validationResult?.ToBadRequest() ?? new BadRequestObjectResult(new { Message = "Request cannot be parsed. Body is not a valid JSON or null." });
                }

                var clientId = req.Headers["x-functions-clientid"].ToString();
                var installIdHash = req.HttpContext.Items[RateLimitMiddleware.InstallIdHashItem] as string;
                var ipHash = req.HttpContext.Items[RateLimitMiddleware.IpHashItem] as string;
                var result = await _service.RequestAsync(id, validationResult.Value, clientId, installIdHash, ipHash).ConfigureAwait(false);
                return result.Outcome switch
                {
                    AedRemovalOutcome.Done => new ObjectResult(new { applyAfter = result.Removal?.ApplyAfter }) { StatusCode = StatusCodes.Status202Accepted },
                    AedRemovalOutcome.NotFound => new ObjectResult(new { Message = result.Message }) { StatusCode = StatusCodes.Status404NotFound },
                    AedRemovalOutcome.NotAnAed => new BadRequestObjectResult(new { Message = result.Message }),
                    _ => new ObjectResult(new { Message = result.Message }) { StatusCode = StatusCodes.Status500InternalServerError },
                };
            }
            catch (JsonSerializationException ex)
            {
                _logger.LogError(ex.ToString());
                return new BadRequestObjectResult(new { ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.ToString());
                return new ObjectResult(new { ex.Message }) { StatusCode = StatusCodes.Status500InternalServerError };
            }
        }

        [Function("AED_REMOVALS_ADMIN_LIST")]
        public async Task<IActionResult> List(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "v3/aed-removals")] HttpRequest req)
        {
            if (!IsAdmin(req))
            {
                return new NotFoundResult();
            }

            var status = req.Query["status"].ToString();
            if (!string.IsNullOrEmpty(status) && !AedRemovalStatus.All.Contains(status))
            {
                return new BadRequestObjectResult(new { Message = $"Status must be one of: {string.Join(", ", AedRemovalStatus.All)}" });
            }

            var removals = await _repository.ListAsync(status, 200).ConfigureAwait(false);
            return new OkObjectResult(removals);
        }

        [Function("AED_REMOVALS_ADMIN_VERIFY")]
        public Task<IActionResult> Verify(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "v3/aed-removals/{id}/verify")] HttpRequest req, string id)
        {
            return RunAdminAsync(req, () => _service.VerifyAsync(id, req.Headers["x-admin-user"].ToString() is { Length: > 0 } user ? user : "admin"));
        }

        [Function("AED_REMOVALS_ADMIN_CANCEL")]
        public Task<IActionResult> Cancel(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "v3/aed-removals/{id}/cancel")] HttpRequest req, string id)
        {
            return RunAdminAsync(req, () => _service.CancelAsync(id));
        }

        [Function("AED_REMOVALS_ADMIN_RESTORE")]
        public Task<IActionResult> Restore(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "v3/aed-removals/{id}/restore")] HttpRequest req, string id)
        {
            return RunAdminAsync(req, () => _service.RestoreAsync(id));
        }

        private async Task<IActionResult> RunAdminAsync(HttpRequest req, Func<Task<AedRemovalResult>> action)
        {
            if (!IsAdmin(req))
            {
                return new NotFoundResult();
            }

            try
            {
                var result = await action().ConfigureAwait(false);
                return result.Outcome switch
                {
                    AedRemovalOutcome.Done => new OkObjectResult(result.Removal),
                    AedRemovalOutcome.NotFound => new ObjectResult(new { Message = result.Message }) { StatusCode = StatusCodes.Status404NotFound },
                    AedRemovalOutcome.InvalidState => new ObjectResult(new { Message = result.Message }) { StatusCode = StatusCodes.Status409Conflict },
                    _ => new ObjectResult(new { Message = result.Message }) { StatusCode = StatusCodes.Status500InternalServerError },
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.ToString());
                return new ObjectResult(new { ex.Message }) { StatusCode = StatusCodes.Status500InternalServerError };
            }
        }

        // (The route cannot start with admin, that is reserved by the functions host.) without a valid key, so they do not show up for others. No key configured: disabled.
        private bool IsAdmin(HttpRequest req)
        {
            var expected = _config.AdminApiKey;
            var actual = req.Headers["x-admin-key"].ToString();
            if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(actual))
            {
                return false;
            }

            return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(actual));
        }
    }
}
