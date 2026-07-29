import { useCallback, useState } from 'react';
import type { NationalPark } from '../data/parks';
import { siteShortTag } from '../data/parks';
import { START_PRESETS } from '../data/startPresets';
import type { ModelYConfig, RangeSettings } from '../data/vehicle';
import { suggestedChargeEveryMi } from '../data/vehicle';
import { formatRatePerKwh, formatUsd } from '../data/superchargerRates';
import type { ChargePlan } from '../lib/chargeStops';
import type { GeocodeResult, RouteLeg, TripRoute } from '../lib/routing';
import {
  formatHours,
  formatMiles,
  geocodePlace,
} from '../lib/routing';
import type { TripTemplate } from '../data/tripTemplates';
import ItineraryPanel from './ItineraryPanel';
import SeasonalAlerts from './SeasonalAlerts';
import TripShareExport from './TripShareExport';
import TripTemplates from './TripTemplates';

export type StartLocation = GeocodeResult;

type TripPanelProps = {
  allParks: NationalPark[];
  tripParkIds: string[];
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  start: StartLocation | null;
  onStartChange: (start: StartLocation | null) => void;
  route: TripRoute | null;
  routeLoading: boolean;
  vehicle: ModelYConfig;
  chargePlan: ChargePlan | null;
  onToast?: (msg: string) => void;
  returnHome: boolean;
  onReturnHomeChange: (v: boolean) => void;
  onOptimizeOrder: () => void;
  optimizing: boolean;
  returnLeg: RouteLeg | null;
  rangeSettings: RangeSettings;
  nightsByStopId: Record<string, number>;
  onNightsChange: (siteId: string, nights: number) => void;
  travelMonth: number;
  onTravelMonthChange: (m: number) => void;
  templateId?: string | null;
  onApplyTemplate?: (t: TripTemplate) => void;
  /** Tighter padding for sidebar layout */
  compact?: boolean;
};

