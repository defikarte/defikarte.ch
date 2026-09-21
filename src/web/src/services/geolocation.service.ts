import { type LocationProvider } from '@defikarte/shared';

const locationErrorMessages = {
  [`${GeolocationPositionError.PERMISSION_DENIED}`]: 'locationPermissionDenied',
  [`${GeolocationPositionError.POSITION_UNAVAILABLE}`]: 'locationUnavailable',
  [`${GeolocationPositionError.TIMEOUT}`]: 'locationTimeout',
};

export class GeolocationService implements LocationProvider {
  private watchId = 0;

  public getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition | null> {
    return new Promise<GeolocationPosition | null>((resolve, reject) => {
      if (!navigator.geolocation) {
        const messageKey = locationErrorMessages[GeolocationPositionError.POSITION_UNAVAILABLE];
        reject(
          new Error(messageKey, {
            cause: {
              code: GeolocationPositionError.POSITION_UNAVAILABLE,
              message: 'Geolocation is not available',
            } as GeolocationPositionError,
          })
        );
        return;
      }

      const successCallback = (position: GeolocationPosition) => {
        resolve(position);
      };

      const errorCallback = (e: GeolocationPositionError) => {
        reject(new Error(locationErrorMessages[e.code], { cause: e }));
      };

      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    });
  }

  public watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options?: PositionOptions
  ): void {
    if (navigator.geolocation && this.watchId === 0) {
      this.watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, options);
    }
  }

  public clearWatch(): void {
    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = 0;
  }
}
