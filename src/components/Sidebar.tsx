import { useEffect, useState } from 'react';
import type { NationalPark, SiteDesignation } from '../data/parks';
import { countByDesignation, parkNpsUrl, siteShortTag } from '../data/parks';
import type { ModelYConfig, RangeSettings } from '../data/vehicle';
import {
  MODEL_Y_CONFIGS,
  summarizeRange,
  vehicleFamilies,
  vehiclesByFamily,
} from '../data/vehicle';
import { notesForSite } from '../data/seasonalNotes';
import type { SuperchargerSite } from '../lib/geo';
import { nearestSuperchargers } from '../lib/geo';
import type { TripTemplate } from '../data/tripTemplates';
import type { ChargePlan } from '../lib/chargeStops';
import type { RouteLeg, TripRoute } from '../lib/routing';
import RangeSettingsPanel from './RangeSettingsPanel';
import TripPanel, { type StartLocation } from './TripPanel';

type SidebarTab = 'browse' | 'trip' | 'settings';

type SidebarProps = {
  parks: NationalPark[];
  allParks: NationalPark[];
  allParksCount: number;
  chargers: SuperchargerSite[];
  chargerCount: number;
  query: string;
  onQuery: (q: string) => void;
  stateFilter: string;
  onStateFilter: (s: string) => void;
  designationFilter: '' | SiteDesignation;
  onDesignationFilter: (d: '' | SiteDesignation) => void;
  states: string[];
  showParks: boolean;
  showChargers: boolean;
  onToggleParks: (v: boolean) => void;
  onToggleChargers: (v: boolean) => void;
  selectedParkId: string | null;
  onSelectPark: (id: string | null) => void;
  vehicle: ModelYConfig;
  onVehicle: (v: ModelYConfig) => void;
  rangeSettings: RangeSettings;
  onRangeSettingsChange: (s: RangeSettings) => void;
  scRatePerKwh: number | null;
  onScRatePerKwh: (rate: number | null) => void;
  tripParkIds: string[];
  onToggleTripPark: (id: string) => void;
  onReorderTrip: (ids: string[]) => void;
  onRemoveTripPark: (id: string) => void;
  onClearTrip: () => void;
  nightsByStopId: Record<string, number>;
  onNightsChange: (siteId: string, nights: number) => void;
  travelMonth: number;
  onTravelMonthChange: (m: number) => void;
  start: StartLocation | null;
  onStartChange: (start: StartLocation | null) => void;
  route: TripRoute | null;
  routeLoading: boolean;
  chargePlan: ChargePlan | null;
  onToast?: (msg: string) => void;
  returnHome: boolean;
  onReturnHomeChange: (v: boolean) => void;
  onOptimizeOrder: () => void;
  optimizing: boolean;
  returnLeg: RouteLeg | null;
  templateId: string | null;
  onApplyTemplate: (t: TripTemplate) => void;
};

