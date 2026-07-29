/**
 * Illustrative U.S. Supercharger $/kWh planning rates (pay-as-you-go style).
 *
 * Tesla sets prices by site and time of day (peak/off-peak). Per-stall live rates
 * are not in our supercharge.info snapshot, so we use state-level planning defaults
 * synthesized from public 2025–2026 reporting (roughly $0.25–$0.60/kWh nationally,
 * often ~$0.35–$0.50 in many markets).
 *
 * Always verify in the Tesla app for the stall you use. Demo only.
 */

export type RateBand = {
  /** Planning midpoint $/kWh for Tesla owner pay-as-you-go */
  mid: number;
  /** Typical low (off-peak / lower-cost markets) */
  low: number;
  /** Typical high (peak / high-cost markets) */
  high: number;
};

/** National planning default when state is unknown */
export const NATIONAL_SC_RATE: RateBand = {
  mid: 0.4,
  low: 0.28,
  high: 0.55,
};

/**
 * State-level Supercharger planning rates ($/kWh).
 * Midpoints lean toward commonly reported urban/highway peaks, not membership promos.
 */
export const STATE_SC_RATES: Record<string, RateBand> = {
  // West coast — generally higher
  CA: { mid: 0.48, low: 0.36, high: 0.62 },
  OR: { mid: 0.42, low: 0.32, high: 0.55 },
  WA: { mid: 0.42, low: 0.32, high: 0.55 },
  NV: { mid: 0.4, low: 0.3, high: 0.52 },
  AZ: { mid: 0.38, low: 0.28, high: 0.5 },
  // Mountain
  CO: { mid: 0.4, low: 0.3, high: 0.52 },
  UT: { mid: 0.38, low: 0.28, high: 0.5 },
  ID: { mid: 0.36, low: 0.26, high: 0.48 },
  MT: { mid: 0.36, low: 0.26, high: 0.48 },
  WY: { mid: 0.36, low: 0.26, high: 0.48 },
  NM: { mid: 0.38, low: 0.28, high: 0.5 },
  // Texas / South
  TX: { mid: 0.36, low: 0.26, high: 0.48 },
  OK: { mid: 0.34, low: 0.25, high: 0.46 },
  LA: { mid: 0.36, low: 0.26, high: 0.48 },
  AR: { mid: 0.34, low: 0.25, high: 0.46 },
  MS: { mid: 0.34, low: 0.25, high: 0.46 },
  AL: { mid: 0.36, low: 0.26, high: 0.48 },
  GA: { mid: 0.38, low: 0.28, high: 0.5 },
  FL: { mid: 0.4, low: 0.3, high: 0.52 },
  SC: { mid: 0.36, low: 0.26, high: 0.48 },
  NC: { mid: 0.38, low: 0.28, high: 0.5 },
  TN: { mid: 0.36, low: 0.26, high: 0.48 },
  KY: { mid: 0.36, low: 0.26, high: 0.48 },
  // Midwest
  OH: { mid: 0.36, low: 0.26, high: 0.48 },
  IN: { mid: 0.34, low: 0.25, high: 0.46 },
  IL: { mid: 0.38, low: 0.28, high: 0.5 },
  MI: { mid: 0.38, low: 0.28, high: 0.5 },
  WI: { mid: 0.36, low: 0.26, high: 0.48 },
  MN: { mid: 0.36, low: 0.26, high: 0.48 },
  IA: { mid: 0.34, low: 0.25, high: 0.46 },
  MO: { mid: 0.36, low: 0.26, high: 0.48 },
  KS: { mid: 0.34, low: 0.25, high: 0.46 },
  NE: { mid: 0.34, low: 0.25, high: 0.46 },
  SD: { mid: 0.34, low: 0.25, high: 0.46 },
  ND: { mid: 0.34, low: 0.25, high: 0.46 },
  // Northeast
  NY: { mid: 0.44, low: 0.34, high: 0.58 },
  NJ: { mid: 0.44, low: 0.34, high: 0.58 },
  PA: { mid: 0.4, low: 0.3, high: 0.52 },
  CT: { mid: 0.44, low: 0.34, high: 0.58 },
  MA: { mid: 0.44, low: 0.34, high: 0.58 },
  RI: { mid: 0.44, low: 0.34, high: 0.58 },
  NH: { mid: 0.42, low: 0.32, high: 0.55 },
  VT: { mid: 0.42, low: 0.32, high: 0.55 },
  ME: { mid: 0.42, low: 0.32, high: 0.55 },
  MD: { mid: 0.42, low: 0.32, high: 0.55 },
  DE: { mid: 0.4, low: 0.3, high: 0.52 },
  DC: { mid: 0.44, low: 0.34, high: 0.58 },
  VA: { mid: 0.4, low: 0.3, high: 0.52 },
  WV: { mid: 0.36, low: 0.26, high: 0.48 },
};

export function rateBandForState(state: string | undefined | null): RateBand {
  if (!state) return NATIONAL_SC_RATE;
  const key = state.trim().toUpperCase();
  return STATE_SC_RATES[key] ?? NATIONAL_SC_RATE;
}

/** Mid rate for a state, or national default */
export function midRateForState(state: string | undefined | null): number {
  return rateBandForState(state).mid;
}

/**
 * Blend mid rates for a multi-state charge plan (kWh-weighted if energies given).
 */
export function blendRateForStops(
  stops: Array<{ state?: string; energyKwh?: number }>,
): number {
  if (stops.length === 0) return NATIONAL_SC_RATE.mid;
  let wSum = 0;
  let rSum = 0;
  for (const s of stops) {
    const w = Math.max(0.1, s.energyKwh ?? 1);
    const r = midRateForState(s.state);
    wSum += w;
    rSum += r * w;
  }
  return rSum / wSum;
}

export function formatUsd(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—';
  return `$${n.toFixed(digits)}`;
}

export function formatRatePerKwh(rate: number): string {
  return `$${rate.toFixed(2)}/kWh`;
}

/** Rough gas comparison: $/mi at Supercharger vs gas car */
export function gasTripCostEstimate(
  totalMiles: number,
  options?: { mpg?: number; gasPerGallon?: number },
): number {
  const mpg = options?.mpg ?? 28;
  const gas = options?.gasPerGallon ?? 3.5;
  if (totalMiles <= 0 || mpg <= 0) return 0;
  return (totalMiles / mpg) * gas;
}

export const RATE_AS_OF_NOTE =
  'Planning rates ~2025–2026 public US Supercharger ranges. Live stall prices are in the Tesla app and vary by site and time of day.';
