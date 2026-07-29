import {
  formatRatePerKwh,
  NATIONAL_SC_RATE,
  RATE_AS_OF_NOTE,
} from '../data/superchargerRates';
import type { ModelYConfig, RangeSettings } from '../data/vehicle';
import { summarizeRange } from '../data/vehicle';

type Props = {
  vehicle: ModelYConfig;
  settings: RangeSettings;
  onChange: (next: RangeSettings) => void;
  /** null = auto state rates */
  scRatePerKwh: number | null;
  onScRatePerKwh: (rate: number | null) => void;
};

export default function RangeSettingsPanel({
  vehicle,
  settings,
  onChange,
  scRatePerKwh,
  onScRatePerKwh,
}: Props) {
  const summary = summarizeRange(vehicle, settings);
  const displayRate = scRatePerKwh ?? NATIONAL_SC_RATE.mid;
  const autoRate = scRatePerKwh == null;

  const set = <K extends keyof RangeSettings>(key: K, value: RangeSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Range model
      </h2>
      <p className="text-[10px] leading-relaxed text-slate-500">
        Tune assumptions for Supercharger planning. Values are estimates—not
        Tesla navigation.
      </p>

      <SliderRow
        label="Start SOC"
        value={settings.startSocPct}
        min={20}
        max={100}
        step={5}
        suffix="%"
        onChange={(v) => set('startSocPct', v)}
      />
      <SliderRow
        label="Arrival buffer"
        value={settings.arrivalBufferPct}
        min={5}
        max={30}
        step={1}
        suffix="%"
        onChange={(v) => set('arrivalBufferPct', v)}
      />
      <SliderRow
        label="Highway speed"
        value={settings.highwayMph}
        min={55}
        max={80}
        step={1}
        suffix=" mph"
        onChange={(v) => set('highwayMph', v)}
      />
      <SliderRow
        label="Charge interval"
        value={Math.round(settings.chargeIntervalFactor * 100)}
        min={55}
        max={90}
        step={5}
        suffix="% of hop"
        onChange={(v) => set('chargeIntervalFactor', v / 100)}
      />

      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-black/30 px-3 py-2 text-sm text-slate-200">
        <span>
          <span className="font-medium">Cold weather</span>
          <span className="mt-0.5 block text-[10px] text-slate-500">
            ~22% range derate (heat + winter tires)
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={settings.coldWeather}
          onClick={() => set('coldWeather', !settings.coldWeather)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            settings.coldWeather ? 'bg-sky-500' : 'bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
              settings.coldWeather ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </label>

      <div className="grid grid-cols-2 gap-1.5 text-center sm:grid-cols-4">
        <MiniStat label="Full pack" value={`${summary.fullPackMi} mi`} />
        <MiniStat label="1st leg" value={`${summary.firstLegMi} mi`} />
        <MiniStat label="After SC" value={`${summary.hopMi} mi`} />
        <MiniStat label="Stop every" value={`~${summary.chargeEveryMi}`} />
      </div>

      <div className="border-t border-white/10 pt-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Supercharger rate ($/kWh)
        </h2>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
          {RATE_AS_OF_NOTE}
        </p>
        <label className="mt-2 flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-black/30 px-3 py-2 text-sm text-slate-200">
          <span>
            <span className="font-medium">Auto by stop state</span>
            <span className="mt-0.5 block text-[10px] text-slate-500">
              Uses state planning midpoints (CA higher, TX/Midwest lower)
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={autoRate}
            onClick={() =>
              onScRatePerKwh(autoRate ? NATIONAL_SC_RATE.mid : null)
            }
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              autoRate ? 'bg-sky-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition ${
                autoRate ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </label>
        <SliderRow
          label={autoRate ? 'Manual override (off)' : 'Your rate'}
          value={Math.round(displayRate * 100)}
          min={15}
          max={70}
          step={1}
          suffix="¢/kWh"
          onChange={(v) => onScRatePerKwh(v / 100)}
        />
        <p className="text-[10px] text-slate-500">
          Active planning rate:{' '}
          <span className="font-semibold text-slate-300">
            {autoRate
              ? `auto (national mid ${formatRatePerKwh(NATIONAL_SC_RATE.mid)})`
              : formatRatePerKwh(displayRate)}
          </span>
          . Band typically {formatRatePerKwh(NATIONAL_SC_RATE.low)}–
          {formatRatePerKwh(NATIONAL_SC_RATE.high)}.
        </p>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums text-slate-200">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-500"
      />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 px-1.5 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-xs font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}
