import {
  blendRateForStops,
  formatUsd,
  gasTripCostEstimate,
  midRateForState,
  NATIONAL_SC_RATE,
  rateBandForState,
} from '../data/superchargerRates';
import type { ModelYConfig, RangeSettings } from '../data/vehicle';
import {
  DEFAULT_RANGE_SETTINGS,
  firstLegUsableMi,
  fullPackUsableMi,
  hopUsableMi,
  suggestedChargeEveryMi,
} from '../data/vehicle';
import { distanceMi, type LatLng, type SuperchargerSite } from './geo';

export type RoutePoint = [number, number]; // [lat, lng]

export type ChargeStop = SuperchargerSite & {
  /** Miles along the route from start when you reach this charger */
  alongMi: number;
  /** How far off the highway corridor (miles) */
  detourMi: number;
  /** Order in the charging plan (1-based) */
  stopNumber: number;
  /** Miles driven since previous charge (or start) */
  legFromPreviousMi: number;
  /** Rough minutes plugged in to recover for the next hop (demo estimate) */
  chargeMinutes: number;
  /** kWh estimated to add at this stop */
  energyKwh: number;
  /** Assumed average charge power used for the estimate (kW) */
  avgChargeKw: number;
  /** $/kWh used for this stop (state planning rate or user override) */
  ratePerKwh: number;
  /** Estimated session cost in USD */
  costUsd: number;
};

export type ChargePlan = {
  stops: ChargeStop[];
  /** All Superchargers near the corridor (not necessarily planned stops) */
  alongRoute: Array<SuperchargerSite & { alongMi: number; detourMi: number }>;
  totalRouteMi: number;
  usableRangeMi: number;
  /** True if a stretch may exceed range with no reachable Supercharger */
  coverageGap: boolean;
  gapMessage?: string;
  /** Sum of planned stop charge minutes (excludes overhead per stop is included) */
  totalChargeMinutes: number;
  /** Rough total including ~5 min plug-in overhead already in each stop */
  totalChargeLabel: string;
  /** Total kWh estimated across planned Supercharger stops */
  totalEnergyKwh: number;
  /** Blended or user $/kWh used for totals */
  ratePerKwh: number;
  /** Sum of stop costs at planning rate */
  totalCostUsd: number;
  /** Low / high band using state low/high rates (or ± around override) */
  costLowUsd: number;
  costHighUsd: number;
  /** Rough comparable gas trip cost for same miles */
  gasCompareUsd: number;
  costLabel: string;
};

type PathSample = LatLng & { alongMi: number };

/** Build cumulative-distance samples along a lat/lng path */
export function samplePath(path: RoutePoint[]): PathSample[] {
  if (path.length === 0) return [];
  const samples: PathSample[] = [
    { lat: path[0][0], lng: path[0][1], alongMi: 0 },
  ];
  let along = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = { lat: path[i - 1][0], lng: path[i - 1][1] };
    const cur = { lat: path[i][0], lng: path[i][1] };
    along += distanceMi(prev, cur);
    samples.push({ ...cur, alongMi: along });
  }
  return samples;
}

/**
 * Superchargers within corridorMi of the route polyline, ordered along the drive.
 */
export function findChargersAlongRoute(
  path: RoutePoint[],
  sites: SuperchargerSite[],
  corridorMi = 15,
): Array<SuperchargerSite & { alongMi: number; detourMi: number }> {
  const samples = samplePath(path);
  if (samples.length < 2 || sites.length === 0) return [];

  // Thin samples for speed on long routes (keep ~every 3rd + ends)
  const step = samples.length > 800 ? 4 : samples.length > 400 ? 2 : 1;
  const probe: PathSample[] = [];
  for (let i = 0; i < samples.length; i += step) probe.push(samples[i]);
  if (probe[probe.length - 1] !== samples[samples.length - 1]) {
    probe.push(samples[samples.length - 1]);
  }

  const results: Array<SuperchargerSite & { alongMi: number; detourMi: number }> =
    [];

  for (const site of sites) {
    let bestDetour = Infinity;
    let bestAlong = 0;
    for (const s of probe) {
      const d = distanceMi(site, s);
      if (d < bestDetour) {
        bestDetour = d;
        bestAlong = s.alongMi;
      }
    }
    if (bestDetour <= corridorMi) {
      results.push({
        ...site,
        alongMi: bestAlong,
        detourMi: bestDetour,
      });
    }
  }

  // Deduplicate by id (keep lowest detour)
  const byId = new Map<number, (typeof results)[0]>();
  for (const r of results) {
    const prev = byId.get(r.id);
    if (!prev || r.detourMi < prev.detourMi) byId.set(r.id, r);
  }

  return Array.from(byId.values()).sort((a, b) => a.alongMi - b.alongMi);
}

/**
 * Greedy charge-stop plan for a Model Y along an ordered route path.
 * Uses tunable range settings for first leg SOC and hop length.
 */
