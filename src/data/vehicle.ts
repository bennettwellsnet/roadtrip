/**
 * Tesla vehicle configs + tunable trip range model.
 * EPA figures are approximate planning defaults (trims change by year/config).
 */

export type VehicleFamily =
  | 'Model Y'
  | 'Model 3'
  | 'Model S'
  | 'Model X'
  | 'Cybertruck';

export type ModelYConfig = {
  id: string;
  name: string;
  family: VehicleFamily;
  /** EPA estimated range (miles) — approximate */
  epaRangeMi: number;
  /** Default conservative highway planning range */
  planningRangeMi: number;
  /** Suggested charge stop interval as fraction of effective range */
  chargeIntervalFactor: number;
};

/** @deprecated use VehicleConfig */
export type VehicleConfig = ModelYConfig;

function plan(epa: number, factor = 0.75): number {
  return Math.round(epa * factor);
}

export const TESLA_VEHICLE_CONFIGS: ModelYConfig[] = [
  // —— Model Y ——
  {
    id: 'y-lr-awd',
    name: 'Model Y Long Range AWD',
    family: 'Model Y',
    epaRangeMi: 320,
    planningRangeMi: plan(320),
    chargeIntervalFactor: 0.75,
  },
  {
    id: 'y-perf',
    name: 'Model Y Performance',
    family: 'Model Y',
    epaRangeMi: 285,
    planningRangeMi: plan(285),
    chargeIntervalFactor: 0.75,
  },
  {
    id: 'y-rwd',
    name: 'Model Y RWD',
    family: 'Model Y',
    epaRangeMi: 260,
    planningRangeMi: plan(260),
    chargeIntervalFactor: 0.75,
  },
  {
    id: 'y-lr-rwd',
    name: 'Model Y Long Range RWD',
    family: 'Model Y',
    epaRangeMi: 320,
    planningRangeMi: plan(320),
    chargeIntervalFactor: 0.75,
  },
  // —— Model 3 ——
  {
    id: '3-rwd',
    name: 'Model 3 RWD',
    family: 'Model 3',
    epaRangeMi: 272,
    planningRangeMi: plan(272),
    chargeIntervalFactor: 0.75,
  },
  {
    id: '3-lr-awd',
    name: 'Model 3 Long Range AWD',
    family: 'Model 3',
    epaRangeMi: 341,
    planningRangeMi: plan(341),
    chargeIntervalFactor: 0.75,
  },
  {
    id: '3-lr-rwd',
    name: 'Model 3 Long Range RWD',
    family: 'Model 3',
    epaRangeMi: 363,
    planningRangeMi: plan(363),
    chargeIntervalFactor: 0.75,
  },
  {
    id: '3-perf',
    name: 'Model 3 Performance',
    family: 'Model 3',
    epaRangeMi: 296,
    planningRangeMi: plan(296),
    chargeIntervalFactor: 0.75,
  },
  // —— Model S ——
  {
    id: 's-lr',
    name: 'Model S Long Range',
    family: 'Model S',
    epaRangeMi: 402,
    planningRangeMi: plan(402),
    chargeIntervalFactor: 0.75,
  },
  {
    id: 's-plaid',
    name: 'Model S Plaid',
    family: 'Model S',
    epaRangeMi: 348,
    planningRangeMi: plan(348),
    chargeIntervalFactor: 0.75,
  },
  // —— Model X ——
  {
    id: 'x-lr',
    name: 'Model X Long Range',
    family: 'Model X',
    epaRangeMi: 335,
    planningRangeMi: plan(335),
    chargeIntervalFactor: 0.75,
  },
  {
    id: 'x-plaid',
    name: 'Model X Plaid',
    family: 'Model X',
    epaRangeMi: 326,
    planningRangeMi: plan(326),
    chargeIntervalFactor: 0.75,
  },
  // —— Cybertruck ——
  {
    id: 'ct-rwd',
    name: 'Cybertruck RWD',
    family: 'Cybertruck',
    epaRangeMi: 250,
    planningRangeMi: plan(250),
    chargeIntervalFactor: 0.72,
  },
  {
    id: 'ct-awd',
    name: 'Cybertruck AWD',
    family: 'Cybertruck',
    epaRangeMi: 325,
    planningRangeMi: plan(325),
    chargeIntervalFactor: 0.72,
  },
  {
    id: 'ct-beast',
    name: 'Cybertruck Cyberbeast',
    family: 'Cybertruck',
    epaRangeMi: 320,
    planningRangeMi: plan(320),
    chargeIntervalFactor: 0.72,
  },
];

