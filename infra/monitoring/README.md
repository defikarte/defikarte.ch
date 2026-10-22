# Monitoring and alerting

Watches whether the backend is running, returns AED data and whether that data is fresh. It alerts by email
(warnings) and by email + Azure mobile app push (critical).

## How it works

```
Availability test (production only, 3 locations, every 5 min)
        │  GET /api/health  (anonymous)
        ▼
HealthController ── reads sync-status.json (written by SimpleCacheTimer after every run)
        │  200 healthy / degraded   ·   503 unhealthy
        ▼
≥2 locations fail ──► ag-defikarte-critical (email + push)
Overpass sync failed / 5xx spike ──► ag-defikarte-warning (email)
No availability results for 1 h ──► ag-defikarte-critical
Log daily cap reached ──► ag-defikarte-warning
```

| Condition | Health response | Alert |
|---|---|---|
| Backend down / unreachable | timeout or 5xx | critical |
| Fewer than `HEALTH_MIN_AED_COUNT` AEDs | 503 `too-few-aeds` | critical |
| Last successful sync older than `HEALTH_MAX_DATA_AGE_MINUTES` | 503 `stale` | critical |
| Timer did not run for 45 min | 503 `timer-not-running` | critical |
| One failed Overpass sync, data still fresh | 200 `degraded` | warning (email) |
| ≥10 HTTP 5xx in 15 min | – | warning (email) |

Check by hand: `curl https://defikarte-backend.azurewebsites.net/api/health`

Staging has no availability test (cost). Its Overpass sync and 5xx alerts still apply. Check it by hand:
`curl https://defikarte-backend-staging.azurewebsites.net/api/health`

## Backend app settings (per slot)

| Setting | Default | Meaning |
|---|---|---|
| `HEALTH_MAX_DATA_AGE_MINUTES` | 60 | Data older than this → 503 → critical alert |
| `HEALTH_MIN_AED_COUNT` | 10000 | Fewer AEDs → 503 → critical alert |
| `BLOB_STORAGE_SYNC_STATUS_NAME` | `sync-status.json` | Blob next to the AED cache |

The defaults apply without configuration. Changing a value needs no redeploy:
```bash
az functionapp config appsettings set -g <rg> -n defikarte-backend [--slot staging] --settings HEALTH_MAX_DATA_AGE_MINUTES=45
```

## Deploy (one time, can be repeated)

Emails are passed on the command line so they don't end up in the public repository. Needs Contributor on the
resource group `Defikarte_app`.

```bash
az login
az account set --subscription <subscription>

az deployment group what-if -g Defikarte_app \
  -f infra/monitoring/main.bicep -p @infra/monitoring/main.parameters.json \
  -p alertEmails='["you@example.org"]' pushEmails='["your-azure-login@example.org"]'

az deployment group create -g Defikarte_app \
  -f infra/monitoring/main.bicep -p @infra/monitoring/main.parameters.json \
  -p alertEmails='["you@example.org"]' pushEmails='["your-azure-login@example.org"]' \
  --query properties.outputs.connectionString.value -o tsv
```

The Bicep creates the Log Analytics workspace (`log-defikarte`, 90 days retention, daily cap `dailyCapGb`) and
Application Insights (`appi-defikarte`) on top of it. The last command prints the connection string.

After the deployment:
1. Set the connection string on the Function App, both slots (both send to the same instance; check with
   `requests | summarize count() by cloud_RoleName` that the slots have different role names):
   ```bash
   az functionapp config appsettings set -g <rg> -n defikarte-backend --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection string>"
   az functionapp config appsettings set -g <rg> -n defikarte-backend --slot staging --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection string>"
   az functionapp config appsettings delete -g <rg> -n defikarte-backend [--slot staging] --setting-names APPINSIGHTS_INSTRUMENTATIONKEY
   ```
2. Install the **Azure** mobile app (iOS / Android), sign in with the `pushEmails` account and allow notifications.
3. Test it: Portal → Monitor → Alerts → Action groups → `ag-defikarte-critical` → **Test** → email + push.
4. Removing an environment from `environments` does not delete its test and alert (incremental deployment).
   Delete them by hand, e.g. the former staging test:
   ```bash
   az monitor metrics alert delete -g <rg> -n defikarte-staging-unavailable
   az resource delete -g <rg> -n defikarte-health-staging --resource-type Microsoft.Insights/webtests
   ```

Cost: about 26k test runs/month × ~USD 0.0005, plus 3 log alert rules, ≈ USD 15/month. Frequency and locations
are parameters in `main.bicep`.

## Finding logs

Portal → Application Insights:

- **Live metrics**: requests and failures in real time.
- **Function App → Log stream**: raw console output.
- **Failures / Performance**: endpoints by error rate and duration. Click a request to see all its logs.
- **Transaction search**: search by text, filter by type.
- **Logs**: KQL. The saved queries are under *Queries → Labels: defikarte*:
  - `defikarte: requests`: all requests, filter by `name` (endpoint), `resultCode`, `cloud_RoleName` (slot)
  - `defikarte: requests by source`: per client (`defikarte-web/<build>`, `defikarte-app-ios/<version>`, `defikarte-app-android/<version>`) and route
  - `defikarte: one request`: everything for one `operation_Id`
  - `defikarte: overpass sync history`, `defikarte: errors`, `defikarte: health checks`

Every log line written during an HTTP request has `customDimensions.Client`, `Origin`, `UserAgent` and `Route`, e.g.:

```kusto
traces
| where tostring(customDimensions.Client) startswith "defikarte-app-ios"
| order by timestamp desc
```
