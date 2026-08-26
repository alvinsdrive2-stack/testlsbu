"use client";

import { useRef, useState } from "react";
import type { GrowthBucket, GrowthData, GrowthRange } from "@/lib/growth";

const RANGES: { key: GrowthRange; label: string }[] = [
  { key: "week", label: "Minggu" },
  { key: "month", label: "Bulan" },
  { key: "year", label: "Tahun" },
];

function DeltaChip({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) {
    return current > 0 ? (
      <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
        baru
      </span>
    ) : null;
  }
  const pct = Math.round(((current - prev) / prev) * 100);
  if (pct === 0)
    return (
      <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-secondary">
        0%
      </span>
    );
  const up = pct > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        up ? "bg-success-soft text-success" : "bg-flag/10 text-flag"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

type MetricKey = "activities" | "participants";
type PrevKey = "prevActivities" | "prevParticipants";

function MetricCard({
  title,
  stroke,
  current,
  prev,
  buckets,
  valueKey,
  prevKey,
  compare,
  range,
  loading,
}: {
  title: string;
  stroke: string;
  current: number;
  prev: number;
  buckets: GrowthBucket[];
  valueKey: MetricKey;
  prevKey: PrevKey;
  compare: boolean;
  range: GrowthRange;
  loading: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(
    1,
    ...buckets.map((b) => Math.max(b[valueKey], compare ? b[prevKey] : 0))
  );
  const showLabel = (i: number) =>
    range !== "month" || i % 5 === 0 || i === buckets.length - 1;

  const W = 100;
  const H = 40;
  const x = (i: number) =>
    buckets.length > 1 ? (i / (buckets.length - 1)) * W : W / 2;
  const y = (v: number) => H - 2 - (v / max) * (H - 4);
  const line = (key: MetricKey | PrevKey) =>
    buckets
      .map((b, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(b[key]).toFixed(2)}`)
      .join(" ");
  const area = buckets.length
    ? `${line(valueKey)} L${x(buckets.length - 1).toFixed(2)},${H} L${x(0).toFixed(2)},${H} Z`
    : "";
  const lastX = x(buckets.length - 1);
  const lastY = y(buckets[buckets.length - 1][valueKey]);
  const active = hover !== null ? buckets[hover] : null;
  const hoverLeftPct = hover !== null ? (x(hover) / W) * 100 : 0;

  return (
    <div className="relative rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
      <div
        className={loading ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {compare ? <DeltaChip current={current} prev={prev} /> : null}
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{current}</p>
        <div className="relative mt-4">
          <svg
            key={`${range}-${compare}`}
            className="h-36 w-full"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${title}: ${current} periode ini${compare ? `, ${prev} periode sebelumnya` : ""}`}
          >
            <line
              x1="0"
              y1={H - 2}
              x2={W}
              y2={H - 2}
              stroke="var(--color-hairline)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <path d={area} fill={stroke} className="chart-fade" opacity="0.07" />
            {compare ? (
              <path
                d={line(prevKey)}
                fill="none"
                stroke={stroke}
                strokeWidth="1.5"
                pathLength={1}
                strokeDasharray="0.05 0.04"
                opacity="0.45"
                vectorEffect="non-scaling-stroke"
                className="chart-fade"
              />
            ) : null}
            <path
              d={line(valueKey)}
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              pathLength={1}
              vectorEffect="non-scaling-stroke"
              className="chart-line-draw"
            />
            <path
              d={`M${(lastX - 2).toFixed(2)},${lastY.toFixed(2)} h4 M${lastX.toFixed(2)},${(lastY - 2).toFixed(2)} v4`}
              stroke={stroke}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="chart-fade"
            />
            {hover !== null ? (
              <path
                d={`M${x(hover).toFixed(2)},0 V${H}`}
                stroke="var(--color-hairline-strong)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </svg>

          {active ? (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-hairline bg-surface px-2.5 py-1.5 text-xs shadow-[0_2px_8px_rgba(15,20,25,0.12)]"
              style={{
                left: `${Math.min(88, Math.max(12, hoverLeftPct))}%`,
                top: `${Math.max(4, (y(active[valueKey]) / H) * 100 - 3)}%`,
              }}
            >
              <p className="font-semibold text-ink">{active.label}</p>
              <p className="mt-0.5 flex items-center gap-1.5 tabular-nums text-ink-secondary">
                <span aria-hidden className="size-1.5 rounded-full" style={{ background: stroke }} />
                Periode ini: {active[valueKey]}
              </p>
              {compare ? (
                <p className="mt-0.5 flex items-center gap-1.5 tabular-nums text-ink-secondary">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full opacity-45"
                    style={{ background: stroke }}
                  />
                  Sebelumnya: {active[prevKey]}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="absolute inset-0 flex">
            {buckets.map((_, i) => (
              <div
                key={i}
                className="h-full flex-1 cursor-default"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </div>
        </div>
        <div className="mt-1.5 flex gap-1">
          {buckets.map((b, i) => (
            <span
              key={i}
              className={`flex-1 truncate text-center text-[10px] tabular-nums text-ink-secondary ${
                showLabel(i) ? "" : "invisible"
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="size-5 animate-spin rounded-full border-2 border-hairline-strong border-t-accent" />
        </div>
      ) : null}
    </div>
  );
}

export function GrowthSection({ initialData }: { initialData: GrowthData }) {
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState(initialData.range);
  const [compare, setCompare] = useState(initialData.compare);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const reqId = useRef(0);

  async function select(r: GrowthRange, c: boolean) {
    if (loading || (r === range && c === compare)) return;
    const id = ++reqId.current;
    setRange(r);
    setCompare(c);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/growth?range=${r}`);
      if (!res.ok) {
        if (reqId.current === id) setFetchError(true);
        return;
      }
      const fresh = (await res.json()) as GrowthData;
      if (reqId.current === id) {
        setData(fresh);
        setFetchError(false);
      }
    } catch {
      // biarkan data lama, kasih tahu user kalau gagal
      if (reqId.current === id) setFetchError(true);
    } finally {
      if (reqId.current === id) setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h2 font-semibold">Pertumbuhan</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-hairline-strong bg-surface p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => select(r.key, compare)}
                className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  range === r.key
                    ? "bg-accent text-surface"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => select(range, !compare)}
            className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              compare
                ? "border-accent bg-accent-soft text-accent"
                : "border-hairline-strong bg-surface text-ink-secondary hover:text-ink"
            }`}
          >
            Bandingkan periode sebelumnya
          </button>
        </div>
      </div>

      {fetchError ? (
        <p role="alert" className="rounded-md border border-flag/30 bg-flag/10 px-3 py-2 text-sm font-medium text-flag">
          Gagal memuat data grafik. Coba ganti rentang lagi.
        </p>
      ) : null}

      {compare ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
            <span aria-hidden className="w-4 border-t-2 border-dashed border-accent opacity-60" />
            Periode sebelumnya
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
            <span aria-hidden className="w-4 border-t-2 border-accent" />
            Periode ini
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          title="Kegiatan baru"
          stroke="#002b66"
          current={data.totals.activities}
          prev={data.totals.prevActivities}
          buckets={data.buckets}
          valueKey="activities"
          prevKey="prevActivities"
          compare={compare}
          range={range}
          loading={loading}
        />
        <MetricCard
          title="Peserta baru"
          stroke="#1a7f37"
          current={data.totals.participants}
          prev={data.totals.prevParticipants}
          buckets={data.buckets}
          valueKey="participants"
          prevKey="prevParticipants"
          compare={compare}
          range={range}
          loading={loading}
        />
      </div>
    </section>
  );
}
