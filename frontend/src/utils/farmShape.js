// Estimated farm outline from one GPS point and the farm size.
// Matches the backend's website registration: a 16-sided shape centred on the point whose area equals
// the farm size, with 1 plot = 464.5 m², 1 acre = 4,046.86 m², 1 hectare = 10,000 m².
// It is an estimate, not a surveyed boundary.

export const SQUARE_METRES_PER_UNIT = { plots: 464.5, acres: 4046.86, hectares: 10000 };
export const SIZE_UNITS = [
  { value: "plots", label: "Plots" },
  { value: "acres", label: "Acres" },
  { value: "hectares", label: "Hectares" },
];

const SIDES = 16;
const METRES_PER_DEGREE_LAT = 111320;

export function areaSquareMetres(size, unit) {
  return Number(size) * (SQUARE_METRES_PER_UNIT[unit] || 0);
}

// GeoJSON Polygon: positions are [longitude, latitude], the ring is closed (last = first)
// and runs counter-clockwise, starting due north of the centre.
export function farmPolygon(lat, lng, size, unit) {
  const area = areaSquareMetres(size, unit);
  // A regular polygon with n sides and circumradius r has area (n / 2) · r² · sin(2π / n).
  const radius = Math.sqrt((2 * area) / (SIDES * Math.sin((2 * Math.PI) / SIDES)));
  const metresPerDegreeLng = METRES_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180);
  const round = (n) => Math.round(n * 1e6) / 1e6;

  const ring = [];
  for (let k = 0; k < SIDES; k += 1) {
    const angle = Math.PI / 2 + (k * 2 * Math.PI) / SIDES;
    const east = radius * Math.cos(angle);
    const north = radius * Math.sin(angle);
    ring.push([round(lng + east / metresPerDegreeLng), round(lat + north / METRES_PER_DEGREE_LAT)]);
  }
  ring.push(ring[0]);
  return { type: "Polygon", coordinates: [ring] };
}
