using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace DefikarteBackend.OsmOverpassApi
{
    public class OverpassClient
    {
        private readonly HttpClient _overpassHttpClient;
        private readonly ILogger<OverpassClient> _logger;

        public OverpassClient(IServiceConfiguration config, ILogger<OverpassClient> logger)
        {
            var overpassUrl = config.OverpassApiUrl;
            _overpassHttpClient = new HttpClient
            {
                BaseAddress = new Uri(overpassUrl, UriKind.Absolute),
            };
            _logger = logger;
        }

        public async Task<IList<OsmNode>> GetAllDefibrillatorsInSwitzerland()
        {
            using var request = new HttpRequestMessage
            {
                Method = HttpMethod.Post,
                Content = new StringContent(
                    "[out:json][timeout:90]; " +
                    "(area[\"ISO3166-1\" = \"CH\"][admin_level = 2]; area[\"ISO3166-1\" = \"LI\"][admin_level = 2];)->.searchArea;" +
                    "(node[\"emergency\" = \"defibrillator\"](area.searchArea);" +
                    "way[\"emergency\" = \"defibrillator\"](area.searchArea);" +
                    "relation[\"emergency\" = \"defibrillator\"](area.searchArea);" +
                    ");" +
                    "out body;>;out skel qt;"
                    ),
            };

            try
            {
                using var response = await _overpassHttpClient.SendAsync(request, HttpCompletionOption.ResponseContentRead);
                response.EnsureSuccessStatusCode();
                var responseContent = await response.Content.ReadAsStringAsync();
                return ParseResponse(responseContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Overpass request to {BaseAddress} failed", _overpassHttpClient.BaseAddress);
                throw;
            }
        }

        /// <summary>
        /// Parses an overpass response. Throws if the response is incomplete, so callers never replace valid cached data with it.
        /// </summary>
        public static IList<OsmNode> ParseResponse(string responseContent)
        {
            var json = JObject.Parse(responseContent);

            // Overpass returns HTTP 200 with a remark on runtime errors (timeout, out of memory). Elements are then empty or partial.
            if (json.TryGetValue("remark", out var remark))
            {
                throw new InvalidOperationException($"Overpass response contains a remark: {remark}");
            }

            if (!json.TryGetValue("elements", out var osmNodes) || osmNodes is not JArray jArray)
            {
                throw new InvalidOperationException("Overpass response contains no elements.");
            }

#pragma warning disable CS8619 // Nullability of reference types in value doesn't match target type.
            List<OsmNode> result = jArray.Select(x => x.ToObject<OsmNode>()).Where(node => node != null).ToList();
#pragma warning restore CS8619 // Nullability of reference types in value doesn't match target type.
            if (result.Count == 0)
            {
                throw new InvalidOperationException("Overpass response contains no elements.");
            }

            return result;
        }
    }
}
