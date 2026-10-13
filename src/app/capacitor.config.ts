import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.defikarte.app',
  appName: 'defikarte.ch',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'defikarte.ch',
  },
  plugins: {
    SplashScreen: {
      // Nothing hides the launch splash on its own: src/routes/__root.tsx hides it only once the
      // in-app splash overlay has painted, so there is no blank frame between the two.
      // Android-only options such as androidSplashResourceName or androidScaleType are left out on
      // purpose - the plugin routes the launch splash through androidx.core:core-splashscreen,
      // where none of them apply.
      launchAutoHide: false,
      launchFadeOutDuration: 200,
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
