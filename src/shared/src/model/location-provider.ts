export interface LocationProvider {
  getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition | null>;
  watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options?: PositionOptions
  ): void;
  clearWatch(): void;
}
