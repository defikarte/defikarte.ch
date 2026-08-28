# defikarte.ch — Mobile App

The mobile app is a React + TypeScript app built with Vite. It is not React Native: the exact same
web bundle that Vite produces is packaged into a native iOS and Android shell by
[Capacitor](https://capacitorjs.com). Map and domain logic is shared with the web app in
[`src/web`](../web) through the `@defikarte/shared` workspace package.

## How Capacitor is used

Capacitor wraps the built web bundle in a native WebView and exposes native APIs to it through
plugins.

- **Configuration** — [`capacitor.config.ts`](capacitor.config.ts): app id `ch.defikarte.app`, app
  name `defikarte.ch`, `webDir: 'dist'`. `webDir` is the important part: the native apps load the
  **production build** from `dist/`, so `pnpm run build` always has to run before a sync.
- **Native projects are committed** — `android/` and `ios/` live in this repository. `cap sync`
  copies `dist/` into them and regenerates the plugin wiring (`android/app/capacitor.build.gradle`,
  `android/capacitor.settings.gradle`, `ios/App/CapApp-SPM/Package.swift`), so expect those files to
  show up as changes after every sync.
- **Geolocation** — [`src/services/capacitor-geolocation.service.ts`](src/services/capacitor-geolocation.service.ts)
  implements the shared `LocationProvider` interface on top of `@capacitor/geolocation`, and is
  handed to the map in [`src/features/map/Map.tsx`](src/features/map/Map.tsx). This is the pattern
  for native APIs: adapt the plugin to a shared interface instead of calling it from components.
  The required permissions are already declared natively (`ACCESS_COARSE_LOCATION` /
  `ACCESS_FINE_LOCATION` in `android/app/src/main/AndroidManifest.xml`,
  `NSLocationWhenInUseUsageDescription` in `ios/App/App/Info.plist`).
- **System bars** — [`src/routes/__root.tsx`](src/routes/__root.tsx) uses `SystemBars` from
  `@capacitor/core` to switch the status bar icon style per route, guarded by
  `Capacitor.isNativePlatform()`. Guard every native-only call the same way so the browser dev flow
  keeps working.
- **Edge-to-edge / safe areas** — the app draws under the system bars. `viewport-fit=cover` in
  [`index.html`](index.html) makes `env(safe-area-inset-*)` report real values on iOS, and
  [`src/app/styles/index.css`](src/app/styles/index.css) normalises those and Capacitor's
  Android-side `--safe-area-inset-*` variables into the `--sa-*` variables used across the UI.

## Prerequisites

- Node.js 24 and pnpm 10 (the versions the CI workflow uses)
- **Android**: Android Studio and a JDK 21
- **iOS**: macOS with Xcode. Dependencies are resolved via Swift Package Manager — no CocoaPods.

## Setup

```bash
cd src/app
pnpm install
cp .env.template .env   # then fill in the values
```

`.env` provides `VITE_BACKEND_API`, `VITE_BACKEND_API_KEY` and `VITE_MAPTILER_API_KEY`. These are
baked into the bundle at build time, so after changing them you have to rebuild **and** re-sync.

## Run in the browser

```bash
pnpm run dev
```

This is the fastest loop for UI work. Native-only code paths are skipped by the
`Capacitor.isNativePlatform()` guards, and geolocation falls back to whatever the browser provides.

## Run on Android

```bash
pnpm run build          # web bundle -> dist/
pnpm run sync:android   # cap sync android: copies dist/ + plugins into android/
npx cap open android    # opens the project in Android Studio -> press Run
```

Alternatively build from the command line after the sync:

```bash
cd android
./gradlew assembleDebug
```

## Run on iOS (macOS only)

```bash
pnpm run build
pnpm run sync:ios       # cap sync ios
npx cap open ios        # opens App.xcodeproj in Xcode -> select a signing team -> Run
```

> Run `sync:ios` only on macOS. On Windows the Capacitor CLI writes Windows-style backslash paths
> into `ios/App/CapApp-SPM/Package.swift`, which breaks the Xcode build — revert that file if it
> happens.

## Live reload on a device (optional)

To point the native shell at the dev server instead of the bundled `dist/`, add a `server` block to
[`capacitor.config.ts`](capacitor.config.ts):

```ts
server: {
  url: 'http://<your-lan-ip>:5173',
  cleartext: true,
},
```

Then run `pnpm run dev --host`, re-sync, and start the app. **Revert this change before committing** —
it would ship an app that loads from your machine.

## Adding a Capacitor plugin

```bash
pnpm add @capacitor/<plugin>
pnpm run sync:android    # and pnpm run sync:ios on macOS
```

Commit the regenerated native files, and add any required permission or usage description to
`AndroidManifest.xml` / `Info.plist`.

## Other scripts

```bash
pnpm run lint       # ESLint
pnpm run test       # Vitest
pnpm run preview    # serve the production build locally
```

## Releases

Release builds are automated: pushing a `v*` tag runs `.github/workflows/build-mobile.yml`, which
builds the bundle, runs `cap sync`, produces a signed `.aab` and `.ipa`, and publishes them to the
Play internal testing track and TestFlight. The one-time credential setup is documented in
[`docs/mobile-release-setup.md`](../../docs/mobile-release-setup.md).
