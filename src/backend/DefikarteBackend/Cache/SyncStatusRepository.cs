using Azure.Storage.Blobs;
using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using DefikarteBackend.Repository;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace DefikarteBackend.Cache
{
    public class SyncStatusRepository : BlobStorageDataRepository, ISyncStatusRepository
    {
        private static readonly JsonSerializerSettings SerializerSettings = new()
        {
            ContractResolver = new DefaultContractResolver { NamingStrategy = new CamelCaseNamingStrategy() }
        };

        private readonly BlobContainerClient _containerClient;
        private readonly string _blobName;

        public SyncStatusRepository(BlobContainerClient containerClient, string blobName)
            : base(containerClient)
        {
            _containerClient = containerClient;
            _blobName = blobName;
        }

        public async Task<SyncStatus?> GetAsync()
        {
            if (!await ExistsAsync(_blobName).ConfigureAwait(false))
            {
                return null;
            }

            var content = await ReadAsync(_blobName).ConfigureAwait(false);
            return JsonConvert.DeserializeObject<SyncStatus>(content, SerializerSettings);
        }

        public async Task UpdateAsync(SyncStatus status)
        {
            var blobClient = _containerClient.GetBlobClient(_blobName);
            await blobClient.UploadAsync(BinaryData.FromString(JsonConvert.SerializeObject(status, SerializerSettings)), overwrite: true).ConfigureAwait(false);
        }
    }
}
