import { useMemo, useState } from 'react';
import { getTemplateById } from '../data/tripTemplates';
import type { ParkSite } from '../data/parks';
import type { ChargePlan } from '../lib/chargeStops';
import {
  appleMapsDirectionsUrl,
  buildGpx,
  downloadTextFile,
  drivingWaypoints,
  googleMapsDirectionsUrl,
  openUrl,
} from '../lib/tripExport';
import { formatMiles } from '../lib/routing';
import {
  buildShareSummary,
  buildShareUrl,
  copyText,
  saveTripLocal,
  type SharedTrip,
} from '../lib/tripShare';
import type { StartLocation } from './TripPanel';

type Props = {
  start: StartLocation | null;
  tripParks: ParkSite[];
  tripParkIds: string[];
  vehicleId: string;
  vehicleName: string;
  chargePlan: ChargePlan | null;
  routePath: [number, number][] | null;
  totalMiles?: number | null;
  returnHome?: boolean;
  nightsByStopId?: Record<string, number>;
  travelMonth?: number;
  templateId?: string | null;
  onToast: (msg: string) => void;
};

export default function TripShareExport({
  start,
  tripParks,
  tripParkIds,
  vehicleId,
  vehicleName,
  chargePlan,
  routePath,
  totalMiles = null,
  returnHome = false,
  nightsByStopId,
  travelMonth,
  templateId = null,
  onToast,
}: Props) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const canExport = Boolean(start) || tripParks.length > 0;
  const canNavigate =
    drivingWaypoints(start, tripParks, returnHome).length >= 1;

  const shared: SharedTrip = useMemo(
    () => ({
      start,
      stopIds: tripParkIds,
      vehicleId,
      returnHome,
      nightsByStopId,
      travelMonth,
      templateId: templateId ?? undefined,
    }),
    [
      start,
      tripParkIds,
      vehicleId,
      returnHome,
      nightsByStopId,
      travelMonth,
      templateId,
    ],
  );

  // Prefer live address bar (App keeps it in sync); fall back to encode
  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : buildShareUrl(shared);

  const templateName = templateId
    ? getTemplateById(templateId)?.name ?? null
    : null;

  const summaryText = useMemo(
    () =>
      buildShareSummary({
        trip: shared,
        vehicleName,
        totalMiles,
        chargePlan,
        templateName,
      }),
    [shared, vehicleName, totalMiles, chargePlan, templateName],
  );

  const isShortTemplateLink =
    Boolean(templateId) &&
    shareUrl.includes(`t=${encodeURIComponent(templateId!)}`) &&
    !shareUrl.includes('stops=');

  const points = useMemo(
    () => drivingWaypoints(start, tripParks, returnHome),
    [start, tripParks, returnHome],
  );

  const googleUrl = useMemo(
    () => googleMapsDirectionsUrl(points),
    [points],
  );
  const appleUrl = useMemo(() => appleMapsDirectionsUrl(points), [points]);

  if (!canExport) return null;

  const onCopyLink = async () => {
    saveTripLocal(shared);
    const url = buildShareUrl(shared);
    // Keep address bar in sync if App hasn't flushed yet
    if (typeof window !== 'undefined' && url !== window.location.href) {
      const next = url.replace(window.location.origin, '');
      window.history.replaceState(null, '', next);
    }
    const ok = await copyText(url);
    setCopied(ok);
    onToast(
      ok
        ? isShortTemplateLink || url.includes('t=')
          ? 'Trip link copied (template short link when possible)'
          : 'Trip link copied — paste to save or share'
        : 'Could not copy link',
    );
    window.setTimeout(() => setCopied(false), 2000);
  };

  const onCopySummaryAndLink = async () => {
    saveTripLocal(shared);
    const url = buildShareUrl(shared);
    const blob = `${summaryText}\n\n${url}`;
    const ok = await copyText(blob);
    setCopiedSummary(ok);
    onToast(ok ? 'Summary + link copied' : 'Could not copy');
    window.setTimeout(() => setCopiedSummary(false), 2000);
  };

  const onSaveLocal = () => {
    saveTripLocal(shared);
    onToast('Trip saved in this browser');
  };

  const onGoogle = () => {
    if (!googleUrl) return;
    openUrl(googleUrl);
    onToast('Opening Google Maps directions…');
  };

  const onApple = () => {
    if (!appleUrl) return;
    openUrl(appleUrl);
    onToast('Opening Apple Maps…');
  };

  const onGpx = () => {
    const gpx = buildGpx({
      name: returnHome ? 'Model Y Road Trip (round trip)' : 'Model Y Road Trip',
      start,
      stops: tripParks,
      chargeStops: chargePlan?.stops ?? [],
      routePath,
      returnHome,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`roadtrip-${stamp}.gpx`, gpx);
    onToast('GPX downloaded (parks + planned Superchargers)');
  };

  const onNativeShare = async () => {
    saveTripLocal(shared);
    const url = buildShareUrl(shared);
    if (navigator.share) {
      try {
        await navigator.share({
          title: templateName
            ? `Tesla trip: ${templateName}`
            : 'My Tesla park road trip',
          text: summaryText,
          url,
        });
        return;
      } catch {
        /* user cancelled or unsupported */
      }
    }
    await onCopySummaryAndLink();
  };

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-sky-200">
          Save, share & export
        </h4>
        <span className="text-[10px] text-slate-500">{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {/* Trip snapshot for sharing */}
          <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-2.5 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">
              Ready to share
            </div>
            <ul className="mt-1 space-y-0.5 text-[11px] text-slate-300">
              {templateName && (
                <li>
                  Template: <span className="text-white">{templateName}</span>
                </li>
              )}
              {start && (
                <li>
                  From: <span className="text-white">{start.label}</span>
                </li>
              )}
              <li>
                {tripParks.length} stop{tripParks.length === 1 ? '' : 's'}
                {returnHome ? ' · round trip' : ''}
                {totalMiles && totalMiles > 0
                  ? ` · ~${formatMiles(totalMiles)}`
                  : ''}
              </li>
              {chargePlan && chargePlan.stops.length > 0 && (
                <li>
                  {chargePlan.stops.length} Supercharger
                  {chargePlan.stops.length === 1 ? '' : 's'} · ~
                  {chargePlan.totalChargeLabel} · ~
                  {`$${chargePlan.totalCostUsd.toFixed(2)}`} (
                  {chargePlan.totalEnergyKwh} kWh)
                </li>
              )}
              <li className="text-slate-500">{vehicleName}</li>
            </ul>
          </div>

          <p className="text-[10px] leading-relaxed text-slate-500">
            Copy a link to reopen this trip (templates use a short{' '}
            <code className="text-slate-400">?t=…</code> URL when unchanged).
            Tesla navigation in the car handles live Superchargers.
          </p>

          <div className="flex flex-wrap gap-1.5">
            <ActionBtn onClick={() => void onCopyLink()} primary>
              {copied ? 'Copied!' : 'Copy trip link'}
            </ActionBtn>
            <ActionBtn onClick={() => void onCopySummaryAndLink()}>
              {copiedSummary ? 'Copied!' : 'Copy summary + link'}
            </ActionBtn>
            <ActionBtn onClick={() => void onNativeShare()}>Share…</ActionBtn>
            <ActionBtn onClick={onSaveLocal}>Save on this device</ActionBtn>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <ActionBtn
              onClick={onGoogle}
              disabled={!canNavigate || !googleUrl}
              accent="emerald"
            >
              Google Maps
            </ActionBtn>
            <ActionBtn
              onClick={onApple}
              disabled={!canNavigate || !appleUrl}
              accent="emerald"
            >
              Apple Maps
            </ActionBtn>
            <ActionBtn onClick={onGpx} disabled={points.length === 0}>
              Download GPX
            </ActionBtn>
          </div>

          {points.length === 1 && !start && (
            <p className="text-[10px] text-amber-400/90">
              Add a start location for full turn-by-turn multi-stop directions.
            </p>
          )}

          <details className="text-[10px] text-slate-500">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
              Link &amp; summary preview
            </summary>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-black/30 p-2 font-mono text-[9px] text-slate-400">
              {summaryText}
              {'\n\n'}
              {shareUrl}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  primary,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  accent?: 'emerald';
}) {
  const cls = disabled
    ? 'bg-white/5 text-slate-600 cursor-not-allowed'
    : primary
      ? 'bg-sky-600 text-white hover:bg-sky-500'
      : accent === 'emerald'
        ? 'bg-emerald-700/80 text-emerald-50 hover:bg-emerald-600'
        : 'bg-white/10 text-slate-200 hover:bg-white/15';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${cls}`}
    >
      {children}
    </button>
  );
}
