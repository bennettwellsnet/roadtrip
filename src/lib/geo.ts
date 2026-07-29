import type { NationalPark } from '../data/parks';

export type LatLng = { lat: number; lng: number };

/** Haversine distance in miles */
export function distanceMi(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

export type SuperchargerSite = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  street: string;
  stalls: number;
  kw: number;
  status: string;
  otherEVs: boolean;
  nacs: number;
};

export function nearestSuperchargers(
  point: LatLng,
  sites: SuperchargerSite[],
  limit = 5,
): Array<SuperchargerSite & { distanceMi: number }> {
  return sites
    .map((s) => ({ ...s, distanceMi: distanceMi(point, s) }))
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .slice(0, limit);
}

export function filterParks(
  parks: NationalPark[],
  query: string,
  stateFilter: string,
  designationFilter: '' | 'National Park' | 'National Monument' = '',
): NationalPark[] {
  const q = query.trim().toLowerCase();
  return parks.filter((p) => {
    if (stateFilter && p.state !== stateFilter) return false;
    if (designationFilter && p.designation !== designationFilter) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.designation.toLowerCase().includes(q) ||
      (p.note?.toLowerCase().includes(q) ?? false)
    );
  });
}
