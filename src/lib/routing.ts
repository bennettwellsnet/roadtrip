import type { LatLng } from './geo';
import { distanceMi } from './geo';

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

export type RouteLeg = {
  fromLabel: string;
  toLabel: string;
  /** Driving distance miles (OSRM when available) */
  miles: number;
  /** Driving duration hours */
  hours: number;
  /** true when using road routing rather than straight-line estimate */
  isHighway: boolean;
};

export type TripRoute = {
  legs: RouteLeg[];
  totalMiles: number;
  totalHours: number;
  /** [lat, lng][] for map polyline */
  path: [number, number][];
  isHighway: boolean;
  error?: string;
};

const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

/** Rough highway factor when road routing is unavailable */
const STRAIGHT_LINE_FACTOR = 1.22;

export async function geocodePlace(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(NOMINATIM);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('limit', '6');
  url.searchParams.set('countrycodes', 'us');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  return data.map((d) => ({
    label: shortenLabel(d.display_name),
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}

function shortenLabel(name: string): string {
  const parts = name.split(',').map((p) => p.trim());
  // City, State (or first 3 parts)
  if (parts.length >= 3) return `${parts[0]}, ${parts[parts.length - 3] || parts[1]}`;
  return parts.slice(0, 2).join(', ');
}

export type Waypoint = LatLng & { label: string };

/**
 * Drive route between ordered waypoints via OSRM public demo server.
 * Falls back to straight-line × factor if routing fails.
 */
export async function routeTrip(waypoints: Waypoint[]): Promise<TripRoute> {
  if (waypoints.length < 2) {
    return {
      legs: [],
      totalMiles: 0,
      totalHours: 0,
      path: waypoints.map((w) => [w.lat, w.lng] as [number, number]),
      isHighway: true,
    };
  }

  try {
    const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url = `${OSRM}/${coords}?overview=full&geometries=geojson&steps=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);

    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        distance: number;
        duration: number;
        legs: Array<{ distance: number; duration: number }>;
        geometry: { coordinates: [number, number][] };
      }>;
    };

    if (data.code !== 'Ok' || !data.routes?.[0]) {
      throw new Error(data.code || 'No route');
    }

    const route = data.routes[0];
    const legs: RouteLeg[] = route.legs.map((leg, i) => ({
      fromLabel: waypoints[i].label,
      toLabel: waypoints[i + 1].label,
      miles: metersToMi(leg.distance),
      hours: leg.duration / 3600,
      isHighway: true,
    }));

    const path: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng],
    );

    return {
      legs,
      totalMiles: metersToMi(route.distance),
      totalHours: route.duration / 3600,
      path,
      isHighway: true,
    };
  } catch (e) {
    // Fallback: straight-line legs with highway factor
    const legs: RouteLeg[] = [];
    let totalMiles = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i];
      const b = waypoints[i + 1];
      const miles = distanceMi(a, b) * STRAIGHT_LINE_FACTOR;
      // ~58 mph average for planning
      const hours = miles / 58;
      legs.push({
        fromLabel: a.label,
        toLabel: b.label,
        miles,
        hours,
        isHighway: false,
      });
      totalMiles += miles;
    }

    return {
      legs,
      totalMiles,
      totalHours: totalMiles / 58,
      path: waypoints.map((w) => [w.lat, w.lng] as [number, number]),
      isHighway: false,
      error: e instanceof Error ? e.message : 'Routing unavailable',
    };
  }
}

function metersToMi(m: number): number {
  return m / 1609.344;
}

export function formatHours(h: number): string {
  if (!Number.isFinite(h) || h <= 0) return '—';
  const totalMin = Math.round(h * 60);
  const hrs = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (hrs === 0) return `${min}m`;
  if (min === 0) return `${hrs}h`;
  return `${hrs}h ${min}m`;
}

export function formatMiles(mi: number): string {
  if (!Number.isFinite(mi)) return '—';
  return `${Math.round(mi).toLocaleString()} mi`;
}
