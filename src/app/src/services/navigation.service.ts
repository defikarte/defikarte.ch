import { Capacitor } from '@capacitor/core';

/**
 * A walking route to the given position in the platform's maps app: Apple Maps on iOS, Google
 * Maps everywhere else. Both are https links, so the OS hands them to the maps app.
 */
export const getWalkingDirectionsUrl = (lon: number, lat: number): string => {
  const destination = encodeURIComponent(`${lat},${lon}`);

  if (Capacitor.getPlatform() === 'ios') {
    return `https://maps.apple.com/?daddr=${destination}&dirflg=w`;
  }

  return `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${destination}`;
};
