import type { StartLocation } from '../components/TripPanel';
import type { ParkSite } from '../data/parks';
import type { ChargeStop } from './chargeStops';

export type ExportWaypoint = {
  label: string;
  lat: number;
  lng: number;
  kind: 'start' | 'park' | 'monument' | 'charger';
};

/** Ordered waypoints: start → parks/monuments (charge stops optional). */
export function buildExportWaypoints(
  start: StartLocation | null,
  stops: ParkSite[],
  chargeStops: ChargeStop[] = [],
  includeChargers = false,
): ExportWaypoint[] {
  const points: ExportWaypoint[] = [];
  if (start) {
    points.push({
      label: start.label,
      lat: start.lat,
      lng: start.lng,
      kind: 'start',
    });
  }

  if (includeChargers && chargeStops.length > 0 && stops.length > 0) {
    // Interleave: walk parks in order; inject planned chargers by along-route order
    // Simpler approach: start → each charge stop → each park in order can double-back.
    // Better: export parks only for car nav; chargers as separate GPX.
    // For "include chargers": append after start as recommended fuel stops then parks.
    // Cleanest multi-stop for driving: start + parks only for Google/Apple.
    // When includeChargers: start, then merge parks with chargers sorted by a rough sequence.
  }

  for (const p of stops) {
    points.push({
      label: `${p.name}${p.designation === 'National Monument' ? ' NM' : ' NP'}, ${p.state}`,
      lat: p.lat,
      lng: p.lng,
      kind: p.designation === 'National Monument' ? 'monument' : 'park',
    });
  }

  if (includeChargers) {
    // Add charge stops as intermediate waypoints in along-route order,
    // inserted by estimated sequence: after start, before parks that are further.
    // Simple usable approach: start → chargers in order → parks in order
    // That can be suboptimal. Prefer: only parks for Maps; chargers in GPX as separate wpts.
  }

  return points;
}

/**
 * Driving waypoints for phone/car maps: start + parks only
 * (Tesla nav handles Superchargers better in-car).
 */
export function drivingWaypoints(
  start: StartLocation | null,
  stops: ParkSite[],
  returnHome = false,
): ExportWaypoint[] {
  const points = buildExportWaypoints(start, stops, [], false);
  if (returnHome && start && points.length >= 1) {
    // Avoid duplicating if only start exists
    const last = points[points.length - 1];
    const isAlreadyHome =
      last.kind === 'start' ||
      (Math.abs(last.lat - start.lat) < 1e-5 &&
        Math.abs(last.lng - start.lng) < 1e-5);
    if (!isAlreadyHome) {
      points.push({
        label: `Return: ${start.label}`,
        lat: start.lat,
        lng: start.lng,
        kind: 'start',
      });
    }
  }
  return points;
}

/** Google Maps multi-stop directions */
export function googleMapsDirectionsUrl(points: ExportWaypoint[]): string | null {
  if (points.length < 1) return null;
  if (points.length === 1) {
    const p = points[0];
    return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  }
  // Path form supports many stops and works well in browsers / Tesla
  const path = points.map((p) => `${p.lat},${p.lng}`).join('/');
  return `https://www.google.com/maps/dir/${path}`;
}

/** Apple Maps directions (saddr + chained daddr) */
export function appleMapsDirectionsUrl(points: ExportWaypoint[]): string | null {
  if (points.length < 1) return null;
  if (points.length === 1) {
    const p = points[0];
    return `https://maps.apple.com/?ll=${p.lat},${p.lng}&q=${encodeURIComponent(p.label)}`;
  }
  const origin = points[0];
  const rest = points.slice(1);
  // Apple supports "to:" for additional destinations in daddr
  const daddr = rest
    .map((p, i) =>
      i === 0
        ? `${p.lat},${p.lng}`
        : `to:${p.lat},${p.lng}`,
    )
    .join('+');
  return `https://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${daddr}&dirflg=d`;
}

/**
 * Geo URI for the first destination (universal).
 * Full multi-stop is best via Google Maps.
 */
export function geoUri(points: ExportWaypoint[]): string | null {
  if (points.length === 0) return null;
  const p = points[points.length - 1];
  return `geo:${p.lat},${p.lng}?q=${p.lat},${p.lng}(${encodeURIComponent(p.label)})`;
}

/** GPX 1.1 with route + waypoints (parks and optional Superchargers) */
export function buildGpx(options: {
  name: string;
  start: StartLocation | null;
  stops: ParkSite[];
  chargeStops?: ChargeStop[];
  routePath?: [number, number][] | null;
  returnHome?: boolean;
}): string {
  const {
    name,
    start,
    stops,
    chargeStops = [],
    routePath,
    returnHome = false,
  } = options;
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const wpts: string[] = [];

  if (start) {
    wpts.push(
      wptXml(start.lat, start.lng, `Start: ${start.label}`, 'start', esc),
    );
  }
  for (const p of stops) {
    const kind =
      p.designation === 'National Monument' ? 'monument' : 'park';
    wpts.push(
      wptXml(
        p.lat,
        p.lng,
        `${p.name} (${kind === 'monument' ? 'NM' : 'NP'})`,
        kind,
        esc,
      ),
    );
  }
  for (const c of chargeStops) {
    wpts.push(
      wptXml(
        c.lat,
        c.lng,
        `SC #${c.stopNumber}: ${c.name}`,
        'supercharger',
        esc,
      ),
    );
  }

  let rte = '';
  const rtePts: { lat: number; lng: number; name: string }[] = [];
  if (start) rtePts.push({ lat: start.lat, lng: start.lng, name: start.label });
  for (const p of stops) {
    rtePts.push({
      lat: p.lat,
      lng: p.lng,
      name: p.name,
    });
  }
  if (returnHome && start && rtePts.length > 1) {
    rtePts.push({
      lat: start.lat,
      lng: start.lng,
      name: `Return: ${start.label}`,
    });
  }

  if (routePath && routePath.length > 1) {
    const trkpts = routePath
      .map(
        ([lat, lng]) =>
          `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"></trkpt>`,
      )
      .join('\n');
    rte = `
  <trk>
    <name>${esc(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>`;
  } else if (rtePts.length >= 2) {
    const pts = rtePts
      .map(
        (p) =>
          `    <rtept lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}"><name>${esc(p.name)}</name></rtept>`,
      )
      .join('\n');
    rte = `
  <rte>
    <name>${esc(name)}</name>
${pts}
  </rte>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="bennettwells.net/roadtrip" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${esc(name)}</name>
    <desc>Model Y national parks &amp; monuments road trip</desc>
  </metadata>
${wpts.join('\n')}
${rte}
</gpx>
`;
}

function wptXml(
  lat: number,
  lng: number,
  name: string,
  type: string,
  esc: (s: string) => string,
): string {
  return `  <wpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}">
    <name>${esc(name)}</name>
    <type>${esc(type)}</type>
  </wpt>`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'application/gpx+xml',
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
