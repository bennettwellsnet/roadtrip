import type { ParkSite } from '../data/parks';
import type { RouteLeg } from './routing';
import { formatHours, formatMiles } from './routing';

export type DayKind = 'drive' | 'stay';

export type ItineraryDay = {
  dayNumber: number;
  kind: DayKind;
  title: string;
  detail: string;
  siteId?: string;
  miles?: number;
  hours?: number;
};

/**
 * Build a multi-day plan from ordered stops + nights per stop.
 * Route legs: [start→s0, s0→s1, ..., sN-1→sN, (optional return→start)]
 */
export function buildItinerary(options: {
  hasStart: boolean;
  startLabel: string | null;
  stops: ParkSite[];
  nightsByStopId: Record<string, number>;
  legs: RouteLeg[] | null;
  returnHome: boolean;
}): ItineraryDay[] {
  const { hasStart, startLabel, stops, nightsByStopId, legs, returnHome } =
    options;

  if (stops.length === 0) return [];

  const days: ItineraryDay[] = [];
  let dayNum = 1;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    let intoLeg: RouteLeg | null = null;
    if (legs && legs.length) {
      if (hasStart) {
        intoLeg = legs[i] ?? null;
      } else if (i > 0) {
        intoLeg = legs[i - 1] ?? null;
      }
    }

    const fromLabel =
      i === 0
        ? startLabel ?? null
        : stops[i - 1].name;

    days.push({
      dayNumber: dayNum++,
      kind: 'drive',
      title: `Drive to ${stop.name}`,
      detail: fromLabel
        ? `From ${fromLabel}`
        : 'First stop — set a start for drive stats',
      siteId: stop.id,
      miles: intoLeg?.miles,
      hours: intoLeg?.hours,
    });

    const nights = Math.max(0, Math.min(14, nightsByStopId[stop.id] ?? 1));
    for (let n = 0; n < nights; n++) {
      days.push({
        dayNumber: dayNum++,
        kind: 'stay',
        title: `Stay · ${stop.name}`,
        detail:
          nights <= 1
            ? `Overnight at ${stop.name}`
            : `Night ${n + 1} of ${nights} at ${stop.name}`,
        siteId: stop.id,
      });
    }
  }

  if (returnHome && startLabel) {
    const returnLeg =
      hasStart && legs && legs.length > stops.length
        ? legs[legs.length - 1]
        : null;
    days.push({
      dayNumber: dayNum++,
      kind: 'drive',
      title: 'Drive home',
      detail: `Return to ${startLabel}`,
      miles: returnLeg?.miles,
      hours: returnLeg?.hours,
    });
  }

  return days;
}

export function itinerarySummary(days: ItineraryDay[]): {
  totalDays: number;
  driveDays: number;
  stayNights: number;
} {
  return {
    totalDays: days.length,
    driveDays: days.filter((d) => d.kind === 'drive').length,
    stayNights: days.filter((d) => d.kind === 'stay').length,
  };
}

export function formatDayStats(day: ItineraryDay): string | null {
  if (day.miles == null && day.hours == null) return null;
  const parts: string[] = [];
  if (day.miles != null) parts.push(formatMiles(day.miles));
  if (day.hours != null) parts.push(formatHours(day.hours));
  return parts.join(' · ');
}
