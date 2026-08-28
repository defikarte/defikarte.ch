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

<a href="https://github.com/chnuessli/defikarte.ch/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=chnuessli/defikarte.ch" />
</a>

Made with [contributors-img](https://contributors-img.web.app).

## Open Source

Open Source und Open Data ist einer der Grund-Manifeste der Defikarte.

Wir untersützen folgende Open Source Initiativen:

- [OpenData Swiss](https://opendata.swiss/de/)

## Development Setup

This is a monorepo with three packages, wired together with pnpm workspaces:

- **`/src/app`** - React + Vite app, packaged as a native iOS & Android app with [Capacitor](https://capacitorjs.com)
- **`/src/web`** - React web application
- **`/src/shared`** - Shared code between app and web

`src/app` and `src/web` each link `../shared` as a workspace package, so dependencies are installed
per package.

### Prerequisites

- Node.js 24
- pnpm 10
- For mobile builds: Android Studio + JDK 21 (Android), macOS with Xcode (iOS)

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

### Mobile (Capacitor)

The app is not React Native - Capacitor wraps the built web bundle (`src/app/dist`) in a native
WebView and exposes native APIs through plugins, currently geolocation via `@capacitor/geolocation`
and the system bars via `@capacitor/core`. The native projects are committed under
`src/app/android` and `src/app/ios`, and the app id is `ch.defikarte.app`.

Because the native shells load the production build, `pnpm run build` has to run before every
`cap sync`. See [src/app/README.md](src/app/README.md) for the full workflow, and
[docs/mobile-release-setup.md](docs/mobile-release-setup.md) for signing and store releases.

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


**Code on**
<img src="images/GitHub_Logo.png" alt="drawing" width="60"/>
