namespace DefikarteBackend.Interfaces
{
    public interface IServiceConfiguration
    {
        string BlobStorageConnectionString { get; }

        string BlobStorageBlobName { get; }

        string BlobStorageBlobNameV2 { get; }

        string BlobStorageBlobNameLocalV2 { get; }

        string BlobStorageContainerName { get; }

        string BlobStorageSwissBoundariesName { get; }

        string OsmApiToken { get; }

        string OsmApiUrl { get; }

        string OsmUserName { get; }

        string OverpassApiUrl { get; }

        string AddressSearchUrl { get; }

        string MaptilerApiKey { get; }

        string BlobStorageSyncStatusName { get; }

        int HealthMaxDataAgeMinutes { get; }

        int HealthMinAedCount { get; }

        /// <summary>Hours between a removal request and the delete in OSM. 0 deletes immediately.</summary>
        int AedRemovalDelayHours { get; }

        string AedRemovalsTableName { get; }

        /// <summary>Secret for the admin endpoints. Empty disables them.</summary>
        string AdminApiKey { get; }
    }
}