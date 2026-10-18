import "@testing-library/jest-dom";

// jsdom has no Geolocation API, but the geolocation service reads the error codes on import
if (typeof globalThis.GeolocationPositionError === 'undefined') {
  globalThis.GeolocationPositionError = {
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as unknown as typeof GeolocationPositionError;
}