export function planChargeStops(
  path: RoutePoint[],
  sites: SuperchargerSite[],
  vehicle: ModelYConfig,
  options?: {
    corridorMi?: number;
    rangeSettings?: RangeSettings;
    /** Override $/kWh (null/undefined = use state planning rates per stop) */
    ratePerKwh?: number | null;
  },
): ChargePlan {
  const corridorMi = options?.corridorMi ?? 18;
  const settings = options?.rangeSettings ?? DEFAULT_RANGE_SETTINGS;
  const rateOverride =
    options?.ratePerKwh != null &&
    Number.isFinite(options.ratePerKwh) &&
    options.ratePerKwh > 0
      ? options.ratePerKwh
      : null;
  const samples = samplePath(path);
  const totalRouteMi =
    samples.length > 0 ? samples[samples.length - 1].alongMi : 0;

  const firstLegMi = firstLegUsableMi(vehicle, settings);
  const hopMi = hopUsableMi(vehicle, settings);
  const usableRangeMi = hopMi;
  const preferredLeg = Math.min(
    suggestedChargeEveryMi(vehicle, settings),
    hopMi * 0.95,
  );

  const alongRoute = findChargersAlongRoute(path, sites, corridorMi);

  if (totalRouteMi <= 0) {
    return emptyPlan(alongRoute, 0, usableRangeMi, rateOverride);
  }

  // Whole trip fits on the first-leg usable range (from start SOC)
  if (totalRouteMi <= firstLegMi) {
    return emptyPlan(alongRoute, totalRouteMi, firstLegMi, rateOverride);
  }

  const stops: ChargeStop[] = [];
  let lastChargeAlong = 0;
  let coverageGap = false;
  let gapMessage: string | undefined;
  const usedIds = new Set<number>();
  let isFirstHop = true;

  // Safety: max iterations
  for (let guard = 0; guard < 40; guard++) {
    const remaining = totalRouteMi - lastChargeAlong;
    const maxLeg = isFirstHop ? firstLegMi : hopMi;
    const prefer = isFirstHop
      ? Math.min(preferredLeg, firstLegMi * 0.9)
      : preferredLeg;
    if (remaining <= maxLeg) break;

    // Window where we should stop next
    const minAlong = lastChargeAlong + Math.min(40, prefer * 0.35);
    const idealAlong = lastChargeAlong + prefer;
    const maxAlong = lastChargeAlong + maxLeg;

    const candidates = alongRoute.filter(
      (c) =>
        !usedIds.has(c.id) &&
        c.alongMi >= minAlong &&
        c.alongMi <= maxAlong + 5,
    );

    if (candidates.length === 0) {
      // Widen: any SC between last charge and max reach
      const fallback = alongRoute.filter(
        (c) =>
          !usedIds.has(c.id) &&
          c.alongMi > lastChargeAlong + 5 &&
          c.alongMi <= maxAlong + 20,
      );
      if (fallback.length === 0) {
        coverageGap = true;
        gapMessage = `Possible Supercharger gap after ~${Math.round(lastChargeAlong)} mi along the route. Widen your buffer or check Tesla navigation.`;
        break;
      }
      // Pick furthest reachable to maximize progress
      fallback.sort((a, b) => b.alongMi - a.alongMi);
      const pick = fallback[0];
      usedIds.add(pick.id);
      const legMi = pick.alongMi - lastChargeAlong;
      stops.push(
        finalizeStop(
          pick,
          stops.length + 1,
          legMi,
          vehicle,
          settings,
          rateOverride,
        ),
      );
      lastChargeAlong = pick.alongMi;
      isFirstHop = false;
      continue;
    }

    // Prefer candidate closest to ideal, breaking ties by lower detour
    candidates.sort((a, b) => {
      const da = Math.abs(a.alongMi - idealAlong) + a.detourMi * 0.5;
      const db = Math.abs(b.alongMi - idealAlong) + b.detourMi * 0.5;
      return da - db;
    });

    const pick = candidates[0];
    usedIds.add(pick.id);
    const legMi = pick.alongMi - lastChargeAlong;
    stops.push(
      finalizeStop(
        pick,
        stops.length + 1,
        legMi,
        vehicle,
        settings,
        rateOverride,
      ),
    );
    lastChargeAlong = pick.alongMi;
    isFirstHop = false;
  }

  // Final check: can we finish from last charge?
  const finalMax = isFirstHop ? firstLegMi : hopMi;
  if (totalRouteMi - lastChargeAlong > finalMax) {
    coverageGap = true;
    gapMessage =
      gapMessage ||
      'Final stretch may exceed planning range from the last Supercharger.';
  }

  return buildPlanTotals(
    stops,
    alongRoute,
    totalRouteMi,
    usableRangeMi,
    coverageGap,
    gapMessage,
    rateOverride,
  );
}

function finalizeStop(
  pick: SuperchargerSite & { alongMi: number; detourMi: number },
  stopNumber: number,
  legMi: number,
  vehicle: ModelYConfig,
  settings: RangeSettings,
  rateOverride: number | null,
): ChargeStop {
  const session = estimateChargeSession(legMi, vehicle, settings, pick.kw);
  const ratePerKwh = rateOverride ?? midRateForState(pick.state);
  const costUsd = Math.round(session.energyKwh * ratePerKwh * 100) / 100;
  return {
    ...pick,
    stopNumber,
    legFromPreviousMi: legMi,
    ...session,
    ratePerKwh,
    costUsd,
  };
}

