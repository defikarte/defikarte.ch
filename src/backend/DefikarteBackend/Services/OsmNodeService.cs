using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using Microsoft.Extensions.Logging;
using OsmSharp;
using OsmSharp.IO.API;
using OsmSharp.Tags;

namespace DefikarteBackend.Services
{
    public class OsmNodeService : IOsmNodeService
    {
        private static readonly HttpClient HttpClient = new();

        private readonly IServiceConfiguration _config;
        private readonly ILogger<OsmNodeService> _logger;

        public OsmNodeService(IServiceConfiguration config, ILogger<OsmNodeService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task<Node?> GetNodeAsync(long id)
        {
            return await CreateClient().GetNode(id).ConfigureAwait(false);
        }

        public async Task<(long ChangesetId, long Version)> DeleteNodeAsync(Node node, string comment)
        {
            var client = CreateClient();
            var changeSetId = await client.CreateChangeset(CreateChangesetTags(comment)).ConfigureAwait(false);

            node.ChangeSetId = changeSetId;
            var version = await client.DeleteElement(changeSetId, node).ConfigureAwait(false);
            await client.CloseChangeset(changeSetId).ConfigureAwait(false);
            return (changeSetId, version);
        }

        public async Task<Node> RestoreNodeAsync(AedSnapshot snapshot, long? deletedVersion, string comment)
        {
            var client = CreateClient();
            var changeSetId = await client.CreateChangeset(CreateChangesetTags(comment)).ConfigureAwait(false);
            long nodeId;

            try
            {
                // undelete: modify the deleted node, which brings it back with the same id
                var node = CreateNode(snapshot, changeSetId, snapshot.Id, deletedVersion);
                await client.UpdateElement(changeSetId, (OsmGeo)node).ConfigureAwait(false);
                nodeId = snapshot.Id;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not undelete node {NodeId}, creating a new node instead", snapshot.Id);
                var node = CreateNode(snapshot, changeSetId, null, null);
                nodeId = await client.CreateElement(changeSetId, node).ConfigureAwait(false);
            }

            await client.CloseChangeset(changeSetId).ConfigureAwait(false);
            return await client.GetNode(nodeId).ConfigureAwait(false)
                ?? throw new InvalidOperationException($"Restored node {nodeId} not found in OSM.");
        }

        private static Node CreateNode(AedSnapshot snapshot, long changeSetId, long? id, long? version)
        {
            return new Node
            {
                Id = id,
                Version = (int?)version,
                Latitude = snapshot.Latitude,
                Longitude = snapshot.Longitude,
                Tags = new TagsCollection(snapshot.Tags.Select(x => new Tag(x.Key, x.Value))),
                ChangeSetId = changeSetId,
            };
        }

        private TagsCollection CreateChangesetTags(string comment)
        {
            return new TagsCollection { new Tag("created_by", _config.OsmUserName), new Tag("comment", comment) };
        }

        private IAuthClient CreateClient()
        {
            if (string.IsNullOrEmpty(_config.OsmApiToken) || string.IsNullOrEmpty(_config.OsmApiUrl))
            {
                throw new InvalidOperationException("No valid configuration available for either token or osmApiUrl.");
            }

            return new ClientsFactory(_logger, HttpClient, _config.OsmApiUrl).CreateOAuth2Client(_config.OsmApiToken);
        }
    }
}
