import { Geolocation, type PermissionStatus, type Position } from '@capacitor/geolocation';
import { type LocationProvider } from '@defikarte/shared';

// https://github.com/ionic-team/capacitor-geolocation#errors
const errorCodeKeys: Record<string, string> = {
  'OS-PLUG-GLOC-0003': 'locationPermissionDenied',
  'OS-PLUG-GLOC-0008': 'locationPermissionDenied',
  'OS-PLUG-GLOC-0007': 'locationUnavailable',
  'OS-PLUG-GLOC-0009': 'locationUnavailable',
  'OS-PLUG-GLOC-0017': 'locationUnavailable',
  'OS-PLUG-GLOC-0010': 'locationTimeout',
};

/** maps a capacitor geolocation error to the i18n key shown to the user */
const toErrorKey = (error: unknown): string => {
  const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown };
  if (typeof code === 'string' && errorCodeKeys[code]) {
    return errorCodeKeys[code];
  }

  const text = typeof message === 'string' ? message : '';
  if (/denied|permission|restricted/i.test(text)) {
    return 'locationPermissionDenied';
  }
  if (/not enabled|disabled|turned off/i.test(text)) {
    return 'locationUnavailable';
  }
  if (/timeout|in time/i.test(text)) {
    return 'locationTimeout';
  }
  return 'unknownLocationErrorOccurred';
};

const toGeolocationPosition = (position: Position): GeolocationPosition =>
  ({
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
  }) as GeolocationPosition;

const toPositionError = (error: unknown): GeolocationPositionError =>
  ({ code: 0, message: toErrorKey(error) }) as GeolocationPositionError;

// the plugin itself is satisfied with an approximate location
const isGranted = (status: PermissionStatus): boolean =>
  status.location === 'granted' || status.coarseLocation === 'granted';

export class CapacitorGeolocationService implements LocationProvider {
  // the native watch id arrives asynchronously, so the pending call is tracked to let clearWatch()
  // cancel a watch that is still being set up
  private pendingWatch: Promise<string | null> | null = null;
  // getCurrentPosition and watchPosition each request the permission natively, but android only
  // handles one request at a time and rejects the other one as denied - so both share this one
  private permissionRequest: Promise<void> | null = null;

  private ensurePermission(): Promise<void> {
    this.permissionRequest ??= (async () => {
      if (isGranted(await Geolocation.checkPermissions())) {
        return;
      }

      const status = await Geolocation.requestPermissions({
        permissions: ['location', 'coarseLocation'],
      });
      if (!isGranted(status)) {
        throw Object.assign(new Error('Location permission request was denied.'), {
          code: 'OS-PLUG-GLOC-0003',
        });
      }
    })().finally(() => {
      // check again on the next activation, the user may have changed it in the settings
      this.permissionRequest = null;
    });

    return this.permissionRequest;
  }

  public async getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition | null> {
    try {
      await this.ensurePermission();
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy,
        timeout: options?.timeout,
        maximumAge: options?.maximumAge,
      });
      return toGeolocationPosition(position);
    } catch (error) {
      throw new Error(toErrorKey(error), { cause: error });
    }
  }

  public watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options?: PositionOptions
  ): void {
    if (this.pendingWatch !== null) return;

    const pendingWatch: Promise<string | null> = this.ensurePermission()
      .then(() =>
        Geolocation.watchPosition(
          {
            enableHighAccuracy: options?.enableHighAccuracy,
            timeout: options?.timeout,
            maximumAge: options?.maximumAge,
          },
          (position, err) => {
            if (err) {
              errorCallback?.(toPositionError(err));
              return;
            }
            if (position) {
              successCallback(toGeolocationPosition(position));
            }
          }
        )
      )
      .catch((error: unknown) => {
      if (this.pendingWatch === pendingWatch) {
        this.pendingWatch = null;
      }
      errorCallback?.(toPositionError(error));
      return null;
    });
    this.pendingWatch = pendingWatch;
  }

  public clearWatch(): void {
    const pendingWatch = this.pendingWatch;
    this.pendingWatch = null;
    void pendingWatch?.then(id => {
      if (id !== null) {
        void Geolocation.clearWatch({ id });
      }
    });
  }
}
