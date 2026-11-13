using DefikarteBackend.Model;
using OsmSharp;

namespace DefikarteBackend.Interfaces
{
    /// <summary>The OSM calls needed to delete and restore an AED.</summary>
    public interface IOsmNodeService
    {
        /// <summary>Null if the node does not exist (anymore).</summary>
        Task<Node?> GetNodeAsync(long id);

        /// <summary>Deletes the node in its own changeset and returns the changeset and the version after the delete.</summary>
        Task<(long ChangesetId, long Version)> DeleteNodeAsync(Node node, string comment);

        /// <summary>
        /// Brings a deleted node back, with the same id if OSM allows it, otherwise as a new node.
        /// </summary>
        Task<Node> RestoreNodeAsync(AedSnapshot snapshot, long? deletedVersion, string comment);
    }
}
