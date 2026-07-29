import type { ParkSite } from '../data/parks';
import {
  buildItinerary,
  formatDayStats,
  itinerarySummary,
} from '../lib/itinerary';
import type { RouteLeg } from '../lib/routing';

type Props = {
  hasStart: boolean;
  startLabel: string | null;
  stops: ParkSite[];
  nightsByStopId: Record<string, number>;
  onNightsChange: (siteId: string, nights: number) => void;
  legs: RouteLeg[] | null;
  returnHome: boolean;
};

export default function ItineraryPanel({
  hasStart,
  startLabel,
  stops,
  nightsByStopId,
  onNightsChange,
  legs,
  returnHome,
}: Props) {
  if (stops.length === 0) return null;

  const days = buildItinerary({
    hasStart,
    startLabel,
    stops,
    nightsByStopId,
    legs,
    returnHome,
  });
  const summary = itinerarySummary(days);

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90">
        Multi-day itinerary
      </h4>
      <p className="mt-1 text-[10px] text-slate-500">
        {summary.totalDays} days · {summary.driveDays} drive ·{' '}
        {summary.stayNights} nights overnight
      </p>

      {/* Nights per stop */}
      <ul className="mt-2 space-y-1">
        {stops.map((s) => {
          const nights = nightsByStopId[s.id] ?? 1;
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2 py-1.5 text-xs"
            >
              <span className="min-w-0 truncate text-slate-200">{s.name}</span>
              <label className="flex shrink-0 items-center gap-1 text-slate-400">
                <span className="text-[10px]">Nights</span>
                <select
                  value={nights}
                  onChange={(e) =>
                    onNightsChange(s.id, Number(e.target.value))
                  }
                  className="rounded-md border border-white/10 bg-slate-900 px-1.5 py-0.5 text-xs text-white"
                >
                  {Array.from({ length: 8 }, (_, i) => i).map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? '0 (pass)' : n}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          );
        })}
      </ul>

      <ol className="mt-2 max-h-40 space-y-1 overflow-y-auto overscroll-contain pr-0.5">
        {days.map((d) => {
          const stats = formatDayStats(d);
          return (
            <li
              key={`${d.dayNumber}-${d.title}`}
              className={`rounded-lg px-2 py-1.5 text-[11px] ${
                d.kind === 'drive'
                  ? 'bg-sky-500/10 text-sky-100'
                  : 'bg-emerald-500/10 text-emerald-100'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold tabular-nums text-slate-400">
                  D{d.dayNumber}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {d.kind === 'drive' ? '🚗 ' : '🏕️ '}
                  {d.title}
                </span>
              </div>
              <div className="mt-0.5 pl-6 text-[10px] text-slate-400">
                {d.detail}
                {stats ? ` · ${stats}` : ''}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
