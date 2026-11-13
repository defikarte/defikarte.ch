<a href="https://www.defikarte.ch">
<img src="images/defi_logo.png" alt="defikarte.ch"/>
</a>

## Die Defikarte der Schweiz

Auf defikarte.ch sind derzeit über 15’000 Defibrillatoren mit ihrem Standort in der Schweiz und in Liechtenstein erfasst und täglich kommen weitere hinzu. Ziel ist es, durch einfachen Zugang zu den Defibrillatoren Leben zu retten.

### App

Die App zu Defikarte.ch findet man in den Stores des jeweiligen Anbieters.

<a href="https://apps.apple.com/us/app/defikarte-ch/id1549569525">
  <img src="images/appstore.svg" alt="appstore" />
</a>
<a href="https://play.google.com/store/apps/details?id=ch.defikarte.app">
  <img src="images/playstore.png" alt="playstore" style="height:40px;" />
</a>

## Awards

**_Nominierungen_**

- DINACon Award [Shortlist der Kategorie Community Award](https://awards.dinacon.ch/shortlist-2020/)

## Sponsoren

https://www.defikarte.ch/sponsors

Wir suchen Sponsoren
Die Kosten für die Infrastruktur, wie Backend-Dienste und die Publikation der Webseite, werden durch unsere Partner gedeckt. Es ist uns wichtig, kostendeckend und gemeinnützig zu arbeiten, um unabhängig zu bleiben. Überschüsse investieren wir in die Weiterentwicklung der Karte, um ihre Reichweite und ihren Nutzen zu erhöhen.

Von unserer Plattform profitieren viele Organisationen. Mit deiner Unterstützung hilfst du uns, dieses wichtige Projekt aufrechtzuerhalten. Als Sponsor bieten wir dir eine individuelle Lösung und eine würdige Anerkennung. Werde Teil unserer Mission, Leben zu retten! Melde dich bei uns – Wir freuen uns auf deine Nachricht.

## Contributors

<a href="https://github.com/defikarte/defikarte.ch/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=defikarte/defikarte.ch" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Open Source

Open Source und Open Data ist einer der Grund-Manifeste der Defikarte.

Wir untersützen folgende Open Source Initiativen:

- [OpenData Swiss](https://opendata.swiss/de/)

## Development Setup

This is a monorepo with three frontend packages, wired together with pnpm workspaces, and a .NET backend:

- **`/src/app`** - React + Vite app, packaged as a native iOS & Android app with [Capacitor](https://capacitorjs.com)
- **`/src/web`** - React web application
- **`/src/shared`** - Shared code between app and web
- **`/src/backend`** - Azure Functions backend (.NET 10, isolated worker) that serves the AED data and address search to app and web

`src/app` and `src/web` each link `../shared` as a workspace package, so dependencies are installed
per package.

### Prerequisites

- Node.js 24
- pnpm 10
- For mobile builds: Android Studio + JDK 21 (Android), macOS with Xcode (iOS)
- For the backend: .NET 10 SDK and [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)

### Installation

```bash
cd src/app
pnpm install

cd ../web
pnpm install
```

Both packages read their configuration from a local `.env` file - copy `.env.template` and fill in
the values.

### Running the Projects

**Mobile App:**

```bash
cd src/app
pnpm run dev            # browser dev server
pnpm run build          # web bundle into dist/ (this is what Capacitor ships)
pnpm run sync:android   # copy dist/ + plugins into the Android project
pnpm run sync:ios       # same for iOS (macOS only)
npx cap open android    # open in Android Studio to run on a device/emulator
npx cap open ios        # open in Xcode
```

**Web Application:**

```bash
cd src/web
pnpm run dev        # Start development server
pnpm run build      # Build for production
```

The fullscreen map is at `/map`, its position in the hash (`#zoom/lat/lon`). `/map/aed/<OSM node id>`
opens that AED's detail view directly, e.g. `/map/aed/6636784162#18/47.134491/7.230301`. This is the
link to use for a single AED, for example in the defi_data change report mails. The hosting needs to
serve `index.html` for these paths.

**Backend:**

```bash
cd src/backend
dotnet test                       # NUnit tests (DefikarteBackend.Tests)
cd DefikarteBackend
func start                        # run the functions locally (http://localhost:7071/api)
```

The backend reads its settings from `src/backend/DefikarteBackend/local.settings.json` (not committed). Copy
[local.settings.template.json](src/backend/DefikarteBackend/local.settings.template.json) and fill in the empty
values. On Azure the same names are app settings (one set per slot). All settings are read in
[ServiceConfiguration.cs](src/backend/DefikarteBackend/Configuration/ServiceConfiguration.cs).

| Setting | Required | Default / example | Purpose |
|---|---|---|---|
| `AzureWebJobsStorage` | yes | `UseDevelopmentStorage=true` (Azurite) | Storage account connection string for blobs and tables |
| `OVERPASS_URL` | yes | `https://overpass.osm.ch/api/interpreter` | Overpass API to load the AEDs from |
| `OVERPASS_SYNC_SCHEDULE` | yes | `0 */15 * * * *` | NCRONTAB schedule of the sync, differs per slot |
| `OSM_API_URL` | yes | `https://master.apis.dev.openstreetmap.org/api/` | OSM API for creating, changing and deleting AEDs (dev server here) |
| `OSM_USER_NAME` | yes | empty | OSM account that writes the changes |
| `OSM_API_TOKEN` | yes | empty | OAuth token of that account (secret) |
| `BLOB_STORAGE_CONTAINER_NAME` | yes | `defikarte-cache-local` | Blob container, one per slot |
| `BLOB_STORAGE_BLOB_NAME` | yes | `osm-cache-local` | AED cache, v1 |
| `BLOB_STORAGE_BLOB_NAME_V2` | yes | `osm-cache-v2` | AED cache, v2 |
| `BLOB_STORAGE_BLOB_NAME_LOCAL_V2` | yes | `local-cache-v2` | AED cache with the local data, v2 |
| `BLOB_STORAGE_SWISSBOUNDARIES` | yes | `swissboundaries3d_2024-01_4326.geojson` | Swiss boundaries GeoJSON blob |
| `BLOB_STORAGE_SYNC_STATUS_NAME` | no | `sync-status.json` | Blob next to the AED cache with the sync status |
| `ADDRESS_SEARCH_URL` | yes | `https://api3.geo.admin.ch/rest/services/api/SearchServer` | Address search endpoint |
| `MAPTILER_API_KEY` | yes | empty | MapTiler key for the address search (secret) |
| `AED_REMOVAL_DELAY_HOURS` | no | `24` | Time between a removal report and the delete in OSM, `0` deletes at once. The AED is hidden on the map right away |
| `AED_REMOVALS_TABLE_NAME` | no | `aedremovals` | Table of the removal requests, one per slot |
| `ADMIN_API_KEY` | no | empty | Key for the review endpoints (header `x-admin-key`), without it they are disabled (secret) |
| `RATE_LIMIT_HASH_KEY` | no | empty | Secret for the HMAC of install ids and IPs, without it the rate limit is off (secret) |
| `RATE_LIMIT_TABLE_NAME` | no | `ratelimits` | Table of the rate limit counters, one per slot |
| `HEALTH_MAX_DATA_AGE_MINUTES` | no | `60` | Health check: maximum age of the AED data, set it per slot to match the sync schedule |
| `HEALTH_MIN_AED_COUNT` | no | `10000` | Health check: minimum number of AEDs |

The review endpoints are `GET /api/v3/aed-removals` and `POST /api/v3/aed-removals/{id}/verify|cancel|restore`.
The limits per endpoint are in [RateLimit.cs](src/backend/DefikarteBackend/Model/RateLimit.cs). The clients send
`x-defikarte-install-id` with the calls that change data, so CORS (`Host.CORS`) has to allow that header.
The current API is `v3` (`/api/v3/aed`, `/api/v3/search/{searchText}`), and the app and web point to
it via `VITE_BACKEND_API` in their `.env`.

### Mobile (Capacitor)

The app is not React Native - Capacitor wraps the built web bundle (`src/app/dist`) in a native
WebView and exposes native APIs through plugins, currently geolocation via `@capacitor/geolocation`
and the system bars via `@capacitor/core`. The native projects are committed under
`src/app/android` and `src/app/ios`, and the app id is `ch.defikarte.app`.

Because the native shells load the production build, `pnpm run build` has to run before every
`cap sync`. See [src/app/README.md](src/app/README.md) for the full workflow, and
[docs/mobile-release-setup.md](docs/mobile-release-setup.md) for signing and store releases.

### CI/CD Pipelines

| Workflow | Trigger | What it does |
| --- | --- | --- |
| **Web: Build and Deploy** (`deploy-web.yml`) | push to `main` / `dev` touching `src/web` | builds the web app and deploys it to defikarte.ch (`main` → production, `dev` → staging) |
| **Mobile: Build** (`build-mobile.yml`) | push to `main` touching `src/app` / `src/shared`, or manual on any branch | builds signed `.apk`, `.aab` and `.ipa`, creates the version tag and a GitHub release (prerelease `-beta` off `main`) |
| **Mobile: Deploy to Stores** (`deploy-mobile.yml`) | after a release-producing mobile build, or manual with a release tag | uploads the `.aab` to the Play internal track and the `.ipa` to TestFlight |
| **Defikarte-Backend** (`deploy-backend.yml`) | push to `main` / `development` touching `src/backend`, or manual | runs the backend tests, builds and deploys the Azure Function `defikarte-backend` (`main` → production slot, otherwise staging slot) |

The backend deployment uses the GitHub environments `production` and `staging`. Each one needs the
secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` and the variable `AZURE_FUNCTIONAPP_SLOT_NAME`.

Mobile versions are `MAJOR.MINOR.<build number>` (e.g. `1.0.52` = Android `versionCode` 52 = iOS
build 52). Bump `MAJOR.MINOR` via `version` in `src/app/package.json`. The tags are created by the
workflow, so don't push version tags by hand. Details:
[docs/mobile-release-setup.md](docs/mobile-release-setup.md).

### Shared Code

The `/shared` folder contains utilities and hooks that are used by both the app and web projects. See `/shared/README.md` for more details.

**Example usage:**

```typescript
import {
  formatCoordinates,
  calculateDistance,
  useDebounce,
} from "@defikarte/shared";
```
