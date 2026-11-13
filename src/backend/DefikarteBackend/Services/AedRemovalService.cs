using DefikarteBackend.Helpers;
using DefikarteBackend.Interfaces;
using DefikarteBackend.Model;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using OsmSharp;
using OsmSharp.Tags;

namespace DefikarteBackend.Services
{
    public class AedRemovalService : IAedRemovalService
    {
        // overpass needs some time to show the delete, the AED stays hidden until then
        private static readonly TimeSpan MarkerRetentionAfterDelete = TimeSpan.FromHours(48);

        // a claim of an instance that crashed is released after this time
        private static readonly TimeSpan ClaimTimeout = TimeSpan.FromMinutes(15);

        private const int MaxAttempts = 5;

        private readonly IAedRemovalRepository _repository;
        private readonly IOsmNodeService _osm;
        private readonly IUpdateGeoJsonCacheService _cache;
        private readonly IServiceConfiguration _config;
        private readonly TimeProvider _time;
        private readonly ILogger<AedRemovalService> _logger;

        public AedRemovalService(
            IAedRemovalRepository repository,
            IOsmNodeService osm,
            IUpdateGeoJsonCacheService cache,
            IServiceConfiguration config,
            TimeProvider time,
            ILogger<AedRemovalService> logger)
        {
            _repository = repository;
            _osm = osm;
            _cache = cache;
            _config = config;
            _time = time;
            _logger = logger;
        }

        public async Task<AedRemovalResult> RequestAsync(long nodeId, AedRemovalRequest request, string clientId, string? installIdHash = null, string? ipHash = null)
        {
            var existing = await _repository.FindPendingByNodeAsync(nodeId).ConfigureAwait(false);
            if (existing != null)
            {
                // make sure it is hidden, in case the first request failed after the row was written
                await HideAsync(existing).ConfigureAwait(false);
                return new AedRemovalResult(AedRemovalOutcome.Done, existing);
            }

            var node = await _osm.GetNodeAsync(nodeId).ConfigureAwait(false);
            if (node == null)
            {
                return new AedRemovalResult(AedRemovalOutcome.NotFound, Message: $"AED with Id: {nodeId} not found.");
            }

            // only AEDs can be removed through this API, never any other node
            if (!IsAed(node))
            {
                return new AedRemovalResult(AedRemovalOutcome.NotAnAed, Message: $"Node with Id: {nodeId} is not an AED.");
            }

            var now = _time.GetUtcNow();
            var month = now.ToString("yyyyMM");
            var removal = new AedRemoval
            {
                PartitionKey = month,
                RowKey = $"{month}-{Guid.NewGuid():N}",
                NodeId = nodeId,
                Status = AedRemovalStatus.Pending,
                Reason = request.Reason ?? string.Empty,
                Comment = request.Comment,
                Reporter = request.Reporter ?? string.Empty,
                ClientId = clientId,
                InstallIdHash = installIdHash,
                IpHash = ipHash,
                RequestedAt = now,
                ApplyAfter = now.AddHours(_config.AedRemovalDelayHours),
                Snapshot = SerializeSnapshot(node),
            };

            // fails closed: without the audit row nothing is removed
            await _repository.AddAsync(removal).ConfigureAwait(false);

            // warning on purpose, an alert on this message tells the admins that there is something to review
            _logger.LogWarning("AED removal requested: node {NodeId}, reason {Reason}, id {RemovalId}, applies after {ApplyAfter:u}", nodeId, removal.Reason, removal.Id, removal.ApplyAfter);

            if (_config.AedRemovalDelayHours <= 0)
            {
                return await ApplyAsync(removal, "request").ConfigureAwait(false);
            }

            await HideAsync(removal).ConfigureAwait(false);
            return new AedRemovalResult(AedRemovalOutcome.Done, removal);
        }

