import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";

const STATUS_CHIP: Record<string, string> = {
  PRETEST_OPEN: "bg-accent-soft text-accent",
  POSTTEST_OPEN: "bg-success-soft text-success",
  CLOSED: "bg-canvas text-ink-secondary",
};

const STATUS_LABEL: Record<string, string> = {
  PRETEST_OPEN: "Pretest dibuka",
  POSTTEST_OPEN: "Posttest dibuka",
  CLOSED: "Ditutup",
};

export default async function AdminDashboardPage() {
  const [moduleCount, activityCount, participantCount, activities, stageRows] =
    await Promise.all([
      prisma.module.count(),
      prisma.activity.count(),
      prisma.participant.count(),
      prisma.activity.findMany({
        where: { status: { not: "CLOSED" } },
        orderBy: { createdAt: "desc" },
        include: {
          module: { select: { title: true } },
          _count: { select: { participants: true } },
        },
      }),
      prisma.participant.groupBy({
        by: ["stage"],
        _count: { _all: true },
      }),
    ]);

  const stats = [
    {
      label: "Modul",
      value: moduleCount,
      caption: "pustaka soal & materi",
      href: "/admin/modules",
    },
    {
      label: "Kegiatan",
      value: activityCount,
      caption: `${activities.length} berjalan`,
      href: "/admin/activities",
    },
    {
      label: "Peserta",
      value: participantCount,
      caption: "total terdaftar",
      href: "/admin/activities",
    },
  ];

  const stageCounts = { REGISTERED: 0, PRETEST_DONE: 0, POSTTEST_PASSED: 0 };
  for (const r of stageRows) stageCounts[r.stage] += r._count._all;
  const totalParticipants = Object.values(stageCounts).reduce((a, b) => a + b, 0);

  const funnel = [
    {
      label: "Terdaftar",
      count: stageCounts.REGISTERED,
      bar: "bg-accent-soft",
      dot: stageCounts.REGISTERED > 0,
    },
    {
      label: "Pretest selesai",
      count: stageCounts.PRETEST_DONE,
      bar: "bg-accent/50",
      dot: stageCounts.PRETEST_DONE > 0,
    },
    {
      label: "Lulus posttest",
      count: stageCounts.POSTTEST_PASSED,
      bar: "bg-success",
      dot: stageCounts.POSTTEST_PASSED > 0,
    },
  ];
  const pct = (c: number) =>
    totalParticipants ? Math.round((c / totalParticipants) * 100) : 0;

  return (
    <AdminShell title="Dashboard" eyebrow="Ringkasan">
      <p className="max-w-2xl text-[var(--text-body)] leading-relaxed text-ink-secondary">
        {activityCount === 0
          ? "Belum ada kegiatan. Buat modul, lalu buka kegiatan dan bagikan link pendaftaran ke peserta."
          : `${activities.length} kegiatan berjalan dan ${participantCount} peserta terdaftar secara total.`}
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

      <section className="space-y-4">
        <h2 className="text-h2 font-semibold">Progres peserta</h2>
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          {totalParticipants > 0 ? (
            <div className="px-6 pt-5">
              <div
                className="flex h-2 w-full overflow-hidden rounded-full bg-canvas"
                role="img"
                aria-label="Funnel progres peserta"
              >
                {funnel.map((f) => (
                  <div
                    key={f.label}
                    className={f.bar}
                    style={{ width: `${pct(f.count)}%` }}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 divide-y divide-hairline">
            {funnel.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${
                      f.dot
                        ? f.bar.split(" ")[0]
                        : "border border-hairline-strong bg-surface"
                    }`}
                  />
                  <span className="text-sm font-medium">{f.label}</span>
                </span>
                <span className="text-sm tabular-nums text-ink-secondary">
                  {f.count} peserta
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h2 font-semibold">Kegiatan berjalan</h2>
          <Link
            href="/admin/activities"
            className="text-sm font-medium text-accent hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        {activities.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface px-6 py-10 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            <p className="font-semibold">Belum ada kegiatan berjalan</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Buka kegiatan dari daftar, lalu bagikan link pendaftaran ke
              peserta.
            </p>
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            {activities.map((a, i) => (
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
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CHIP[a.status]}`}
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                  {STATUS_LABEL[a.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
