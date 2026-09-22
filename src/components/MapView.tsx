import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  CircleMarker,
  Popup,
  useMap,
  Marker,
  Polyline,
} from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';

// The published bundle looks for a sibling worker file. Vite inlines MapLibre
// into the app chunk, so point it at the worker Vite actually emits.
setWorkerUrl(maplibreWorkerUrl);
import type { NationalPark } from '../data/parks';
import { parkNpsUrl, siteShortTag } from '../data/parks';
import type { ChargePlan } from '../lib/chargeStops';
import type { SuperchargerSite } from '../lib/geo';
import { nearestSuperchargers } from '../lib/geo';
import type { StartLocation } from './TripPanel';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/** CARTO raster tiles watermark every request that lacks an API key. */
const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';

function Basemap() {
  const map = useMap();
  useEffect(() => {
    const layer = L.maplibreGL({ style: BASEMAP_STYLE }).addTo(map);
    return () => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    };
  }, [map]);
  return null;
}

const superchargerIcon = L.divIcon({
  className: 'sc-marker',
  html: `<div style="
    width:10px;height:10px;border-radius:50%;
    background:#cc0000;border:1.5px solid #fff;
    box-shadow:0 0 0 1px rgba(0,0,0,.25);
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const startIcon = L.divIcon({
  className: 'start-marker',
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#38bdf8;border:2px solid #fff;
    box-shadow:0 1px 4px rgba(0,0,0,.4);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function chargeStopIcon(n: number) {
  return L.divIcon({
    className: 'charge-stop-marker',
    html: `<div style="
      min-width:26px;height:26px;padding:0 5px;border-radius:999px;
      background:#f59e0b;border:2px solid #fff;color:#111;
      font:700 11px/22px Inter,system-ui,sans-serif;text-align:center;
      box-shadow:0 2px 8px rgba(0,0,0,.45);white-space:nowrap;
    ">⚡${n}</div>`,
    iconSize: [28, 26],
    iconAnchor: [14, 13],
  });
}

