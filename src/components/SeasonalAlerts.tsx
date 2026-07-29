import { MONTH_LABELS, notesForTrip, type SeasonalNote } from '../data/seasonalNotes';
import { NATIONAL_PARKS } from '../data/parks';

type Props = {
  stopIds: string[];
  travelMonth: number;
  onMonthChange: (month: number) => void;
};

export default function SeasonalAlerts({
  stopIds,
  travelMonth,
  onMonthChange,
}: Props) {
  const notes = notesForTrip(stopIds, travelMonth);
  const nameById = new Map(NATIONAL_PARKS.map((p) => [p.id, p.name]));

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
          Seasonal notes
        </h4>
        <label className="flex items-center gap-1 text-[10px] text-slate-400">
          Month
          <select
            value={travelMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="rounded-md border border-white/10 bg-slate-900 px-1.5 py-0.5 text-[11px] text-white"
          >
            {MONTH_LABELS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label.slice(0, 3)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-1 text-[10px] text-slate-500">
        Road closures, timed entry, heat — for {MONTH_LABELS[travelMonth - 1]}.
        Always verify on nps.gov.
      </p>

      {stopIds.length === 0 ? (
        <p className="mt-2 text-[11px] text-slate-500">
          Add stops to see seasonal advisories.
        </p>
      ) : notes.length === 0 ? (
        <p className="mt-2 text-[11px] text-emerald-400/90">
          No major seasonal flags for these stops in{' '}
          {MONTH_LABELS[travelMonth - 1]}.
        </p>
      ) : (
        <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto overscroll-contain">
          {notes.map((n) => (
            <NoteCard
              key={`${n.siteId}-${n.title}`}
              note={n}
              siteName={nameById.get(n.siteId) ?? n.siteId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteCard({
  note,
  siteName,
}: {
  note: SeasonalNote;
  siteName: string;
}) {
  const colors =
    note.severity === 'closed'
      ? 'border-red-500/40 bg-red-500/10 text-red-100'
      : note.severity === 'caution'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-50'
        : 'border-sky-500/30 bg-sky-500/10 text-sky-50';
  const badge =
    note.severity === 'closed'
      ? 'CLOSED/LIMITED'
      : note.severity === 'caution'
        ? 'CAUTION'
        : 'INFO';

  return (
    <li className={`rounded-xl border px-2.5 py-2 text-[11px] ${colors}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{siteName}</span>
        <span className="text-[9px] font-bold tracking-wide opacity-80">
          {badge}
        </span>
      </div>
      <div className="mt-0.5 font-medium opacity-95">{note.title}</div>
      <p className="mt-0.5 text-[10px] leading-snug opacity-80">{note.detail}</p>
    </li>
  );
}