export default function Sidebar({
  parks,
  allParks,
  allParksCount,
  chargers,
  chargerCount,
  query,
  onQuery,
  stateFilter,
  onStateFilter,
  designationFilter,
  onDesignationFilter,
  states,
  showParks,
  showChargers,
  onToggleParks,
  onToggleChargers,
  selectedParkId,
  onSelectPark,
  vehicle,
  onVehicle,
  rangeSettings,
  onRangeSettingsChange,
  scRatePerKwh,
  onScRatePerKwh,
  tripParkIds,
  onToggleTripPark,
  onReorderTrip,
  onRemoveTripPark,
  onClearTrip,
  nightsByStopId,
  onNightsChange,
  travelMonth,
  onTravelMonthChange,
  start,
  onStartChange,
  route,
  routeLoading,
  chargePlan,
  onToast,
  returnHome,
  onReturnHomeChange,
  onOptimizeOrder,
  optimizing,
  returnLeg,
  templateId,
  onApplyTemplate,
}: SidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('browse');

  // When user builds a route / applies template, surface the Trip tab once
  useEffect(() => {
    if (tripParkIds.length >= 2 || (start && tripParkIds.length >= 1)) {
      // Don't force-switch if they already chose another tab this session —
      // only auto-jump when they first get a routable trip from empty.
    }
  }, [tripParkIds.length, start]);

  const selected =
    allParks.find((p) => p.id === selectedParkId) ??
    parks.find((p) => p.id === selectedParkId) ??
    null;
  const nearby = selected ? nearestSuperchargers(selected, chargers, 5) : [];
  const counts = countByDesignation(allParks);
  const rangeSummary = summarizeRange(vehicle, rangeSettings);
  const selectedSeasonal = selected
    ? notesForSite(selected.id, travelMonth)
    : [];

  const tripBadge =
    tripParkIds.length > 0 ? String(tripParkIds.length) : undefined;
  const costHint =
    chargePlan && chargePlan.stops.length > 0
      ? `~$${Math.round(chargePlan.totalCostUsd)}`
      : null;

  const onApplyTemplateAndShowTrip = (t: TripTemplate) => {
    onApplyTemplate(t);
    setTab('trip');
  };

  const onAddPark = (id: string) => {
    onToggleTripPark(id);
    // Stay on Browse so they can keep adding; trip count is in the tab badge
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:max-w-none">
      {/* Header + primary tabs */}
      <header className="shrink-0 space-y-2.5 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-red-400">
              <span className="text-lg" aria-hidden>
                ⚡
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-400/90">
                Tesla road trip
              </p>
            </div>
            <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Parks & Monuments
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {counts.parks} parks · {counts.monuments} monuments
              {route && !routeLoading
                ? ` · ~${Math.round(route.totalMiles)} mi`
                : ''}
              {costHint ? ` · ${costHint} SC` : ''}
            </p>
          </div>
          <a
            href="/projects"
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:bg-white/10 hover:text-slate-200"
          >
            ← Projects
          </a>
        </div>

        <nav
          className="grid grid-cols-3 gap-1 rounded-xl bg-black/40 p-1"
          aria-label="Sidebar sections"
        >
          <TabButton
            active={tab === 'browse'}
            onClick={() => setTab('browse')}
            label="Browse"
            hint="Add parks"
          />
          <TabButton
            active={tab === 'trip'}
            onClick={() => setTab('trip')}
            label="Trip"
            badge={tripBadge}
            hint="Route & costs"
          />
          <TabButton
            active={tab === 'settings'}
            onClick={() => setTab('settings')}
            label="Settings"
            hint="Car & rates"
          />
        </nav>
      </header>

      {/* Single scroll region for the active tab */}
      <div className="sidebar-scroll mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
        {tab === 'browse' && (
          <div className="flex min-h-full flex-col gap-3 pb-3">
            <section className="flex min-h-[min(52vh,420px)] flex-1 flex-col overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3">
              <div className="flex shrink-0 items-baseline justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
                  Add stops
                </h2>
                <span className="text-[11px] tabular-nums text-slate-500">
                  {tripParkIds.length} on trip · {parks.length} shown
                </span>
              </div>
              <p className="mt-0.5 shrink-0 text-[11px] text-slate-500">
                Search, filter, or tap the map. Switch to{' '}
                <button
                  type="button"
                  className="text-sky-300 underline"
                  onClick={() => setTab('trip')}
                >
                  Trip
                </button>{' '}
                for routing, Superchargers, and costs.
              </p>
              <div className="mt-2 flex shrink-0 flex-wrap gap-2">
                <input
                  type="search"
                  placeholder="Search parks & monuments…"
                  value={query}
                  onChange={(e) => onQuery(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500/40"
                />
                <select
                  value={stateFilter}
                  onChange={(e) => onStateFilter(e.target.value)}
                  className="w-[4.5rem] rounded-xl border border-white/10 bg-slate-900/80 px-2 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
                >
                  <option value="">All</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={designationFilter}
                  onChange={(e) =>
                    onDesignationFilter(
                      e.target.value as '' | SiteDesignation,
                    )
                  }
                  className="w-[7.5rem] rounded-xl border border-white/10 bg-slate-900/80 px-2 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
                >
                  <option value="">Parks + NM</option>
                  <option value="National Park">Parks only</option>
                  <option value="National Monument">Monuments</option>
                </select>
              </div>

              <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
                {parks.map((p) => {
                  const active = p.id === selectedParkId;
                  const inTrip = tripParkIds.includes(p.id);
                  const stopNum = inTrip
                    ? tripParkIds.indexOf(p.id) + 1
                    : null;
                  return (
                    <li key={p.id}>
                      <div
                        className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition ${
                          active
                            ? 'bg-emerald-500/20 ring-1 ring-emerald-400/40'
                            : inTrip
                              ? 'bg-sky-500/10'
                              : 'hover:bg-white/5'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPark(p.id);
                            if (!inTrip) onAddPark(p.id);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            {stopNum != null ? (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                                {stopNum}
                              </span>
                            ) : (
                              <span className="text-emerald-400">●</span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            <span className="font-medium text-white">
                              {p.name}
                            </span>
                            <span className="ml-1.5 text-xs text-slate-500">
                              {p.state}
                            </span>
                            <span
                              className={`ml-1.5 text-[10px] font-semibold ${
                                p.designation === 'National Monument'
                                  ? 'text-violet-300/90'
                                  : 'text-emerald-400/80'
                              }`}
                            >
                              {siteShortTag(p)}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddPark(p.id)}
                          className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            inTrip
                              ? 'bg-sky-500/30 text-sky-200 hover:bg-sky-500/40'
                              : 'bg-sky-600 text-white hover:bg-sky-500'
                          }`}
                        >
                          {inTrip ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </li>
                  );
                })}
                {parks.length === 0 && (
                  <li className="px-2 py-8 text-center text-sm text-slate-500">
                    No sites match your filters.
                  </li>
                )}
              </ul>
            </section>

            {selected && (
              <section className="shrink-0 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">
                      {selected.name}
                    </h3>
                    <p className="text-[11px] text-emerald-200/80">
                      {selected.state} · {selected.designation}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <a
                      href={parkNpsUrl(selected)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-sky-300 underline"
                    >
                      NPS ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => setTab('trip')}
                      className="text-[11px] text-sky-300 underline"
                    >
                      View trip →
                    </button>
                  </div>
                </div>
                {nearby.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Nearest SC: {nearby[0].name} (
                    {nearby[0].distanceMi.toFixed(0)} mi)
                  </p>
                )}
                {selectedSeasonal.length > 0 && (
                  <p className="mt-1 text-[10px] text-amber-300/90">
                    ⚠ {selectedSeasonal[0].title}
                    {selectedSeasonal.length > 1
                      ? ` (+${selectedSeasonal.length - 1} more)`
                      : ''}
                  </p>
                )}
              </section>
            )}

            {tripParkIds.length > 0 && (
              <button
                type="button"
                onClick={() => setTab('trip')}
                className="shrink-0 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-2.5 text-left text-sm text-sky-100 hover:bg-sky-500/25"
              >
                <span className="font-semibold">
                  {tripParkIds.length} stop
                  {tripParkIds.length === 1 ? '' : 's'} on trip
                </span>
                <span className="mt-0.5 block text-[11px] text-sky-200/70">
                  Open Trip tab for route, Superchargers, costs & share →
                </span>
              </button>
            )}
          </div>
        )}

        {tab === 'trip' && (
          <div className="pb-3">
            <TripPanel
              allParks={allParks}
              tripParkIds={tripParkIds}
              onReorder={onReorderTrip}
              onRemove={onRemoveTripPark}
              onClear={onClearTrip}
              start={start}
              onStartChange={onStartChange}
              route={route}
              routeLoading={routeLoading}
              vehicle={vehicle}
              chargePlan={chargePlan}
              onToast={onToast}
              returnHome={returnHome}
              onReturnHomeChange={onReturnHomeChange}
              onOptimizeOrder={onOptimizeOrder}
              optimizing={optimizing}
              returnLeg={returnLeg}
              rangeSettings={rangeSettings}
              nightsByStopId={nightsByStopId}
              onNightsChange={onNightsChange}
              travelMonth={travelMonth}
              onTravelMonthChange={onTravelMonthChange}
              templateId={templateId}
              onApplyTemplate={onApplyTemplateAndShowTrip}
              compact={false}
            />
            {tripParkIds.length === 0 && (
              <p className="mt-3 text-center text-sm text-slate-500">
                No stops yet.{' '}
                <button
                  type="button"
                  className="text-sky-300 underline"
                  onClick={() => setTab('browse')}
                >
                  Browse parks
                </button>{' '}
                or pick a template above.
              </p>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-3 pb-3">
            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div>
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Tesla model
                </h2>
                <select
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
                  value={vehicle.id}
                  onChange={(e) => {
                    const v = MODEL_Y_CONFIGS.find(
                      (c) => c.id === e.target.value,
                    );
                    if (v) onVehicle(v);
                  }}
                >
                  {vehicleFamilies().map((family) => (
                    <optgroup key={family} label={family}>
                      {vehiclesByFamily(family).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name.replace(`${family} `, '')} · {c.epaRangeMi}{' '}
                          mi EPA
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">
                  {vehicle.name} — ranges are approximate for planning.
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                  <Stat label="EPA" value={`${vehicle.epaRangeMi} mi`} />
                  <Stat
                    label="Usable"
                    value={`${rangeSummary.fullPackMi} mi`}
                  />
                  <Stat
                    label="Stop ~"
                    value={`${rangeSummary.chargeEveryMi} mi`}
                  />
                </div>
              </div>
              <RangeSettingsPanel
                vehicle={vehicle}
                settings={rangeSettings}
                onChange={onRangeSettingsChange}
                scRatePerKwh={scRatePerKwh}
                onScRatePerKwh={onScRatePerKwh}
              />
              <div>
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Map layers
                </h2>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  <Toggle
                    checked={showParks}
                    onChange={onToggleParks}
                    label={`Sites (${allParksCount})`}
                    accent="emerald"
                  />
                  <Toggle
                    checked={showChargers}
                    onChange={onToggleChargers}
                    label={`Superchargers (${chargerCount.toLocaleString()})`}
                    accent="red"
                  />
                </div>
              </div>
            </section>
            <p className="text-[10px] leading-relaxed text-slate-600">
              Superchargers via supercharge.info · routes via OSRM. Cost and
              range figures are planning estimates—not Tesla navigation. Not
              affiliated with Tesla or NPS.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  label,
  badge,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={`relative rounded-lg px-2 py-2 text-center text-xs font-semibold transition ${
        active
          ? 'bg-sky-500 text-white shadow'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <span className="inline-flex items-center justify-center gap-1">
        {label}
        {badge != null && (
          <span
            className={`inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
              active ? 'bg-white/25 text-white' : 'bg-sky-500/30 text-sky-200'
            }`}
          >
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 px-1.5 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-xs font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  accent,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  accent: 'emerald' | 'red';
}) {
  const on = accent === 'emerald' ? 'bg-emerald-500' : 'bg-red-600';
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-200">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? on : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}
