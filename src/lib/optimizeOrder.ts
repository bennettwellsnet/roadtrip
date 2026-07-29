import type { ParkSite } from '../data/parks';
import { distanceMi, type LatLng } from './geo';

const OSRM_TABLE = 'https://router.project-osrm.org/table/v1/driving';
const HIGHWAY_FACTOR = 1.22;

/**
 * Reorder stop IDs to shorten driving distance from an optional start.
 * Uses OSRM distance table when available; falls back to straight-line × factor.
 * Does not include the return-home leg in the optimization (open path from start).
 */
export async function optimizeStopOrder(
  start: LatLng | null,
  stopIds: string[],
  sitesById: Map<string, ParkSite>,
): Promise<{ order: string[]; method: 'osrm' | 'estimate'; improved: boolean }> {
  if (stopIds.length <= 1) {
    return { order: [...stopIds], method: 'estimate', improved: false };
  }

  const stops = stopIds
    .map((id) => sitesById.get(id))
    .filter((s): s is ParkSite => Boolean(s));
  if (stops.length <= 1) {
    return { order: stops.map((s) => s.id), method: 'estimate', improved: false };
  }

  // Points: optional start at index 0, then current stop order
  const points: LatLng[] = [];
  const labels: string[] = [];
  if (start) {
    points.push(start);
    labels.push('__start__');
  }
  for (const s of stops) {
    points.push(s);
    labels.push(s.id);
  }

  let matrix = await fetchDistanceMatrix(points);
  let method: 'osrm' | 'estimate' = 'osrm';
  if (!matrix) {
    matrix = haversineMatrix(points);
    method = 'estimate';
  }

  const n = points.length;
  const startIdx = 0;
  // Optimize order of indices 1..n-1 (or 0..n-1 if no start — treat first as fixed start of tour)
  const freeIdx = start
    ? Array.from({ length: n - 1 }, (_, i) => i + 1)
    : Array.from({ length: n }, (_, i) => i);

  // If no explicit start, fix first stop as depot for open path (don't reorder away from user intent totally)
  // Actually for no-start case: full open-path optimization among all stops
  let orderIdx: number[];
  if (start) {
    orderIdx = nearestNeighborPath(matrix, startIdx, freeIdx);
    orderIdx = twoOptPath(matrix, [startIdx, ...orderIdx]);
    // drop start from result
    const parkOrder = orderIdx.filter((i) => i !== startIdx).map((i) => labels[i]);
    const improved = !sameOrder(
      parkOrder,
      stops.map((s) => s.id),
    );
    return { order: parkOrder, method, improved };
  }

  // No start: NN from each possible start, pick best open path
  let bestPath: number[] = freeIdx;
  let bestCost = pathCost(matrix, freeIdx);
  for (const s of freeIdx) {
    const rest = freeIdx.filter((i) => i !== s);
    let path = [s, ...nearestNeighborPath(matrix, s, rest)];
    path = twoOptPath(matrix, path);
    const c = pathCost(matrix, path);
    if (c < bestCost) {
      bestCost = c;
      bestPath = path;
    }
  }
  const parkOrder = bestPath.map((i) => labels[i]);
  const improved = !sameOrder(
    parkOrder,
    stops.map((s) => s.id),
  );
  return { order: parkOrder, method, improved };
}

function sameOrder(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

function haversineMatrix(points: LatLng[]): number[][] {
  const n = points.length;
  const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = distanceMi(points[i], points[j]) * HIGHWAY_FACTOR;
      m[i][j] = d;
      m[j][i] = d;
    }
  }
  return m;
}

async function fetchDistanceMatrix(
  points: LatLng[],
): Promise<number[][] | null> {
  if (points.length < 2 || points.length > 25) return null;
  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_TABLE}/${coords}?annotations=distance`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      distances?: (number | null)[][];
    };
    if (data.code !== 'Ok' || !data.distances) return null;
    // meters → miles
    return data.distances.map((row) =>
      row.map((v) => (v == null || !Number.isFinite(v) ? 1e9 : v / 1609.344)),
    );
  } catch {
    return null;
  }
}

function nearestNeighborPath(
  matrix: number[][],
  from: number,
  candidates: number[],
): number[] {
  const remaining = new Set(candidates);
  const path: number[] = [];
  let cur = from;
  while (remaining.size > 0) {
    let best = -1;
    let bestD = Infinity;
    for (const j of remaining) {
      const d = matrix[cur][j];
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    if (best < 0) break;
    path.push(best);
    remaining.delete(best);
    cur = best;
  }
  return path;
}

function pathCost(matrix: number[][], path: number[]): number {
  let c = 0;
  for (let i = 0; i < path.length - 1; i++) {
    c += matrix[path[i]][path[i + 1]];
  }
  return c;
}

/** 2-opt on an open path (does not reverse into a cycle). */
function twoOptPath(matrix: number[][], path: number[]): number[] {
  if (path.length < 4) return path;
  let best = [...path];
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 40) {
    improved = false;
    for (let i = 0; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length - 1; k++) {
        // Don't move the first node if it's a fixed depot — caller includes depot at [0]
        if (i === 0 && k === 0) continue;
        const next = twoOptSwap(best, i, k);
        if (pathCost(matrix, next) + 1e-6 < pathCost(matrix, best)) {
          best = next;
          improved = true;
        }
      }
    }
  }
  return best;
}

/** Reverse segment between i and k inclusive (open path 2-opt). */
function twoOptSwap(path: number[], i: number, k: number): number[] {
  const next = path.slice(0, i);
  for (let idx = k; idx >= i; idx--) next.push(path[idx]);
  for (let idx = k + 1; idx < path.length; idx++) next.push(path[idx]);
  return next;
}

/** Estimate open-path miles for a stop order (haversine × factor). */
export function estimatePathMiles(
  start: LatLng | null,
  orderedStops: LatLng[],
  returnHome: boolean,
): number {
  const pts: LatLng[] = [];
  if (start) pts.push(start);
  pts.push(...orderedStops);
  if (returnHome && start && pts.length > 1) pts.push(start);
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += distanceMi(pts[i], pts[i + 1]) * HIGHWAY_FACTOR;
  }
  return total;
}
