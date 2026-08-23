import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  ProgressFunnel,
  ProgressFunnelLegend,
  emptyCounts,
  type StageCounts,
} from "@/components/admin/ProgressFunnel";
import { GrowthSection } from "@/components/admin/GrowthChart";
import { buildGrowth, growthSince } from "@/lib/growth";
import { activityPhase, PHASE_LABEL } from "@/lib/activity-phase";

const PHASE_CHIP: Record<string, string> = {
  SCHEDULED: "bg-canvas text-ink-secondary",
  REGISTRATION: "bg-accent-soft text-accent",
  PRETEST: "bg-accent-soft text-accent",
  MATERIAL: "bg-accent-soft text-accent",
  POSTTEST: "bg-success-soft text-success",
  CLOSED: "bg-canvas text-ink-secondary",
};

export default async function AdminDashboardPage() {
  const since = growthSince("week");
  const [
    moduleCount,
    activityCount,
    participantCount,
    allActivities,
    stageRows,
    growthActivities,
    growthParticipants,
  ] = await Promise.all([
    prisma.module.count(),
    prisma.activity.count(),
    prisma.participant.count(),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        module: { select: { title: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.participant.groupBy({
      by: ["activityId", "stage"],
      _count: { _all: true },
    }),
    prisma.activity.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.participant.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const now = new Date();
  const upcoming = allActivities.filter(
    (a) => activityPhase(a, now) !== "CLOSED"
  );

  const stageByActivity = new Map<string, StageCounts>();
  for (const r of stageRows) {
    const cur = stageByActivity.get(r.activityId) ?? emptyCounts();
    cur[r.stage] += r._count._all;
    stageByActivity.set(r.activityId, cur);
  }

  const stats = [
    {
      label: "Modul",
      value: moduleCount,
      caption: "Pustaka soal & Materi",
      href: "/admin/modules",
    },
    {
      label: "Kegiatan",
      value: activityCount,
      caption: `${upcoming.length} Mendatang`,
      href: "/admin/activities",
    },
    {
      label: "Peserta",
      value: participantCount,
      caption: "Total Terdaftar",
      href: "/admin/activities",
    },
  ];

  return (
    <AdminShell title="Dashboard" eyebrow="Ringkasan">
      <p className="max-w-2xl text-[var(--text-body)] leading-relaxed text-ink-secondary">
        {activityCount === 0
          ? "Belum ada kegiatan. Buat modul, lalu buka kegiatan dan bagikan link pendaftaran ke peserta."
          : `${upcoming.length} kegiatan mendatang dan ${participantCount} peserta terdaftar secara total.`}
      </p>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)] transition-colors hover:border-accent/30 hover:bg-accent-soft/40"
          >
            <p className="text-[var(--text-h1)] font-bold tabular-nums text-accent">
              {s.value}
            </p>
            <p className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-ink">{s.label}</span>
              <span className="text-[13px] text-ink-secondary">{s.caption}</span>
            </p>
          </Link>
        ))}
      </section>

      <GrowthSection
        initialData={{
          ...buildGrowth("week", growthActivities, growthParticipants),
          compare: false,
        }}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-h2 font-semibold">Kegiatan mendatang</h2>
            <ProgressFunnelLegend />
          </div>
          <Link
            href="/admin/activities"
            className="text-sm font-medium text-accent hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface px-6 py-10 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            <p className="font-semibold">Belum ada kegiatan mendatang</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Buka kegiatan dari daftar, lalu bagikan link pendaftaran ke
              peserta.
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            {upcoming.map((a, i) => (
              <Link
                key={a.id}
                href={`/admin/activities/${a.id}`}
                className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-5 transition-colors hover:bg-canvas ${
                  i > 0 ? "border-t border-hairline" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.title}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {a.module.title} · {a._count.participants} peserta
                  </p>
                  <ProgressFunnel
                    counts={stageByActivity.get(a.id) ?? emptyCounts()}
                  />
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${PHASE_CHIP[activityPhase(a, now)]}`}
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                  {PHASE_LABEL[activityPhase(a, now)]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