export default function TripPanel({
  allParks,
  tripParkIds,
  onReorder,
  onRemove,
  onClear,
  start,
  onStartChange,
  route,
  routeLoading,
  vehicle,
  chargePlan,
  onToast,
  returnHome,
  onReturnHomeChange,
  onOptimizeOrder,
  optimizing,
  returnLeg,
  rangeSettings,
  nightsByStopId,
  onNightsChange,
  travelMonth,
  onTravelMonthChange,
  templateId = null,
  onApplyTemplate,
  compact = false,
}: TripPanelProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const chargeEvery = suggestedChargeEveryMi(vehicle, rangeSettings);
  const tripStops = tripParkIds
    .map((id) => allParks.find((p) => p.id === id))
    .filter((p): p is NationalPark => Boolean(p));

  const searchStart = useCallback(async () => {
    if (query.trim().length < 2) return;
    setGeoLoading(true);
    setGeoError(null);
    try {
      const results = await geocodePlace(query);
      setSuggestions(results);
      if (results.length === 0) setGeoError('No places found in the U.S.');
    } catch {
      setGeoError('Could not look up that place. Try a city, ST');
      setSuggestions([]);
    } finally {
      setGeoLoading(false);
    }
  }, [query]);

  const pickStart = (place: GeocodeResult) => {
    onStartChange(place);
    setQuery(place.label);
    setSuggestions([]);
    setGeoError(null);
  };

  const clearStart = () => {
    onStartChange(null);
    setQuery('');
    setSuggestions([]);
  };

  const onDragStart = (index: number) => setDragIndex(index);

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...tripParkIds];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(index);
    onReorder(next);
  };

  const onDragEnd = () => setDragIndex(null);

  /** Leg into this park: waypoint index of park is (start ? index+1 : index) */
  const legIntoPark = (parkIndex: number) => {
    if (!route) return null;
    const intoLegIndex = start ? parkIndex : parkIndex - 1;
    if (intoLegIndex < 0 || intoLegIndex >= route.legs.length) return null;
    return route.legs[intoLegIndex];
  };

  return (
    <section
      className={`shrink-0 rounded-2xl border border-sky-500/30 bg-sky-500/10 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-200">
          Your trip
          {tripParkIds.length > 0 ? ` (${tripParkIds.length} stops)` : ''}
        </h3>
        {(tripParkIds.length > 0 || start) && (
          <button
            type="button"
            onClick={() => {
              onClear();
              clearStart();
            }}
            className="text-[11px] text-slate-400 underline hover:text-white"
          >
            Clear all
          </button>
        )}
      </div>

      {onApplyTemplate && (
        <div className="mt-3 border-b border-white/10 pb-3">
          <TripTemplates
            activeTemplateId={templateId}
            onApply={onApplyTemplate}
            compact
          />
        </div>
      )}

      {/* Starting location */}
      <div className="mt-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Starting location
        </label>
        {start ? (
          <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2">
            <span className="text-sky-300" aria-hidden>
              📍
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-white">
              {start.label}
            </span>
            <button
              type="button"
              onClick={clearStart}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="mt-1.5 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void searchStart();
                  }
                }}
                placeholder="City, state or address…"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40"
              />
              <button
                type="button"
                onClick={() => void searchStart()}
                disabled={geoLoading || query.trim().length < 2}
                className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
              >
                {geoLoading ? '…' : 'Set'}
              </button>
            </div>
            {geoError && (
              <p className="text-[11px] text-amber-300">{geoError}</p>
            )}
            {suggestions.length > 0 && (
              <ul className="max-h-28 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/90">
                {suggestions.map((s) => (
                  <li key={`${s.lat},${s.lng}`}>
                    <button
                      type="button"
                      onClick={() => pickStart(s)}
                      className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/10"
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-1">
              {START_PRESETS.slice(0, 8).map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => pickStart(p)}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  {p.label.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Round trip + optimize */}
      <div className="mt-3 space-y-2">
        <label
          className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
            start
              ? 'cursor-pointer bg-black/30 text-slate-200'
              : 'cursor-not-allowed bg-black/20 text-slate-600'
          }`}
        >
          <span>
            <span className="font-medium">Round trip · return home</span>
            <span className="mt-0.5 block text-[10px] text-slate-500">
              {start
                ? 'Adds drive back to your start for miles, charges & export'
                : 'Set a starting location first'}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={returnHome}
            disabled={!start}
            onClick={() => onReturnHomeChange(!returnHome)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              returnHome && start ? 'bg-sky-500' : 'bg-slate-700'
            } disabled:opacity-40`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                returnHome && start ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </label>

        <button
          type="button"
          onClick={onOptimizeOrder}
          disabled={optimizing || tripParkIds.length < 2}
          className="w-full rounded-xl border border-sky-500/40 bg-sky-600/30 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-600/45 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {optimizing
            ? 'Optimizing order…'
            : tripParkIds.length < 2
              ? 'Optimize order (need 2+ stops)'
              : start
                ? 'Optimize stop order from start'
                : 'Optimize stop order'}
        </button>
      </div>

      {/* Ordered stops */}
      {tripParkIds.length > 0 && (
        <>
          <p className="mt-3 text-[10px] text-slate-500">
            Drag ☰ to reorder · or use optimize above
          </p>
          <ul className="mt-1.5 space-y-1">
            {tripParkIds.map((id, index) => {
              const p = allParks.find((x) => x.id === id);
              const intoLeg = legIntoPark(index);

              return (
                <li
                  key={id}
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragEnd={onDragEnd}
                  className={`flex cursor-grab items-start gap-2 rounded-xl bg-black/30 px-2 py-2 active:cursor-grabbing ${
                    dragIndex === index
                      ? 'opacity-80 ring-1 ring-sky-400/50'
                      : ''
                  }`}
                >
                  <span
                    className="mt-0.5 select-none text-slate-500"
                    title="Drag to reorder"
                    aria-hidden
                  >
                    ☰
                  </span>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600/40 text-[10px] font-bold text-sky-100">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">
                      {p ? p.name : id}
                      {p && (
                        <span className="ml-1 text-xs font-normal text-slate-500">
                          {p.state} · {siteShortTag(p)}
                        </span>
                      )}
                    </div>
                    {intoLeg && (
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        ← {formatMiles(intoLeg.miles)}
                        {' · '}
                        {formatHours(intoLeg.hours)}
                        {!intoLeg.isHighway && (
                          <span className="text-amber-400/80"> (est.)</span>
                        )}
                        {intoLeg.miles > chargeEvery && (
                          <span className="text-red-300">
                            {' '}
                            · charge stop likely
                          </span>
                        )}
                      </div>
                    )}
                    {index === 0 && !start && (
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        Set a start for distance to first park
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(id)}
                    className="shrink-0 text-[11px] text-slate-500 hover:text-red-300"
                    title="Remove from trip"
                  >
                    ✕
                  </button>
                </li>
              );
            })}

            {returnHome && start && (
              <li className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-2 py-2">
                <span className="mt-0.5 w-4" aria-hidden />
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                  ↩
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-sky-100">
                    Return home
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {start.label}
                  </div>
                  {returnLeg && (
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      ← {formatMiles(returnLeg.miles)}
                      {' · '}
                      {formatHours(returnLeg.hours)}
                      {returnLeg.miles > chargeEvery && (
                        <span className="text-red-300">
                          {' '}
                          · charge stop likely
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )}
          </ul>
        </>
      )}

      {tripParkIds.length === 0 && (
        <p className="mt-3 text-xs text-slate-400">
          {start
            ? 'Add parks or monuments from the list — drag to order once you have two or more.'
            : 'Set a starting location and add parks or monuments to build your route.'}
        </p>
      )}

      {/* Totals */}
      {(route || routeLoading) &&
        (tripParkIds.length > 1 || (start && tripParkIds.length > 0)) && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            <div className="rounded-xl bg-black/30 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                {returnHome
                  ? 'Round-trip total'
                  : route && !route.isHighway
                    ? 'Est. total'
                    : 'Highway total'}
              </div>
              <div className="text-sm font-semibold tabular-nums text-white">
                {routeLoading ? '…' : formatMiles(route?.totalMiles ?? 0)}
              </div>
            </div>
            <div className="rounded-xl bg-black/30 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                Drive time
              </div>
              <div className="text-sm font-semibold tabular-nums text-white">
                {routeLoading ? '…' : formatHours(route?.totalHours ?? 0)}
              </div>
            </div>
          </div>
        )}

      {route && !route.isHighway && (
        <p className="mt-2 text-[10px] text-amber-400/90">
          Road routing unavailable — showing ~highway estimate (straight-line ×
          1.22).
        </p>
      )}

      {/* Planned Supercharger stops for this route + Model Y range */}
      {route &&
        !routeLoading &&
        (tripParkIds.length > 1 || (start && tripParkIds.length > 0)) && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
              Superchargers on your route
            </h4>
            {!chargePlan || chargePlan.stops.length === 0 ? (
              <p className="mt-1.5 text-[11px] text-slate-400">
                {chargePlan && chargePlan.totalRouteMi <= chargePlan.usableRangeMi
                  ? `No charge stop needed — trip is within your ~${chargePlan.usableRangeMi} mi planning range.`
                  : chargePlan?.coverageGap
                    ? chargePlan.gapMessage
                    : `Planning charges every ~${chargeEvery} mi of highway for your ${vehicle.name}.`}
              </p>
            ) : (
              <>
                {chargePlan.stops.length > 0 && (
                  <div className="mt-1.5 space-y-1.5">
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-100">
                        ~{formatUsd(chargePlan.totalCostUsd)} Supercharging
                      </span>
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-100">
                        ~{chargePlan.totalChargeLabel} plug-in time
                      </span>
                      <span className="rounded-full bg-black/30 px-2 py-0.5 text-slate-400">
                        {chargePlan.totalEnergyKwh} kWh ·{' '}
                        {formatRatePerKwh(chargePlan.ratePerKwh)} blend
                      </span>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-2 text-[11px] text-emerald-50/90">
                      <div className="font-semibold text-emerald-100">
                        Trip Supercharger cost estimate
                      </div>
                      <div className="mt-0.5 tabular-nums">
                        Mid ~{formatUsd(chargePlan.totalCostUsd)} · band{' '}
                        {formatUsd(chargePlan.costLowUsd)}–
                        {formatUsd(chargePlan.costHighUsd)}
                      </div>
                      {chargePlan.gasCompareUsd > 0 && (
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          Comparable gas (~28 mpg @ $3.50/gal): ~
                          {formatUsd(chargePlan.gasCompareUsd)} for{' '}
                          {formatMiles(chargePlan.totalRouteMi)}
                          {chargePlan.totalCostUsd < chargePlan.gasCompareUsd
                            ? ` · SC ~${formatUsd(chargePlan.gasCompareUsd - chargePlan.totalCostUsd)} less`
                            : ''}
                        </div>
                      )}
                      <div className="mt-1 text-[10px] text-slate-500">
                        Rates are planning defaults by state (or your Settings
                        override). Live Tesla app prices vary by site and peak
                        hours.
                      </div>
                    </div>
                  </div>
                )}
                <ul className="mt-1.5 space-y-1.5">
                  {chargePlan.stops.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-2 py-1.5"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                        ⚡{s.stopNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-1">
                          <div className="truncate text-xs font-medium text-white">
                            {s.name}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[11px] font-semibold tabular-nums text-emerald-200">
                              ~{formatUsd(s.costUsd)}
                            </div>
                            <div className="text-[10px] tabular-nums text-amber-200/90">
                              ~{s.chargeMinutes} min
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {[s.city, s.state].filter(Boolean).join(', ')}
                          {s.kw ? ` · ${s.kw} kW peak` : ''}
                          {s.stalls ? ` · ${s.stalls} stalls` : ''}
                        </div>
                        <div className="text-[10px] text-amber-200/80">
                          After {formatMiles(s.legFromPreviousMi)} · ~
                          {formatMiles(s.alongMi)} into trip
                          {s.detourMi >= 1
                            ? ` · ${s.detourMi.toFixed(0)} mi off route`
                            : ''}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ~{s.energyKwh} kWh × {formatRatePerKwh(s.ratePerKwh)}{' '}
                          ({s.state || 'US'} mid) · ~{s.avgChargeKw} kW avg
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {chargePlan && chargePlan.alongRoute.length > 0 && (
              <p className="mt-1.5 text-[10px] text-slate-500">
                {chargePlan.alongRoute.length} Superchargers within ~18 mi of
                the route
                {chargePlan.stops.length > 0
                  ? ` · ${chargePlan.stops.length} planned stop${chargePlan.stops.length === 1 ? '' : 's'} · ~${chargePlan.totalChargeLabel} · ~${formatUsd(chargePlan.totalCostUsd)}`
                  : ''}
                . Amber pins on the map are planned charges.
              </p>
            )}
            {chargePlan?.coverageGap && chargePlan.stops.length > 0 && (
              <p className="mt-1 text-[10px] text-amber-400/90">
                {chargePlan.gapMessage}
              </p>
            )}
          </div>
        )}

      {route?.isHighway &&
        (tripParkIds.length > 1 || (start && tripParkIds.length > 0)) && (
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            Distances via OSRM. Charge plan uses your ~{chargeEvery} mi
            highway interval (not live Tesla navigation).
          </p>
        )}

      <ItineraryPanel
        hasStart={Boolean(start)}
        startLabel={start?.label ?? null}
        stops={tripStops}
        nightsByStopId={nightsByStopId}
        onNightsChange={onNightsChange}
        legs={route?.legs ?? null}
        returnHome={returnHome}
      />

      <SeasonalAlerts
        stopIds={tripParkIds}
        travelMonth={travelMonth}
        onMonthChange={onTravelMonthChange}
      />

      <TripShareExport
        start={start}
        tripParks={tripStops}
        tripParkIds={tripParkIds}
        vehicleId={vehicle.id}
        vehicleName={vehicle.name}
        chargePlan={chargePlan}
        routePath={route?.path ?? null}
        totalMiles={route?.totalMiles ?? null}
        returnHome={returnHome}
        nightsByStopId={nightsByStopId}
        travelMonth={travelMonth}
        templateId={templateId}
        onToast={onToast ?? (() => undefined)}
      />
    </section>
  );
}
