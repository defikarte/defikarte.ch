import { Geolocation } from '@capacitor/geolocation';
import { type LocationProvider } from '@defikarte/shared';

export class CapacitorGeolocationService implements LocationProvider {
  private watchId: string | null = null;

  public async getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition | null> {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: options?.enableHighAccuracy,
      timeout: options?.timeout,
      maximumAge: options?.maximumAge,
    });

    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      },
      timestamp: position.timestamp,
    } as GeolocationPosition;
  }

  public watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options?: PositionOptions
  ): void {
    if (this.watchId !== null) return;

    void Geolocation.watchPosition(
      {
        enableHighAccuracy: options?.enableHighAccuracy,
        timeout: options?.timeout,
        maximumAge: options?.maximumAge,
      },
      (position, err) => {
        if (err) {
          errorCallback?.(err as unknown as GeolocationPositionError);
          return;
        }
        if (position) {
          successCallback({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          } as GeolocationPosition);
        }
      }
    ).then(id => {
      this.watchId = id;
    });
  }

  public clearWatch(): void {
    if (this.watchId !== null) {
      void Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }
}
