# Mobile release setup (iOS / Android)

One-time setup required before `.github/workflows/build-mobile.yml` can build and publish
the Capacitor app in `src/app`.

The app was previously built with Expo/EAS. **No signing material exists in this repository** —
the credentials from that setup live only in EAS's managed credential store and must be exported
out of it once, then stored as GitHub secrets.

- App ID / bundle identifier: `ch.defikarte.app`
- App Store: <https://apps.apple.com/us/app/defikarte-ch/id1549569525>
- Play Store: <https://play.google.com/store/apps/details?id=ch.defikarte.app>

---

## 1. Export the Android upload keystore from EAS

```bash
npm i -g eas-cli
eas login
eas credentials -p android
```

Choose the production build profile → **Keystore** → **Download existing keystore**.
Note down the values EAS prints:

- keystore password
- key alias
- key password

> **This key cannot be regenerated.** It is the upload key registered with Google Play.
> If EAS no longer holds it, you must request an upload-key reset in the Play Console
> (Setup → App integrity → App signing) before Android releases can continue.

## 2. Export the iOS distribution certificate and provisioning profile from EAS

```bash
eas credentials -p ios
```

Choose the production build profile → **Credentials.json: Upload/Download credentials** →
**Download credentials from EAS to credentials.json**. This writes:

- the Apple Distribution certificate as a `.p12` (plus its password, shown in `credentials.json`)
- the App Store provisioning profile as a `.mobileprovision`

If EAS no longer holds them, simply regenerate both at <https://developer.apple.com/account/resources> —
unlike the Android key, iOS certificates are disposable.

Note the **profile name** (as shown in the Apple Developer portal) and your **Team ID**.

## 3. Create an App Store Connect API key

App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API** →
generate a key with the **App Manager** role. Download the `.p8` (only downloadable once) and note:

- Key ID
- Issuer ID

## 4. Create a Google Play service account

Play Console → **Setup → API access** → link a Google Cloud project → create a service account →
grant it **Release to testing tracks** permission on `ch.defikarte.app` → create a JSON key and
download it.

## 5. Verify the bundle identifier matches

The existing App Store listing (`id1549569525`) must use bundle id `ch.defikarte.app`, matching
`PRODUCT_BUNDLE_IDENTIFIER` in `src/app/ios/App/App.xcodeproj/project.pbxproj`. If the legacy
Expo app was published under a different identifier, TestFlight uploads will be rejected and the
identifier in the Xcode project must be changed to match the listing.

Likewise, check the current `versionCode` of the published Android app and the latest TestFlight
build number — see [Version numbers](#version-numbers) below.

---

## 6. Store everything as GitHub secrets

All secrets and variables go into the **`production`** GitHub Environment
(Settings → Environments → production), which the mobile workflow already uses for the web build
configuration.

Binary files must be base64-encoded first:

```bash
base64 -w0 upload.jks              > keystore.b64
base64 -w0 dist.p12                > cert.b64
base64 -w0 profile.mobileprovision > profile.b64
base64 -w0 AuthKey_XXXXXXXXXX.p8   > asc_key.b64
```

(On macOS use `base64 -i <file>`; on Windows PowerShell:
`[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload.jks"))`.)

### Secrets

| Secret | Source |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | base64 of the `.jks` from step 1 |
| `ANDROID_KEYSTORE_PASSWORD` | step 1 |
| `ANDROID_KEY_ALIAS` | step 1 |
| `ANDROID_KEY_PASSWORD` | step 1 |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | full contents of the JSON key from step 4 |
| `IOS_DIST_CERT_P12_BASE64` | base64 of the `.p12` from step 2 |
| `IOS_DIST_CERT_PASSWORD` | step 2 |
| `IOS_PROVISIONING_PROFILE_BASE64` | base64 of the `.mobileprovision` from step 2 |
| `ASC_KEY_ID` | step 3 |
| `ASC_ISSUER_ID` | step 3 |
| `ASC_PRIVATE_KEY_P8_BASE64` | base64 of the `.p8` from step 3 |

Already present and reused for the web bundle: `BACKEND_API_KEY`, `MAPTILER_API_KEY`.

### Variables

| Variable | Value |
| --- | --- |
| `APPLE_TEAM_ID` | your 10-character Apple Developer Team ID |
| `IOS_PROVISIONING_PROFILE_NAME` | exact name of the App Store provisioning profile |

Already present and reused: `BACKEND_API_URL`.

---

## Cutting a release

```bash
git tag v1.2.3
git push origin v1.2.3
```

This runs **Mobile: Build & Publish**, which:

1. builds the web bundle against the production backend, runs `cap sync`
2. produces a signed `.aab`, `.apk` (Android) and `.ipa` (iOS) as workflow artifacts
3. uploads the `.ipa` to TestFlight and the `.aab` to the Play **internal** testing track

To build without publishing — e.g. to produce an APK for manual QA — run the workflow manually
from the Actions tab (**Run workflow**) with `publish` unchecked. The manual run also lets you
pick a single platform and override the version name.

## Version numbers

- `versionName` / `MARKETING_VERSION` comes from the git tag (`v1.2.3` → `1.2.3`), or the
  `version` input on a manual run.
- `versionCode` / `CURRENT_PROJECT_VERSION` is the GitHub Actions run number, which only ever
  increases.

Both stores reject a build whose build number is not higher than the last one they accepted.
The run number starts low, so if the legacy Expo app already published a higher `versionCode`
or iOS build number, set the `MOBILE_BUILD_NUMBER_OFFSET` repository variable to a value that
lifts the run number above it (the workflow adds it to `github.run_number`).

## Notes

- The `.apk` artifact is signed with the **upload key** — it is for sideloading and QA only.
  Google Play re-signs the `.aab` with the app signing key it holds.
- The keystore, certificate and profile are only ever materialised in the runner's temp
  directory, and the iOS keychain is deleted at the end of the job.
