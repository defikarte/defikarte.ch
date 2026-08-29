// Post-processing for "pnpm run assets".
//
// capacitor-assets writes more than this app can use, and some of what it writes is wrong for us.
// Doing the corrections here instead of by hand means a regeneration cannot silently undo them.
//
//  1. The adaptive-icon XMLs it emits wrap both layers in a 16.7% <inset>, which shrinks the
//     background image so the masked icon ends up with transparent corners, and it knows nothing
//     about Android 13+ themed icons. They are rewritten from scratch, pointing the foreground at
//     the ic_defikarte_mark vector (see that file for why a vector and not the generated bitmap).
//  2. mipmap-*/ic_launcher_foreground.png is what that vector replaces - nothing references it.
//  3. drawable*/splash.png is never drawn on Android: @capacitor/splash-screen shows the launch
//     splash through androidx.core:core-splashscreen, whose Theme.SplashScreen pins
//     android:windowBackground to a layer of ?windowSplashScreenBackground plus one centred
//     ?windowSplashScreenAnimatedIcon. Keeping the bitmaps would add ~2 MB of dead weight to the
//     APK. The lockup is shown by the in-app splash overlay instead
//     (src/components/ui/splash-screen/SplashScreen.tsx).
//  4. The splash is white only, so any dark/night variant it generates gets dropped again.
import { copyFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const res = join(appDir, 'android/app/src/main/res');
const splashImageset = join(appDir, 'ios/App/App/Assets.xcassets/Splash.imageset');

const removed = [];
const remove = async path => {
  await rm(join(res, path), { force: true, recursive: true });
  removed.push(path);
};

// 1. adaptive icons
const adaptiveIcon = `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by scripts/fix-generated-assets.mjs - see that file before editing. -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_defikarte_mark" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>
`;

for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  await writeFile(join(res, 'mipmap-anydpi-v26', name), adaptiveIcon);
}

// The monochrome layer is a plain copy: only its alpha channel is used, the system tints it.
await copyFile(
  join(appDir, 'assets/icon-monochrome.png'),
  join(res, 'drawable/ic_launcher_monochrome.png')
);

// 2-4. drop what Android never draws, plus every dark/night variant
for (const dir of await readdir(res)) {
  if (dir.includes('-night')) {
    await remove(dir);
    continue;
  }

  if (dir.startsWith('drawable')) {
    await remove(join(dir, 'splash.png'));
  }

  if (dir.startsWith('mipmap')) {
    await remove(join(dir, 'ic_launcher_foreground.png'));
  }
}

// Directories that only ever held a splash are now empty.
for (const dir of await readdir(res)) {
  const entries = await readdir(join(res, dir));
  if (entries.length === 0) {
    await remove(dir);
  }
}

// iOS keeps the splash image, but only the light one.
const contents = { images: [], info: { version: 1, author: 'xcode' } };
for (const file of await readdir(splashImageset)) {
  if (file.endsWith('-dark.png')) {
    await rm(join(splashImageset, file));
    continue;
  }

  const scale = /@(\d)x/.exec(file);
  if (scale) {
    contents.images.push({ idiom: 'universal', filename: file, scale: `${scale[1]}x` });
  }
}

contents.images.sort((a, b) => a.scale.localeCompare(b.scale));
await writeFile(join(splashImageset, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);

console.log(`fix-generated-assets: adaptive icons rewritten, ${removed.length} generated paths dropped`);
