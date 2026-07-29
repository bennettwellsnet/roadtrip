import type { StartLocation } from '../components/TripPanel';
import { NATIONAL_PARKS } from '../data/parks';
import {
  getTemplateById,
  type TripTemplate,
} from '../data/tripTemplates';
import {
  DEFAULT_RANGE_SETTINGS,
  DEFAULT_VEHICLE,
  MODEL_Y_CONFIGS,
  resolveVehicleId,
  type ModelYConfig,
  type RangeSettings,
} from '../data/vehicle';
import type { ChargePlan } from './chargeStops';
import { formatMiles } from './routing';

export type SharedTrip = {
  start: StartLocation | null;
  stopIds: string[];
  vehicleId: string;
  returnHome?: boolean;
  rangeSettings?: Partial<RangeSettings>;
  nightsByStopId?: Record<string, number>;
  travelMonth?: number;
  /** Optional template id when trip was loaded from a one-click template */
  templateId?: string;
};

const VALID_IDS = new Set(NATIONAL_PARKS.map((p) => p.id));

export function encodeTripToSearchParams(trip: SharedTrip): URLSearchParams {
  const p = new URLSearchParams();
  // Prefer short template link when the live trip still matches the template
  if (trip.templateId && tripMatchesTemplate(trip, trip.templateId)) {
    p.set('t', trip.templateId);
    if (trip.vehicleId && trip.vehicleId !== DEFAULT_VEHICLE.id) {
      p.set('v', trip.vehicleId);
    }
    return p;
  }
  if (trip.stopIds.length) {
    p.set('stops', trip.stopIds.join(','));
  }
  if (trip.start) {
    p.set('from', trip.start.label);
    p.set('lat', trip.start.lat.toFixed(5));
    p.set('lng', trip.start.lng.toFixed(5));
  }
  if (trip.vehicleId && trip.vehicleId !== DEFAULT_VEHICLE.id) {
    p.set('v', trip.vehicleId);
  }
  if (trip.returnHome) {
    p.set('round', '1');
  }
  if (trip.travelMonth && trip.travelMonth >= 1 && trip.travelMonth <= 12) {
    p.set('m', String(trip.travelMonth));
  }
  // Compact nights: id:n,id:n
  if (trip.nightsByStopId && Object.keys(trip.nightsByStopId).length) {
    const parts = Object.entries(trip.nightsByStopId)
      .filter(([id, n]) => VALID_IDS.has(id) && n !== 1)
      .map(([id, n]) => `${id}:${n}`);
    if (parts.length) p.set('nights', parts.join(','));
  }
  // Range settings only if non-default
  const rs = { ...DEFAULT_RANGE_SETTINGS, ...trip.rangeSettings };
  if (rs.startSocPct !== DEFAULT_RANGE_SETTINGS.startSocPct) {
    p.set('soc', String(rs.startSocPct));
  }
  if (rs.arrivalBufferPct !== DEFAULT_RANGE_SETTINGS.arrivalBufferPct) {
    p.set('buf', String(rs.arrivalBufferPct));
  }
  if (rs.highwayMph !== DEFAULT_RANGE_SETTINGS.highwayMph) {
    p.set('mph', String(rs.highwayMph));
  }
  if (rs.coldWeather) p.set('cold', '1');
  if (rs.chargeIntervalFactor !== DEFAULT_RANGE_SETTINGS.chargeIntervalFactor) {
    p.set('cif', String(Math.round(rs.chargeIntervalFactor * 100)));
  }
  if (trip.templateId) {
    p.set('t', trip.templateId);
  }
  return p;
}

function tripMatchesTemplate(trip: SharedTrip, templateId: string): boolean {
  const t = getTemplateById(templateId);
  if (!t) return false;
  if (trip.returnHome !== t.returnHome) return false;
  if (trip.stopIds.length !== t.stopIds.length) return false;
  if (!trip.stopIds.every((id, i) => id === t.stopIds[i])) return false;
  if (!trip.start) return false;
  const latOk = Math.abs(trip.start.lat - t.start.lat) < 0.02;
  const lngOk = Math.abs(trip.start.lng - t.start.lng) < 0.02;
  return latOk && lngOk;
}

export function sharedTripFromTemplate(
  template: TripTemplate,
  vehicleId = DEFAULT_VEHICLE.id,
): SharedTrip {
  return {
    start: { ...template.start },
    stopIds: [...template.stopIds],
    vehicleId,
    returnHome: template.returnHome,
    nightsByStopId: template.nightsByStopId
      ? { ...template.nightsByStopId }
      : undefined,
    travelMonth: template.travelMonth,
    templateId: template.id,
  };
}