        public async Task<int> ApplyDueAsync()
        {
            var now = _time.GetUtcNow();
            var applied = 0;
            foreach (var removal in await _repository.ListPendingAsync().ConfigureAwait(false))
            {
                if (removal.ApplyAfter > now)
                {
                    continue;
                }

                try
                {
                    var result = await ApplyAsync(removal, "timer").ConfigureAwait(false);
                    if (result.Outcome == AedRemovalOutcome.Done)
                    {
                        applied++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Applying removal {RemovalId} failed", removal.Id);
                }
            }

            return applied;
        }

        public async Task<AedRemovalResult> VerifyAsync(string id, string verifiedBy)
        {
            var removal = await _repository.GetAsync(id).ConfigureAwait(false);
            if (removal == null)
            {
                return new AedRemovalResult(AedRemovalOutcome.NotFound, Message: $"Removal {id} not found.");
            }

            if (removal.Status == AedRemovalStatus.Pending)
            {
                var applied = await ApplyAsync(removal, "admin").ConfigureAwait(false);
                if (applied.Outcome != AedRemovalOutcome.Done || applied.Removal == null)
                {
                    return applied;
                }

                removal = applied.Removal;
            }

            if (!AedRemovalStatus.CanTransition(removal.Status, AedRemovalStatus.Verified))
            {
                return InvalidState(removal, AedRemovalStatus.Verified);
            }

            removal.Status = AedRemovalStatus.Verified;
            removal.VerifiedAt = _time.GetUtcNow();
            removal.VerifiedBy = verifiedBy;
            return await _repository.TryUpdateAsync(removal).ConfigureAwait(false)
                ? new AedRemovalResult(AedRemovalOutcome.Done, removal)
                : Conflict(removal);
        }

        public async Task<AedRemovalResult> CancelAsync(string id)
        {
            var removal = await _repository.GetAsync(id).ConfigureAwait(false);
            if (removal == null)
            {
                return new AedRemovalResult(AedRemovalOutcome.NotFound, Message: $"Removal {id} not found.");
            }

            if (!AedRemovalStatus.CanTransition(removal.Status, AedRemovalStatus.Cancelled) || IsClaimed(removal))
            {
                return InvalidState(removal, AedRemovalStatus.Cancelled);
            }

            removal.Status = AedRemovalStatus.Cancelled;
            removal.CancelledAt = _time.GetUtcNow();
            if (!await _repository.TryUpdateAsync(removal).ConfigureAwait(false))
            {
                return Conflict(removal);
            }

            await ShowAgainAsync(removal).ConfigureAwait(false);
            return new AedRemovalResult(AedRemovalOutcome.Done, removal);
        }

        public async Task<AedRemovalResult> RestoreAsync(string id)
        {
            var removal = await _repository.GetAsync(id).ConfigureAwait(false);
            if (removal == null)
            {
                return new AedRemovalResult(AedRemovalOutcome.NotFound, Message: $"Removal {id} not found.");
            }

            var snapshot = DeserializeSnapshot(removal.Snapshot);
            if (!AedRemovalStatus.CanTransition(removal.Status, AedRemovalStatus.Restored) || snapshot == null)
            {
                return InvalidState(removal, AedRemovalStatus.Restored);
            }

            var node = await _osm.RestoreNodeAsync(snapshot, removal.DeletedVersion, "Restore AED").ConfigureAwait(false);
            removal.Status = AedRemovalStatus.Restored;
            removal.RestoredAt = _time.GetUtcNow();
            removal.RestoredNodeId = node.Id;
            await SaveWithRetryAsync(removal).ConfigureAwait(false);

            // same id: replaces the removal marker in the local cache
            await _cache.AddOrUpdateFeaturesInLocalCacheAsync(GeoJsonConverter.Convert2GeoJson([node])).ConfigureAwait(false);
            return new AedRemovalResult(AedRemovalOutcome.Done, removal);
        }

        /// <summary>
        /// Deletes the node of a pending removal in OSM. The row is claimed first, so that two instances
        /// (or the timer and an admin) do not both delete.
        /// </summary>
        private async Task<AedRemovalResult> ApplyAsync(AedRemoval removal, string appliedBy)
        {
            if (removal.Status != AedRemovalStatus.Pending || IsClaimed(removal))
            {
                return InvalidState(removal, AedRemovalStatus.Applied);
            }

            removal.ApplyStartedAt = _time.GetUtcNow();
            removal.Attempts++;
            if (!await _repository.TryUpdateAsync(removal).ConfigureAwait(false))
            {
                return Conflict(removal);
            }

            Node? node;
            (long ChangesetId, long Version) deleted;
            try
            {
                node = await _osm.GetNodeAsync(removal.NodeId).ConfigureAwait(false);
                if (node == null)
                {
                    // somebody else deleted it in OSM already, nothing left to hide or show
                    return await FailAsync(removal, "The node does not exist in OSM anymore.", showAgain: false).ConfigureAwait(false);
                }

                if (!IsAed(node))
                {
                    return await FailAsync(removal, "The node is not an AED anymore.", showAgain: true).ConfigureAwait(false);
                }

                // the node may have changed during the delay, restore needs the latest state
                removal.Snapshot = SerializeSnapshot(node);
                deleted = await _osm.DeleteNodeAsync(node, $"Remove AED ({removal.Reason})").ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Deleting node {NodeId} of removal {RemovalId} failed (attempt {Attempts})", removal.NodeId, removal.Id, removal.Attempts);
                if (removal.Attempts >= MaxAttempts)
                {
                    return await FailAsync(removal, ex.Message, showAgain: true).ConfigureAwait(false);
                }

                // stays pending, the next timer run tries again
                removal.ApplyStartedAt = null;
                removal.FailureReason = ex.Message;
                await _repository.TryUpdateAsync(removal).ConfigureAwait(false);
                return new AedRemovalResult(AedRemovalOutcome.Failed, removal, ex.Message);
            }

            var now = _time.GetUtcNow();
            removal.Status = AedRemovalStatus.Applied;
            removal.AppliedAt = now;
            removal.AppliedBy = appliedBy;
            removal.ChangesetId = deleted.ChangesetId;
            removal.DeletedVersion = deleted.Version;
            removal.ApplyStartedAt = null;
            removal.FailureReason = null;
            await SaveWithRetryAsync(removal).ConfigureAwait(false);

            // from now on the marker has to last until overpass caught up
            await _cache.RemoveFeatureInLocalCacheAsync(removal.NodeId.ToString(), now.UtcDateTime + MarkerRetentionAfterDelete).ConfigureAwait(false);
            _logger.LogInformation("Deleted node {NodeId} for removal {RemovalId} by {AppliedBy}", removal.NodeId, removal.Id, appliedBy);
            return new AedRemovalResult(AedRemovalOutcome.Done, removal);
        }

        private async Task<AedRemovalResult> FailAsync(AedRemoval removal, string reason, bool showAgain)
        {
            removal.Status = AedRemovalStatus.Failed;
            removal.FailureReason = reason;
            removal.ApplyStartedAt = null;
            await SaveWithRetryAsync(removal).ConfigureAwait(false);

            _logger.LogError("Removal {RemovalId} of node {NodeId} failed: {Reason}", removal.Id, removal.NodeId, reason);
            if (showAgain)
            {
                await ShowAgainAsync(removal).ConfigureAwait(false);
            }

            return new AedRemovalResult(AedRemovalOutcome.Failed, removal, reason);
        }

        // The OSM call is done, so our state is saved even if somebody changed the row in the meantime.
        private async Task SaveWithRetryAsync(AedRemoval removal)
        {
            for (var attempt = 0; attempt < 3; attempt++)
            {
                if (await _repository.TryUpdateAsync(removal).ConfigureAwait(false))
                {
                    return;
                }

                var latest = await _repository.GetAsync(removal.Id).ConfigureAwait(false) ?? throw new InvalidOperationException($"Removal {removal.Id} vanished.");
                removal.ETag = latest.ETag;
            }

            throw new InvalidOperationException($"Could not save removal {removal.Id}.");
        }

        private Task HideAsync(AedRemoval removal)
        {
            return _cache.RemoveFeatureInLocalCacheAsync(removal.NodeId.ToString(), removal.ApplyAfter.UtcDateTime + MarkerRetentionAfterDelete);
        }

        private async Task ShowAgainAsync(AedRemoval removal)
        {
            var snapshot = DeserializeSnapshot(removal.Snapshot);
            if (snapshot == null)
            {
                return; // the next overpass sync shows it again, as soon as the marker is gone
            }

            var node = CreateNode(snapshot);
            node.TimeStamp = _time.GetUtcNow().UtcDateTime;
            await _cache.AddOrUpdateFeaturesInLocalCacheAsync(GeoJsonConverter.Convert2GeoJson([node])).ConfigureAwait(false);
        }

        private bool IsClaimed(AedRemoval removal)
        {
            return removal.ApplyStartedAt is { } started && _time.GetUtcNow() - started < ClaimTimeout;
        }

        private static bool IsAed(Node node)
        {
            return node.Tags != null && node.Tags.Contains("emergency", "defibrillator");
        }

        private static AedRemovalResult InvalidState(AedRemoval removal, string target)
        {
            return new AedRemovalResult(AedRemovalOutcome.InvalidState, removal, $"A removal that is {removal.Status} cannot become {target}.");
        }

        private static AedRemovalResult Conflict(AedRemoval removal)
        {
            return new AedRemovalResult(AedRemovalOutcome.InvalidState, removal, "The removal was changed by somebody else in the meantime.");
        }

        private static string SerializeSnapshot(Node node)
        {
            return JsonConvert.SerializeObject(new AedSnapshot
            {
                Id = node.Id ?? 0,
                Latitude = node.Latitude ?? 0,
                Longitude = node.Longitude ?? 0,
                Version = node.Version,
                Tags = node.Tags?.ToDictionary(x => x.Key, x => x.Value) ?? [],
            });
        }

        private static AedSnapshot? DeserializeSnapshot(string? json)
        {
            return string.IsNullOrEmpty(json) ? null : JsonConvert.DeserializeObject<AedSnapshot>(json);
        }

        private static Node CreateNode(AedSnapshot snapshot)
        {
            return new Node
            {
                Id = snapshot.Id,
                Version = (int?)snapshot.Version,
                Latitude = snapshot.Latitude,
                Longitude = snapshot.Longitude,
                Tags = new TagsCollection(snapshot.Tags.Select(x => new Tag(x.Key, x.Value))),
            };
        }
    }
}
