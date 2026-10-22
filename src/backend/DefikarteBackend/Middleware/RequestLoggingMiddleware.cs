using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Middleware;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace DefikarteBackend.Middleware
{
    /// <summary>
    /// Adds the request source (client, origin, user agent, route) to all logs of an HTTP invocation
    /// and writes one summary line per request. No IPs or bodies are logged.
    /// </summary>
    public class RequestLoggingMiddleware : IFunctionsWorkerMiddleware
    {
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(ILogger<RequestLoggingMiddleware> logger)
        {
            _logger = logger;
        }

        public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
        {
            var httpContext = context.GetHttpContext();
            if (httpContext == null)
            {
                await next(context);
                return;
            }

            var request = httpContext.Request;
            var client = request.Headers["x-functions-clientid"].ToString();
            if (string.IsNullOrEmpty(client))
            {
                // the AED GeoJSON is loaded by MapLibre, which sends the client as query parameter
                client = request.Query["clientid"].ToString();
            }
            if (string.IsNullOrEmpty(client))
            {
                client = "unknown";
            }

            var scope = new Dictionary<string, object>
            {
                ["Client"] = client,
                ["Origin"] = request.Headers.Origin.ToString(),
                ["UserAgent"] = request.Headers.UserAgent.ToString(),
                ["Route"] = request.Path.Value ?? string.Empty,
            };

            using (_logger.BeginScope(scope))
            {
                var stopwatch = Stopwatch.StartNew();
                var statusCode = StatusCodes.Status500InternalServerError;
                try
                {
                    await next(context);
                    statusCode = GetStatusCode(context, httpContext);
                }
                finally
                {
                    _logger.LogInformation(
                        "HTTP {Method} {Route} -> {StatusCode} in {DurationMs} ms from {Client}",
                        request.Method, request.Path.Value, statusCode, stopwatch.ElapsedMilliseconds, client);
                }
            }
        }

        // The IActionResult is executed after the middleware returns, so the response status is not set yet.
        private static int GetStatusCode(FunctionContext context, HttpContext httpContext)
        {
            return context.GetInvocationResult().Value is IStatusCodeActionResult { StatusCode: { } statusCode }
                ? statusCode
                : httpContext.Response.StatusCode;
        }
    }
}
