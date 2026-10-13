const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

interface Coordinate {
  lat: number;
  lon: number;
}

export const distanceBetweenPoints = (point1: Coordinate, point2: Coordinate) => {
  const lat1 = point1.lat;
  const lon1 = point1.lon;
  const lat2 = point2.lat;
  const lon2 = point2.lon;

  if (lat1 === lat2 && lon1 === lon2) {
    return 0; // Same point
  }
  const R = 6371000; // Radius of the earth in m
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in m
  return d; // Return distance in meters
};
