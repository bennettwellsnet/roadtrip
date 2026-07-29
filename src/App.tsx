import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import type { StartLocation } from './components/TripPanel';
import { NATIONAL_PARKS } from './data/parks';
import {
  DEFAULT_RANGE_SETTINGS,
  DEFAULT_VEHICLE,
  type ModelYConfig,
  type RangeSettings,
} from './data/vehicle';
import type { TripTemplate } from './data/tripTemplates';
import { planChargeStops, type ChargePlan } from './lib/chargeStops';
import { filterParks, type SuperchargerSite } from './lib/geo';
import { optimizeStopOrder } from './lib/optimizeOrder';
import {
  routeTrip,
  type TripRoute,
  type Waypoint,
} from './lib/routing';
import {
  buildShareUrl,
  loadTripLocal,
  parseTripFromSearch,
  resolveVehicle,
  saveTripLocal,
  sharedTripFromTemplate,
} from './lib/tripShare';

type SuperchargerPayload = {
  count: number;
  sites: SuperchargerSite[];
  updated?: string;
  source?: string;
};

export default function App() {
  const [chargers, setChargers] = useState<SuperchargerSite[]>([]);
  const [chargersLoading, setChargersLoading] = useState(true);
  const [chargersError, setChargersError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState<
    '' | 'National Park' | 'National Monument'
  >('');
  const [showParks, setShowParks] = useState(true);
  const [showChargers, setShowChargers] = useState(true);
  const [selectedParkId, setSelectedParkId] = useState<string | null>(null);
  const [selectedChargerId] = useState<number | null>(null);
  const [vehicle, setVehicle] = useState<ModelYConfig>(DEFAULT_VEHICLE);
  const [rangeSettings, setRangeSettings] = useState<RangeSettings>(
    DEFAULT_RANGE_SETTINGS,
  );
  /** null = use state-based Supercharger rates; number = user override $/kWh */
  const [scRatePerKwh, setScRatePerKwh] = useState<number | null>(null);
  const [tripParkIds, setTripParkIds] = useState<string[]>([]);
  const [nightsByStopId, setNightsByStopId] = useState<Record<string, number>>(
    {},
  );
  const [travelMonth, setTravelMonth] = useState(
    () => new Date().getMonth() + 1,
  );
  const [start, setStart] = useState<StartLocation | null>(null);
  const [returnHome, setReturnHome] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [route, setRoute] = useState<TripRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  // Restore trip from URL (share link) or localStorage
  useEffect(() => {
    const fromUrl = parseTripFromSearch(window.location.search);
    const fromLocal = !fromUrl ? loadTripLocal() : null;
    const trip = fromUrl ?? fromLocal;
    if (trip) {
      if (trip.stopIds.length) setTripParkIds(trip.stopIds);
      if (trip.start) setStart(trip.start);
      if (trip.vehicleId) setVehicle(resolveVehicle(trip.vehicleId));
      if (trip.returnHome) setReturnHome(true);
      if (trip.rangeSettings) {
        setRangeSettings({ ...DEFAULT_RANGE_SETTINGS, ...trip.rangeSettings });
      }
      if (trip.nightsByStopId) setNightsByStopId(trip.nightsByStopId);
      if (trip.travelMonth && trip.travelMonth >= 1 && trip.travelMonth <= 12) {
        setTravelMonth(trip.travelMonth);
      }
      if (trip.templateId) setTemplateId(trip.templateId);
      if (fromUrl) {
        showToast(
          trip.templateId
            ? `Loaded trip template`
            : trip.stopIds.length
              ? `Loaded shared trip (${trip.stopIds.length} stop${trip.stopIds.length === 1 ? '' : 's'})`
              : 'Loaded shared start location',
        );
      }
    }
    setHydrated(true);
  }, [showToast]);

  // Keep URL in sync so refresh / bookmark works
  useEffect(() => {
    if (!hydrated) return;
    const shared = {
      start,
      stopIds: tripParkIds,
      vehicleId: vehicle.id,
      returnHome,
      rangeSettings,
      nightsByStopId,
      travelMonth,
      templateId: templateId ?? undefined,
    };
    const url = buildShareUrl(shared);
    const next = url.replace(window.location.origin, '');
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) {
      window.history.replaceState(null, '', next);
    }
    if (start || tripParkIds.length > 0) {
      saveTripLocal(shared);
    }
  }, [
    hydrated,
    start,
    tripParkIds,
    vehicle.id,
    returnHome,
    rangeSettings,
    nightsByStopId,
    travelMonth,
    templateId,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setChargersLoading(true);
        const res = await fetch(
          `${import.meta.env.BASE_URL}data/superchargers-conus.json`,
        );
        if (!res.ok)
          throw new Error(`Failed to load Superchargers (${res.status})`);
        const data = (await res.json()) as SuperchargerPayload;
        if (!cancelled) {
          setChargers(data.sites ?? []);
          setChargersError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setChargersError(e instanceof Error ? e.message : 'Load failed');
        }
      } finally {
        if (!cancelled) setChargersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build driving route when start, order, or return-home changes
  useEffect(() => {
    const parks = tripParkIds
      .map((id) => NATIONAL_PARKS.find((p) => p.id === id))
      .filter((p): p is (typeof NATIONAL_PARKS)[number] => Boolean(p));

    const waypoints: Waypoint[] = [];
    if (start) {
      waypoints.push({
        lat: start.lat,
        lng: start.lng,
        label: start.label,
      });
    }
    for (const p of parks) {
      waypoints.push({
        lat: p.lat,
        lng: p.lng,
        label: `${p.name} ${p.designation === 'National Monument' ? 'NM' : 'NP'}, ${p.state}`,
      });
    }
    if (returnHome && start && parks.length > 0) {
      waypoints.push({
        lat: start.lat,
        lng: start.lng,
        label: `Return home (${start.label})`,
      });
    }

    if (waypoints.length < 2) {
      setRoute(null);
      setRouteLoading(false);
      return;
    }

    let cancelled = false;
    setRouteLoading(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await routeTrip(waypoints);
        if (!cancelled) {
          setRoute(result);
          setRouteLoading(false);
        }
      })();
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [start, tripParkIds, returnHome]);

  // Return home requires a start
  useEffect(() => {
    if (!start && returnHome) setReturnHome(false);
  }, [start, returnHome]);

  const states = useMemo(() => {
    const set = new Set(NATIONAL_PARKS.map((p) => p.state));
    return Array.from(set).sort();
  }, []);

  const filteredParks = useMemo(
    () =>
      filterParks(NATIONAL_PARKS, query, stateFilter, designationFilter),
    [query, stateFilter, designationFilter],
  );

  const onToggleTripPark = useCallback(
    (id: string) => {
      setTemplateId(null);
      setTripParkIds((prev) => {
        if (prev.includes(id)) {
          const park = NATIONAL_PARKS.find((p) => p.id === id);
          showToast(
            park
              ? `Removed ${park.name} from trip`
              : 'Removed park from trip',
          );
          return prev.filter((x) => x !== id);
        }
        const park = NATIONAL_PARKS.find((p) => p.id === id);
        const next = [...prev, id];
        if (next.length === 1 && !start) {
          showToast(
            park
              ? `Added ${park.name}. Set a start city (or add another park) for a route.`
              : 'Park added. Set a start for routing.',
          );
        } else if (next.length >= 2 || (next.length >= 1 && start)) {
          showToast(
            park
              ? `Added ${park.name} — routing…`
              : 'Park added — routing…',
          );
        } else {
          showToast(park ? `Added ${park.name}` : 'Park added');
        }
        return next;
      });
      setSelectedParkId(id);
    },
    [showToast, start],
  );

  const onRemoveTripPark = useCallback((id: string) => {
    setTemplateId(null);
    setTripParkIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const onApplyTemplate = useCallback(
    (template: TripTemplate) => {
      const shared = sharedTripFromTemplate(template, vehicle.id);
      setStart(shared.start);
      setTripParkIds(shared.stopIds);
      setReturnHome(Boolean(shared.returnHome));
      setNightsByStopId(shared.nightsByStopId ?? {});
      if (shared.travelMonth) setTravelMonth(shared.travelMonth);
      setTemplateId(template.id);
      setSelectedParkId(shared.stopIds[0] ?? null);
      showToast(`Loaded “${template.name}” — routing…`);
    },
    [vehicle.id, showToast],
  );

  const onOptimizeOrder = useCallback(async () => {
    if (tripParkIds.length < 2) {
      showToast('Add at least two stops to optimize order');
      return;
    }
    setOptimizing(true);
    try {
      const sitesById = new Map(NATIONAL_PARKS.map((p) => [p.id, p]));
      const result = await optimizeStopOrder(start, tripParkIds, sitesById);
      setTemplateId(null);
      setTripParkIds(result.order);
      if (!result.improved) {
        showToast(
          result.method === 'osrm'
            ? 'Order already looks efficient'
            : 'Order already looks efficient (estimate)',
        );
      } else {
        showToast(
          result.method === 'osrm'
            ? 'Optimized stop order (highway distances)'
            : 'Optimized stop order (distance estimate)',
        );
      }
    } catch {
      showToast('Could not optimize order');
    } finally {
      setOptimizing(false);
    }
  }, [tripParkIds, start, showToast]);

  const tripParks = useMemo(
    () =>
      tripParkIds
        .map((id) => NATIONAL_PARKS.find((p) => p.id === id))
        .filter((p): p is (typeof NATIONAL_PARKS)[number] => Boolean(p)),
    [tripParkIds],
  );

  const chargePlan: ChargePlan | null = useMemo(() => {
    if (!route?.path || route.path.length < 2 || chargers.length === 0) {
      return null;
    }
    return planChargeStops(route.path, chargers, vehicle, {
      rangeSettings,
      ratePerKwh: scRatePerKwh,
    });
  }, [route, chargers, vehicle, rangeSettings, scRatePerKwh]);

  const onNightsChange = useCallback((siteId: string, nights: number) => {
    setNightsByStopId((prev) => ({ ...prev, [siteId]: nights }));
  }, []);

  /** Leg miles for the final return-home segment */
  const returnLeg = useMemo(() => {
    if (!returnHome || !start || !route?.legs.length) return null;
    const last = route.legs[route.legs.length - 1];
    if (!last.toLabel.toLowerCase().includes('return')) return last;
    return last;
  }, [returnHome, start, route]);

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden lg:flex-row">
      <div className="flex h-[52dvh] min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-white/10 p-3 sm:h-[48dvh] sm:p-4 lg:h-full lg:w-[min(440px,38vw)] lg:min-w-[360px] lg:max-w-[480px] lg:border-b-0 lg:border-r lg:p-4">
        <Sidebar
          parks={filteredParks}
          allParks={NATIONAL_PARKS}
          allParksCount={NATIONAL_PARKS.length}
          chargers={chargers}
          chargerCount={chargers.length}
          query={query}
          onQuery={setQuery}
          stateFilter={stateFilter}
          onStateFilter={setStateFilter}
          designationFilter={designationFilter}
          onDesignationFilter={setDesignationFilter}
          states={states}
          showParks={showParks}
          showChargers={showChargers}
          onToggleParks={setShowParks}
          onToggleChargers={setShowChargers}
          selectedParkId={selectedParkId}
          onSelectPark={setSelectedParkId}
          vehicle={vehicle}
          onVehicle={setVehicle}
          rangeSettings={rangeSettings}
          onRangeSettingsChange={setRangeSettings}
          scRatePerKwh={scRatePerKwh}
          onScRatePerKwh={setScRatePerKwh}
          tripParkIds={tripParkIds}
          onToggleTripPark={onToggleTripPark}
          onReorderTrip={(ids) => {
            setTemplateId(null);
            setTripParkIds(ids);
          }}
          onRemoveTripPark={onRemoveTripPark}
          onClearTrip={() => {
            setTripParkIds([]);
            setTemplateId(null);
            setNightsByStopId({});
          }}
          nightsByStopId={nightsByStopId}
          onNightsChange={onNightsChange}
          travelMonth={travelMonth}
          onTravelMonthChange={setTravelMonth}
          start={start}
          onStartChange={(s) => {
            setTemplateId(null);
            setStart(s);
          }}
          route={route}
          routeLoading={routeLoading}
          chargePlan={chargePlan}
          onToast={showToast}
          returnHome={returnHome}
          onReturnHomeChange={(v) => {
            setTemplateId(null);
            setReturnHome(v);
          }}
          onOptimizeOrder={() => void onOptimizeOrder()}
          optimizing={optimizing}
          returnLeg={returnLeg}
          templateId={templateId}
          onApplyTemplate={onApplyTemplate}
        />
      </div>

      <main className="relative min-h-0 flex-1 p-2 sm:p-3 lg:p-4">
        {(chargersLoading ||
          chargersError ||
          routeLoading ||
          optimizing ||
          toast) && (
          <div className="absolute top-6 right-6 z-[1100] max-w-xs space-y-2">
            {(chargersLoading ||
              chargersError ||
              routeLoading ||
              optimizing) && (
              <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-xs text-slate-300 backdrop-blur">
                {chargersLoading && 'Loading Supercharger network…'}
                {chargersError && (
                  <span className="text-amber-300">
                    Chargers: {chargersError}
                  </span>
                )}
                {optimizing && 'Optimizing stop order…'}
                {routeLoading && !chargersLoading && !optimizing && (
                  <span>
                    {returnHome
                      ? 'Routing round trip…'
                      : 'Routing highway distances…'}
                  </span>
                )}
              </div>
            )}
            {toast && (
              <div className="rounded-xl border border-sky-500/40 bg-sky-950/90 px-3 py-2 text-xs text-sky-100 shadow-lg backdrop-blur">
                {toast}
              </div>
            )}
          </div>
        )}
        <MapView
          parks={filteredParks}
          chargers={chargers}
          showParks={showParks}
          showChargers={showChargers}
          selectedParkId={selectedParkId}
          onSelectPark={setSelectedParkId}
          onToggleTripPark={onToggleTripPark}
          selectedChargerId={selectedChargerId}
          start={start}
          tripParks={tripParks}
          routePath={route?.path ?? null}
          chargePlan={chargePlan}
          returnHome={returnHome}
        />
      </main>
    </div>
  );
}