export function buildShareUrl(trip: SharedTrip): string {
  const params = encodeTripToSearchParams(trip);
  const base = `${window.location.origin}${window.location.pathname}`;
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function parseTripFromSearch(search: string): SharedTrip | null {
  const p = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const vehicleId = resolveVehicleId(p.get('v') || DEFAULT_VEHICLE.id);

  // Short template link: ?t=utah-loop
  const templateId = p.get('t') || p.get('template') || '';
  const template = templateId ? getTemplateById(templateId) : undefined;

  const stopsRaw = p.get('stops') || p.get('p') || '';
  const stopIds = stopsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((id) => VALID_IDS.has(id));

  // Template-only link (no explicit stops) → expand template
  if (template && stopIds.length === 0 && !p.get('from') && !p.get('lat')) {
    return sharedTripFromTemplate(template, vehicleId);
  }

  const from = p.get('from') || p.get('start') || '';
  const lat = parseFloat(p.get('lat') || p.get('flat') || '');
  const lng = parseFloat(p.get('lng') || p.get('flng') || '');

  let start: StartLocation | null = null;
  if (from && Number.isFinite(lat) && Number.isFinite(lng)) {
    start = { label: from, lat, lng };
  } else if (template && stopIds.length === 0) {
    start = { ...template.start };
  }

  const returnHome =
    p.get('round') === '1' ||
    p.get('return') === '1' ||
    p.get('returnHome') === '1' ||
    (template && stopIds.length === 0 ? template.returnHome : false);

  const travelMonthRaw = parseInt(p.get('m') || '', 10);
  let travelMonth =
    travelMonthRaw >= 1 && travelMonthRaw <= 12 ? travelMonthRaw : undefined;
  if (travelMonth == null && template) travelMonth = template.travelMonth;

  const nightsByStopId: Record<string, number> = {};
  const nightsRaw = p.get('nights') || '';
  if (nightsRaw) {
    for (const part of nightsRaw.split(',')) {
      const [id, nStr] = part.split(':');
      const n = parseInt(nStr || '', 10);
      if (id && VALID_IDS.has(id) && Number.isFinite(n) && n >= 0 && n <= 14) {
        nightsByStopId[id] = n;
      }
    }
  } else if (template?.nightsByStopId) {
    Object.assign(nightsByStopId, template.nightsByStopId);
  }

  const rangeSettings: Partial<RangeSettings> = {};
  const soc = parseInt(p.get('soc') || '', 10);
  if (Number.isFinite(soc)) rangeSettings.startSocPct = soc;
  const buf = parseInt(p.get('buf') || '', 10);
  if (Number.isFinite(buf)) rangeSettings.arrivalBufferPct = buf;
  const mph = parseInt(p.get('mph') || '', 10);
  if (Number.isFinite(mph)) rangeSettings.highwayMph = mph;
  if (p.get('cold') === '1') rangeSettings.coldWeather = true;
  const cif = parseInt(p.get('cif') || '', 10);
  if (Number.isFinite(cif)) rangeSettings.chargeIntervalFactor = cif / 100;

  const finalStopIds =
    stopIds.length > 0 ? stopIds : template ? [...template.stopIds] : [];

  if (!start && finalStopIds.length === 0) return null;
  return {
    start,
    stopIds: finalStopIds,
    vehicleId,
    returnHome: Boolean(returnHome),
    travelMonth,
    nightsByStopId:
      Object.keys(nightsByStopId).length > 0 ? nightsByStopId : undefined,
    rangeSettings:
      Object.keys(rangeSettings).length > 0 ? rangeSettings : undefined,
    templateId: template?.id,
  };
}

export function resolveVehicle(id: string): ModelYConfig {
  const resolved = resolveVehicleId(id);
  return (
    MODEL_Y_CONFIGS.find((c) => c.id === resolved) ?? DEFAULT_VEHICLE
  );
}

const STORAGE_KEY = 'roadtrip-saved-trip-v2';

export function saveTripLocal(trip: SharedTrip): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  } catch {
    /* ignore */
  }
}

export function loadTripLocal(): SharedTrip | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('roadtrip-saved-trip-v1');
    if (!raw) return null;
    const data = JSON.parse(raw) as SharedTrip;
    if (!data || typeof data !== 'object') return null;
    const stopIds = (data.stopIds || []).filter((id) => VALID_IDS.has(id));
    const start =
      data.start &&
      typeof data.start.lat === 'number' &&
      typeof data.start.lng === 'number'
        ? data.start
        : null;
    return {
      start,
      stopIds,
      vehicleId: resolveVehicleId(data.vehicleId || DEFAULT_VEHICLE.id),
      returnHome: Boolean(data.returnHome),
      rangeSettings: data.rangeSettings,
      nightsByStopId: data.nightsByStopId,
      travelMonth: data.travelMonth,
      templateId: data.templateId,
    };
  } catch {
    return null;
  }
}

/** Human-readable share text for clipboard / Web Share */
export function buildShareSummary(options: {
  trip: SharedTrip;
  vehicleName: string;
  totalMiles?: number | null;
  chargePlan?: ChargePlan | null;
  templateName?: string | null;
}): string {
  const { trip, vehicleName, totalMiles, chargePlan, templateName } = options;
  const stopNames = trip.stopIds
    .map((id) => NATIONAL_PARKS.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  const lines: string[] = [];
  if (templateName) {
    lines.push(`Tesla road trip: ${templateName}`);
  } else {
    lines.push('My Tesla national park road trip');
  }
  if (trip.start) lines.push(`From: ${trip.start.label}`);
  if (stopNames.length) {
    lines.push(
      `Stops (${stopNames.length}): ${stopNames.slice(0, 6).join(' → ')}${
        stopNames.length > 6 ? '…' : ''
      }`,
    );
  }
  if (trip.returnHome) lines.push('Round trip (return home)');
  lines.push(`Vehicle: ${vehicleName}`);
  if (totalMiles && totalMiles > 0) {
    lines.push(`Distance: ~${formatMiles(totalMiles)}`);
  }
  if (chargePlan && chargePlan.stops.length > 0) {
    lines.push(
      `Planned Superchargers: ${chargePlan.stops.length} · ~${chargePlan.totalChargeLabel} · ~$${chargePlan.totalCostUsd.toFixed(2)} (${chargePlan.totalEnergyKwh} kWh @ ~$${chargePlan.ratePerKwh.toFixed(2)}/kWh)`,
    );
    lines.push(
      `Cost band: ~$${chargePlan.costLowUsd.toFixed(2)}–$${chargePlan.costHighUsd.toFixed(2)} (rate varies by site/time)`,
    );
  } else if (chargePlan && chargePlan.stops.length === 0 && totalMiles) {
    lines.push('No Supercharger stop planned (within range)');
  }
  lines.push('Plan: (link below) · Demo only — not Tesla navigation');
  return lines.join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
