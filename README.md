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

Made with [contributors-img](https://contributors-img.web.app).

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

**Backend:**

```bash
cd src/backend
dotnet test                       # NUnit tests (DefikarteBackend.Tests)
cd DefikarteBackend
func start                        # run the functions locally (http://localhost:7071/api)
```

The backend reads its settings from `src/backend/DefikarteBackend/local.settings.json` (not committed).
It needs `AzureWebJobsStorage` (Azure Storage connection string, or Azurite locally), the Overpass/OSM
settings (`OVERPASS_URL`, `OSM_API_URL`, `OSM_USER_NAME`, `OSM_API_TOKEN`), the blob names
(`BLOB_STORAGE_CONTAINER_NAME`, `BLOB_STORAGE_BLOB_NAME`, `BLOB_STORAGE_BLOB_NAME_V2`,
`BLOB_STORAGE_BLOB_NAME_LOCAL_V2`, `BLOB_STORAGE_SWISSBOUNDARIES`) and the address search
(`ADDRESS_SEARCH_URL`, `MAPTILER_API_KEY`); see
[ServiceConfiguration.cs](src/backend/DefikarteBackend/Configuration/ServiceConfiguration.cs).
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
