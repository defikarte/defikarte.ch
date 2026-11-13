using Microsoft.AspNetCore.Http;
using System.Net;
using System.Net.Sockets;

namespace DefikarteBackend.Helpers
{
    /// <summary>
    /// Finds the IP of the caller behind the App Service front end.
    /// </summary>
    public static class ClientIpResolver
    {
        public static string? Resolve(HttpContext context)
        {
            return Resolve(
                context.Request.Headers["X-Forwarded-For"].ToString(),
                context.Request.Headers["X-Client-IP"].ToString(),
                context.Connection.RemoteIpAddress);
        }

        /// <summary>
        /// The last entry of X-Forwarded-For (added by the front end, everything before it is sent by the
        /// caller and can be faked), then X-Client-IP, then the connection. IPv6 addresses are reduced to
        /// their /64 network, because one client usually owns a whole /64. Null if nothing is usable.
        /// </summary>
        public static string? Resolve(string? forwardedFor, string? clientIp, IPAddress? remoteAddress)
        {
            var lastForwarded = forwardedFor?.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).LastOrDefault();
            return Normalize(lastForwarded) ?? Normalize(clientIp) ?? Normalize(remoteAddress?.ToString());
        }

        private static string? Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var text = value.Trim();
            if (text.StartsWith('['))
            {
                // [ipv6]:port
                var end = text.IndexOf(']');
                text = end > 0 ? text[1..end] : text;
            }
            else if (text.Count(c => c == ':') == 1)
            {
                // ipv4:port
                text = text[..text.IndexOf(':')];
            }

            if (!IPAddress.TryParse(text, out var address))
            {
                return null;
            }

            if (address.IsIPv4MappedToIPv6)
            {
                address = address.MapToIPv4();
            }

            if (address.AddressFamily == AddressFamily.InterNetworkV6)
            {
                var bytes = address.GetAddressBytes();
                Array.Clear(bytes, 8, 8);
                address = new IPAddress(bytes);
            }

            return address.ToString();
        }
    }
}
