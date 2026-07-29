import { TRIP_TEMPLATES, type TripTemplate } from '../data/tripTemplates';

type Props = {
  activeTemplateId?: string | null;
  onApply: (template: TripTemplate) => void;
  compact?: boolean;
};

export default function TripTemplates({
  activeTemplateId,
  onApply,
  compact = false,
}: Props) {
  return (
    <div className={compact ? '' : 'mt-2'}>
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90">
        Trip templates
      </h4>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
        One-click load start + parks. Edit order, nights, or vehicle after applying.
      </p>
      <div className="mt-2 grid gap-1.5">
        {TRIP_TEMPLATES.map((t) => {
          const active = activeTemplateId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onApply(t)}
              className={`rounded-xl border px-2.5 py-2 text-left transition ${
                active
                  ? 'border-emerald-400/50 bg-emerald-500/15 ring-1 ring-emerald-400/30'
                  : 'border-white/10 bg-black/25 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white">{t.name}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {t.tagline}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    From {t.start.label.split(',')[0]} · {t.stopIds.length} stops
                    {t.returnHome ? ' · round trip' : ''}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-300">
                  {t.region}
                </span>
              </div>
              {t.notes && (
                <p className="mt-1 text-[10px] leading-snug text-slate-500">
                  {t.notes}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