function buildPlanTotals(
  stops: ChargeStop[],
  alongRoute: ChargePlan['alongRoute'],
  totalRouteMi: number,
  usableRangeMi: number,
  coverageGap: boolean,
  gapMessage: string | undefined,
  rateOverride: number | null,
): ChargePlan {
  const totalChargeMinutes = stops.reduce((s, x) => s + x.chargeMinutes, 0);
  const totalEnergyKwh =
    Math.round(stops.reduce((s, x) => s + x.energyKwh, 0) * 10) / 10;
  const totalCostUsd =
    Math.round(stops.reduce((s, x) => s + x.costUsd, 0) * 100) / 100;
  const ratePerKwh =
    rateOverride ??
    (stops.length > 0 ? blendRateForStops(stops) : NATIONAL_SC_RATE.mid);

  let costLowUsd = 0;
  let costHighUsd = 0;
  for (const s of stops) {
    if (rateOverride != null) {
      costLowUsd += s.energyKwh * rateOverride * 0.85;
      costHighUsd += s.energyKwh * rateOverride * 1.2;
    } else {
      const band = rateBandForState(s.state);
      costLowUsd += s.energyKwh * band.low;
      costHighUsd += s.energyKwh * band.high;
    }
  }
  costLowUsd = Math.round(costLowUsd * 100) / 100;
  costHighUsd = Math.round(costHighUsd * 100) / 100;

  const gasCompareUsd =
    Math.round(gasTripCostEstimate(totalRouteMi) * 100) / 100;

  const costLabel =
    stops.length === 0
      ? '$0 Supercharging'
      : `${formatUsd(totalCostUsd)} Supercharging (${formatUsd(costLowUsd)}–${formatUsd(costHighUsd)} band)`;

  return {
    stops,
    alongRoute,
    totalRouteMi,
    usableRangeMi,
    coverageGap,
    gapMessage,
    totalChargeMinutes,
    totalChargeLabel: formatChargeMinutes(totalChargeMinutes),
    totalEnergyKwh,
    ratePerKwh: Math.round(ratePerKwh * 1000) / 1000,
    totalCostUsd,
    costLowUsd,
    costHighUsd,
    gasCompareUsd,
    costLabel,
  };
}

function emptyPlan(
  alongRoute: ChargePlan['alongRoute'],
  totalRouteMi: number,
  usableRangeMi: number,
  rateOverride: number | null = null,
): ChargePlan {
  return buildPlanTotals(
    [],
    alongRoute,
    totalRouteMi,
    usableRangeMi,
    false,
    undefined,
    rateOverride,
  );
}

/** Approximate usable pack energy (kWh) by vehicle family / range class */
export function estimatePackKwh(vehicle: ModelYConfig): number {
  // Rough planning figures — not Tesla official battery sizes
  switch (vehicle.family) {
    case 'Cybertruck':
      return vehicle.epaRangeMi >= 320 ? 120 : 100;
    case 'Model S':
    case 'Model X':
      return vehicle.epaRangeMi >= 350 ? 100 : 95;
    case 'Model 3':
      return vehicle.epaRangeMi >= 300 ? 78 : 60;
    case 'Model Y':
    default:
      return vehicle.epaRangeMi >= 300 ? 78 : 60;
  }
}

/**
 * Rough charge session: energy used on the prior leg, recharged at a derated
 * Supercharger power (peak kW tapers; use ~55% average), plus plug-in overhead.
 */
export function estimateChargeSession(
  legMi: number,
  vehicle: ModelYConfig,
  settings: RangeSettings,
  siteKw: number,
): { chargeMinutes: number; energyKwh: number; avgChargeKw: number } {
  const fullPackMi = Math.max(80, fullPackUsableMi(vehicle, settings));
  const packKwh = estimatePackKwh(vehicle);
  const kwhPerMi = packKwh / fullPackMi;
  // Charge enough to cover the leg just driven + small top-up margin
  const energyKwh = Math.min(
    packKwh * 0.75,
    Math.max(8, legMi * kwhPerMi * 1.08),
  );

  const peak = siteKw > 0 ? siteKw : 150;
  // Average session power is well below peak due to taper / sharing
  const avgChargeKw = Math.max(35, Math.min(peak * 0.55, 180));
  const chargeOnlyMin = (energyKwh / avgChargeKw) * 60;
  const overheadMin = 5; // park, plug, pay, unplug
  const chargeMinutes = Math.round(
    Math.min(75, Math.max(10, chargeOnlyMin + overheadMin)),
  );

  return {
    chargeMinutes,
    energyKwh: Math.round(energyKwh * 10) / 10,
    avgChargeKw: Math.round(avgChargeKw),
  };
}

export function formatChargeMinutes(totalMin: number): string {
  if (totalMin <= 0) return '0 min';
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