/** Back-compat alias used across the app */
export const MODEL_Y_CONFIGS = TESLA_VEHICLE_CONFIGS;

/** Prefer Long Range Y; map legacy ids from older share links */
export const DEFAULT_VEHICLE =
  TESLA_VEHICLE_CONFIGS.find((v) => v.id === 'y-lr-awd') ??
  TESLA_VEHICLE_CONFIGS[0];

const LEGACY_VEHICLE_IDS: Record<string, string> = {
  'lr-awd': 'y-lr-awd',
  'perf-awd': 'y-perf',
  rwd: 'y-rwd',
};

export function resolveVehicleId(id: string): string {
  return LEGACY_VEHICLE_IDS[id] ?? id;
}

export function vehicleFamilies(): VehicleFamily[] {
  return ['Model Y', 'Model 3', 'Model S', 'Model X', 'Cybertruck'];
}

export function vehiclesByFamily(
  family: VehicleFamily,
): ModelYConfig[] {
  return TESLA_VEHICLE_CONFIGS.filter((v) => v.family === family);
}

/** User-tunable assumptions for charge planning */
export type RangeSettings = {
  /** Departure state of charge (10–100) */
  startSocPct: number;
  /** Minimum arrival SOC buffer (5–30) */
  arrivalBufferPct: number;
  /** Typical highway speed for derate (55–80) */
  highwayMph: number;
  /** Cold weather / winter tires / cabin heat derate */
  coldWeather: boolean;
  /** How aggressively to charge (0.55–0.9 of usable range) */
  chargeIntervalFactor: number;
};

export const DEFAULT_RANGE_SETTINGS: RangeSettings = {
  startSocPct: 100,
  arrivalBufferPct: 15,
  highwayMph: 70,
  coldWeather: false,
  chargeIntervalFactor: 0.75,
};

/**
 * Effective usable miles available from a full pack under trip conditions
 * (before applying starting SOC).
 */
export function fullPackUsableMi(
  vehicle: ModelYConfig,
  settings: RangeSettings,
): number {
  const speed = clamp(settings.highwayMph, 55, 85);
  const speedFactor = 1 - Math.max(0, speed - 65) * 0.01;
  let mi = vehicle.epaRangeMi * 0.88 * speedFactor;
  if (settings.coldWeather) {
    mi *= 0.78;
  }
  // Slight extra derate for taller / heavier vehicles at highway speed
  if (vehicle.family === 'Cybertruck' || vehicle.family === 'Model X') {
    mi *= 0.97;
  }
  return Math.round(
    clamp(mi, vehicle.epaRangeMi * 0.45, vehicle.epaRangeMi * 0.95),
  );
}

export function firstLegUsableMi(
  vehicle: ModelYConfig,
  settings: RangeSettings,
): number {
  const full = fullPackUsableMi(vehicle, settings);
  const startFrac = clamp(settings.startSocPct, 10, 100) / 100;
  const bufferFrac = clamp(settings.arrivalBufferPct, 5, 35) / 100;
  return Math.max(20, Math.round(full * (startFrac - bufferFrac)));
}

export function hopUsableMi(
  vehicle: ModelYConfig,
  settings: RangeSettings,
): number {
  const full = fullPackUsableMi(vehicle, settings);
  const bufferFrac = clamp(settings.arrivalBufferPct, 5, 35) / 100;
  return Math.max(30, Math.round(full * (0.95 - bufferFrac)));
}

export function suggestedChargeEveryMi(
  vehicle: ModelYConfig,
  settings: RangeSettings = DEFAULT_RANGE_SETTINGS,
): number {
  const hop = hopUsableMi(vehicle, settings);
  const factor = clamp(settings.chargeIntervalFactor, 0.5, 0.92);
  return Math.round(hop * factor);
}

export function suggestedChargeEveryMiLegacy(v: ModelYConfig): number {
  return Math.round(v.planningRangeMi * v.chargeIntervalFactor);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function summarizeRange(
  vehicle: ModelYConfig,
  settings: RangeSettings,
): {
  fullPackMi: number;
  firstLegMi: number;
  hopMi: number;
  chargeEveryMi: number;
} {
  return {
    fullPackMi: fullPackUsableMi(vehicle, settings),
    firstLegMi: firstLegUsableMi(vehicle, settings),
    hopMi: hopUsableMi(vehicle, settings),
    chargeEveryMi: suggestedChargeEveryMi(vehicle, settings),
  };
}
