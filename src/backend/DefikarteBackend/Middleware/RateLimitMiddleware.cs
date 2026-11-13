using DefikarteBackend.Helpers;
using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Middleware;

namespace DefikarteBackend.Middleware
{
    /// <summary>
    /// Limits the calls of the functions that have a policy in <see cref="RateLimitPolicies"/>.
    /// A rejected call is not passed on and answers 429 (or 503 if the counters are needed but not available).
    /// </summary>
    public class RateLimitMiddleware : IFunctionsWorkerMiddleware
    {
        public const string InstallIdHeader = "x-defikarte-install-id";

        /// <summary>Key in <c>HttpContext.Items</c> of the hash of the install id, for the audit log.</summary>
        public const string InstallIdHashItem = "RateLimit.InstallIdHash";

        /// <summary>Key in <c>HttpContext.Items</c> of the hash of the IP, for the audit log.</summary>
        public const string IpHashItem = "RateLimit.IpHash";

        private readonly IRateLimitService _rateLimit;

        public RateLimitMiddleware(IRateLimitService rateLimit)
        {
            _rateLimit = rateLimit;
        }

        public static bool IsLimited(FunctionContext context)
        {
            return RateLimitPolicies.TryGet(context.FunctionDefinition.Name, out _);
        }

        public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
        {
            var httpContext = context.GetHttpContext();
            if (httpContext == null)
            {
                await next(context);
                return;
            }

            var decision = await _rateLimit.CheckAsync(
                context.FunctionDefinition.Name,
                httpContext.Request.Headers[InstallIdHeader].ToString(),
                ClientIpResolver.Resolve(httpContext));

            if (decision.InstallIdHash != null)
            {
                httpContext.Items[InstallIdHashItem] = decision.InstallIdHash;
            }

            if (decision.IpHash != null)
            {
                httpContext.Items[IpHashItem] = decision.IpHash;
            }

            if (decision.Outcome == RateLimitOutcome.Allowed)
            {
                await next(context);
                return;
            }

            var limited = decision.Outcome == RateLimitOutcome.Limited;
            httpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(decision.RetryAfter.TotalSeconds)).ToString();

            // the result is executed after the middleware returns, like the one of a function
            context.GetInvocationResult().Value = new ObjectResult(new
            {
                Message = limited ? "Too many requests. Please try again later." : "Temporarily not available. Please try again later.",
            })
            {
                StatusCode = limited ? StatusCodes.Status429TooManyRequests : StatusCodes.Status503ServiceUnavailable,
            };
        }
    }
}
