export type StageCounts = {
  REGISTERED: number;
  PRETEST_DONE: number;
  POSTTEST_PASSED: number;
};

export const emptyCounts = (): StageCounts => ({
  REGISTERED: 0,
  PRETEST_DONE: 0,
  POSTTEST_PASSED: 0,
});

export const FUNNEL_SEGMENTS = [
  { key: "REGISTERED", bar: "bg-accent", label: "Terdaftar" },
  { key: "PRETEST_DONE", bar: "bg-warning", label: "Pretest selesai" },
  { key: "POSTTEST_PASSED", bar: "bg-success", label: "Lulus posttest" },
] as const;

export function ProgressFunnel({ counts }: { counts: StageCounts }) {
  const total =
    counts.REGISTERED + counts.PRETEST_DONE + counts.POSTTEST_PASSED;
  if (total === 0) return null;
  const pct = (c: number) => Math.round((c / total) * 100);
  const segments = FUNNEL_SEGMENTS.map((s) => ({
    ...s,
    n: counts[s.key],
  }));
  return (
    <div className="mt-2 flex items-center gap-3">
      <div
        className="flex h-1.5 w-32 overflow-hidden rounded-full bg-canvas"
        role="img"
        aria-label={segments.map((s) => `${s.n} ${s.label}`).join(", ")}
      >
        {segments.map(
          (s) =>
            s.n > 0 && (
              <div key={s.label} className={s.bar} style={{ width: `${pct(s.n)}%` }} />
            )
        )}
      </div>
      <span className="text-[13px] tabular-nums text-ink-secondary">
        {total} peserta · {counts.POSTTEST_PASSED} lulus posttest
      </span>
    </div>
  );
}

export function ProgressFunnelLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {FUNNEL_SEGMENTS.map((s) => (
        <span
          key={s.key}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary"
        >
          <span aria-hidden className={`size-2 rounded-full ${s.bar}`} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