const alongRouteIcon = L.divIcon({
  className: 'along-sc-marker',
  html: `<div style="
    width:12px;height:12px;border-radius:50%;
    background:#fbbf24;border:1.5px solid #fff;opacity:0.85;
    box-shadow:0 0 0 1px rgba(0,0,0,.2);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

/** Keep park markers above Supercharger clusters */
function ParkPane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('parksPane')) {
      const pane = map.createPane('parksPane');
      pane.style.zIndex = '650';
      pane.style.pointerEvents = 'auto';
    }
    if (!map.getPane('tripPane')) {
      const pane = map.createPane('tripPane');
      pane.style.zIndex = '660';
    }
    if (!map.getPane('chargePane')) {
      const pane = map.createPane('chargePane');
      pane.style.zIndex = '670';
    }
  }, [map]);
  return null;
}

function FitContinentalUS({ hasTrip }: { hasTrip: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (hasTrip) return;
    map.fitBounds(L.latLngBounds([24.5, -125], [49.5, -66.5]), {
      padding: [20, 20],
    });
  }, [map, hasTrip]);
  return null;
}

function FitTrip({
  path,
  start,
  tripParks,
}: {
  path: [number, number][] | null;
  start: StartLocation | null;
  tripParks: NationalPark[];
}) {
  const map = useMap();
  useEffect(() => {
    const points: L.LatLngExpression[] = [];
    if (path && path.length > 1) {
      path.forEach((p) => points.push(p));
    } else {
      if (start) points.push([start.lat, start.lng]);
      tripParks.forEach((p) => points.push([p.lat, p.lng]));
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo(points[0], 7, { duration: 0.6 });
      return;
    }
    map.fitBounds(L.latLngBounds(points), {
      padding: [48, 48],
      maxZoom: 8,
      animate: true,
    });
  }, [map, path, start, tripParks]);
  return null;
}

type MapViewProps = {
  parks: NationalPark[];
  chargers: SuperchargerSite[];
  showParks: boolean;
  showChargers: boolean;
  selectedParkId: string | null;
  onSelectPark: (id: string) => void;
  /** Click park on map → add to trip (or remove if already on trip) */
  onToggleTripPark: (id: string) => void;
  selectedChargerId: number | null;
  start: StartLocation | null;
  tripParks: NationalPark[];
  routePath: [number, number][] | null;
  chargePlan: ChargePlan | null;
  returnHome?: boolean;
};

export default function MapView({
  parks,
  chargers,
  showParks,
  showChargers,
  selectedParkId,
  onSelectPark,
  onToggleTripPark,
  selectedChargerId,
  start,
  tripParks,
  routePath,
  chargePlan,
  returnHome = false,
}: MapViewProps) {
  void selectedChargerId;

  const selectedPark = useMemo(
    () => parks.find((p) => p.id === selectedParkId) ?? null,
    [parks, selectedParkId],
  );

  const nearbyForPark = useMemo(() => {
    if (!selectedPark || chargers.length === 0) return [];
    return nearestSuperchargers(selectedPark, chargers, 3);
  }, [selectedPark, chargers]);

  const tripIds = useMemo(
    () => new Set(tripParks.map((p) => p.id)),
    [tripParks],
  );

  const plannedIds = useMemo(
    () => new Set(chargePlan?.stops.map((s) => s.id) ?? []),
    [chargePlan],
  );

  const hasTrip = Boolean(start) || tripParks.length > 0;
  const hasRoutePlan = Boolean(chargePlan && routePath && routePath.length > 1);

  const straightPath: [number, number][] | null = useMemo(() => {
    if (routePath && routePath.length > 1) return null;
    const pts: [number, number][] = [];
    if (start) pts.push([start.lat, start.lng]);
    tripParks.forEach((p) => pts.push([p.lat, p.lng]));
    return pts.length > 1 ? pts : null;
  }, [routePath, start, tripParks]);

  // When routing: show full network only if toggled; otherwise corridor + planned
  const backgroundChargers = useMemo(() => {
    if (!hasRoutePlan) return showChargers ? chargers : [];
    if (showChargers) {
      // Full network minus planned (planned drawn separately)
      return chargers.filter((c) => !plannedIds.has(c.id));
    }
    // Only other Superchargers near the route (not planned stops)
    return (chargePlan?.alongRoute ?? []).filter((c) => !plannedIds.has(c.id));
  }, [hasRoutePlan, showChargers, chargers, chargePlan, plannedIds]);

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-300/40 shadow-xl">
      <MapContainer
        center={[39.5, -98]}
        zoom={4}
        minZoom={3}
        maxZoom={18}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: '#dce6f0' }}
      >
        <Basemap />
        <ParkPane />
        <FitContinentalUS hasTrip={hasTrip} />
        {hasTrip && (
          <FitTrip path={routePath} start={start} tripParks={tripParks} />
        )}

        {routePath && routePath.length > 1 && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: '#0369a1',
              weight: 5,
              opacity: 0.9,
              lineJoin: 'round',
              pane: 'tripPane',
            }}
          />
        )}
        {!routePath && straightPath && (
          <Polyline
            positions={straightPath}
            pathOptions={{
              color: '#0284c7',
              weight: 4,
              opacity: 0.75,
              dashArray: '8 8',
              pane: 'tripPane',
            }}
          />
        )}

        {start && (
          <Marker position={[start.lat, start.lng]} icon={startIcon}>
            <Popup>
              <div className="min-w-[140px] text-slate-900">
                <p className="font-semibold text-sky-700">Start</p>
                <p className="text-xs text-slate-600">{start.label}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Background Superchargers (full network or along-route only) */}
        {backgroundChargers.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
          >
            {backgroundChargers.map((c) => (
              <Marker
                key={c.id}
                position={[c.lat, c.lng]}
                icon={
                  hasRoutePlan && !showChargers
                    ? alongRouteIcon
                    : superchargerIcon
                }
              >
                <Popup>
                  <div className="min-w-[160px] text-slate-900">
                    <p className="font-semibold text-red-700">⚡ {c.name}</p>
                    <p className="text-xs text-slate-600">
                      {[c.street, c.city, c.state].filter(Boolean).join(', ')}
                    </p>
                    <p className="mt-1 text-xs">
                      {c.stalls ? `${c.stalls} stalls` : 'Stalls n/a'}
                      {c.kw ? ` · ${c.kw} kW` : ''}
                    </p>
                    {hasRoutePlan && !showChargers && (
                      <p className="mt-1 text-[10px] text-amber-700">
                        Near your route (not a planned stop)
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}

        {/* Planned charge stops for this trip — always on top */}
        {chargePlan?.stops.map((s) => (
          <Marker
            key={`plan-${s.id}`}
            position={[s.lat, s.lng]}
            icon={chargeStopIcon(s.stopNumber)}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="min-w-[180px] text-slate-900">
                <p className="font-semibold text-amber-700">
                  Charge stop #{s.stopNumber}
                </p>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-slate-600">
                  {[s.street, s.city, s.state].filter(Boolean).join(', ')}
                </p>
                <p className="mt-1 text-xs">
                  {s.stalls ? `${s.stalls} stalls` : ''}
                  {s.kw ? ` · ${s.kw} kW` : ''}
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Drive ~{Math.round(s.legFromPreviousMi)} mi from previous · ~
                  {Math.round(s.alongMi)} mi into trip
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {showParks &&
          parks.map((p) => {
            const selected = p.id === selectedParkId;
            const onTrip = tripIds.has(p.id);
            const stopNum = onTrip
              ? tripParks.findIndex((t) => t.id === p.id) + 1
              : null;
            return (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={selected || onTrip ? 12 : 9}
                pane="parksPane"
                pathOptions={{
                  color: '#fff',
                  weight: selected ? 3 : onTrip ? 2.5 : 2,
                  fillColor: onTrip
                    ? '#38bdf8'
                    : selected
                      ? p.designation === 'National Monument'
                        ? '#c4b5fd'
                        : '#34d399'
                      : p.designation === 'National Monument'
                        ? '#8b5cf6'
                        : '#10b981',
                  fillOpacity: 0.95,
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e.originalEvent);
                    onSelectPark(p.id);
                    // Add to trip on map click (don't remove — use popup/button for that)
                    if (!onTrip) onToggleTripPark(p.id);
                  },
                }}
              >
                <Popup>
                  <div className="min-w-[200px] text-slate-900">
                    <p className="font-semibold text-emerald-800">
                      {stopNum != null ? `Stop #${stopNum} · ` : ''}
                      {p.name}{' '}
                      {p.designation === 'National Monument'
                        ? 'National Monument'
                        : 'National Park'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {p.state} · {siteShortTag(p)}
                    </p>
                    {p.note && (
                      <p className="mt-1 text-xs text-amber-700">{p.note}</p>
                    )}
                    <button
                      type="button"
                      className={`mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
                        onTrip
                          ? 'bg-slate-600 hover:bg-slate-700'
                          : 'bg-sky-600 hover:bg-sky-700'
                      }`}
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        onToggleTripPark(p.id);
                        onSelectPark(p.id);
                      }}
                    >
                      {onTrip ? 'Remove from trip' : 'Add to trip'}
                    </button>
                    {nearbyForPark.length > 0 && selected && (
                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Nearest Superchargers
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {nearbyForPark.map((s) => (
                            <li key={s.id}>
                              {s.name}{' '}
                              <span className="text-slate-500">
                                ({s.distanceMi.toFixed(0)} mi)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <a
                      href={parkNpsUrl(p)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-sky-700 underline"
                    >
                      nps.gov →
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-wrap gap-2">
        <LegendDot color="#10b981" label="Parks" />
        <LegendDot color="#8b5cf6" label="Monuments" />
        <LegendDot
          color="#38bdf8"
          label={returnHome ? 'Round-trip route' : 'Route'}
        />
        {hasRoutePlan && (
          <LegendDot color="#f59e0b" label="Planned charges" />
        )}
        <LegendDot
          color="#cc0000"
          label={
            hasRoutePlan && !showChargers
              ? 'Near route'
              : 'Superchargers'
          }
        />
      </div>

      {!hasTrip && (
        <div className="pointer-events-none absolute top-3 left-1/2 z-[1000] max-w-sm -translate-x-1/2 rounded-xl border border-white/15 bg-black/80 px-4 py-2 text-center text-xs text-slate-200 backdrop-blur">
          Click a park (green) or monument (purple) to add it. Set a starting
          city in the sidebar for full routing.
        </div>
      )}

      {hasRoutePlan && chargePlan && chargePlan.stops.length > 0 && (
        <div className="pointer-events-none absolute top-3 left-1/2 z-[1000] max-w-md -translate-x-1/2 rounded-xl border border-amber-500/30 bg-black/80 px-4 py-2 text-center text-xs text-amber-100 backdrop-blur">
          {chargePlan.stops.length} planned Supercharger stop
          {chargePlan.stops.length === 1 ? '' : 's'} along this route (amber
          ⚡ pins)
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
