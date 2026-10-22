import { Capacitor } from '@capacitor/core';

export default class AppConfiguration {
  static readonly baseUrl =
    import.meta.env.VITE_BACKEND_API || 'https://defikarte-backend-staging.azurewebsites.net/api/';
  static readonly backendApiKey = import.meta.env.VITE_BACKEND_API_KEY || '';
  static readonly maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';
  static readonly appVersion = import.meta.env.VITE_APP_VERSION ?? 'dev';
  static readonly clientId = `defikarte-app-${Capacitor.getPlatform()}/${AppConfiguration.appVersion}`;
  static readonly baseLayerLocalStorageKey = 'ACTIVE_BASE_LAYER_ID';
  static readonly emergencyViewLocalStorageKey = 'EMERGENCY_VIEW_DEFAULT';
  static readonly locationLocalStorageKey = 'LOCATION_DEFAULT';
}
