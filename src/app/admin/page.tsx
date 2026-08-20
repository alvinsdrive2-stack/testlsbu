import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";

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
    { label: "Modul", value: moduleCount, href: "/admin/modules" },
    { label: "Kegiatan", value: activityCount, href: "/admin/activities" },
    { label: "Peserta", value: participantCount, href: "/admin/activities" },
  ];

  const stageCounts = { REGISTERED: 0, PRETEST_DONE: 0, POSTTEST_PASSED: 0 };
  for (const r of stageRows) stageCounts[r.stage] += r._count._all;
  const pipeline = [
    { label: "Terdaftar", count: stageCounts.REGISTERED },
    { label: "Pretest selesai", count: stageCounts.PRETEST_DONE },
    { label: "Lulus posttest", count: stageCounts.POSTTEST_PASSED },
  ];

  return (
    <AdminShell title="Dashboard" eyebrow="Ringkasan">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)] transition-colors hover:bg-canvas"
          >
            <p className="text-[var(--text-h1)] font-bold tabular-nums text-accent">
              {s.value}
            </p>
            <p className="label-eyebrow mt-1 text-ink-secondary">{s.label}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-h2 font-semibold">Progres peserta</h2>
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          {pipeline.map((p, i) => (
            <div
              key={p.label}
              className={`flex items-center justify-between gap-4 px-6 py-4 ${
                i > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${
                    p.count > 0
                      ? "bg-success"
                      : "border border-hairline-strong bg-surface"
                  }`}
                />
                <span className="text-sm font-medium">{p.label}</span>
              </span>
              <span className="text-sm tabular-nums text-ink-secondary">
                {p.count} peserta
              </span>
            </div>
          ))}
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
          <p className="text-sm leading-relaxed text-ink-secondary">
            Belum ada kegiatan berjalan. Buat kegiatan baru, buka pretest, lalu
            bagikan link pendaftaran ke peserta.
          </p>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            {activities.map((a, i) => (
              <Link
                key={a.id}
                href={`/admin/activities/${a.id}`}
                className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6 py-5 transition-colors hover:bg-canvas ${
                  i > 0 ? "border-t border-hairline" : ""
                }`}
              >
                <span className="font-semibold">{a.title}</span>
                <span className="text-sm text-ink-secondary">
                  {a.module.title} ·{" "}
                  <span className="font-medium text-accent">
                    {STATUS_LABEL[a.status]}
                  </span>{" "}
                  · {a._count.participants} peserta
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <p className="max-w-xl text-[var(--text-body)] leading-relaxed text-ink-secondary">
          Kelola modul soal dan materi, buka kegiatan bimtek, lalu pantau
          progres peserta dari pretest sampai posttest.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/admin/modules">Kelola Modul</Button>
          <Button variant="secondary" href="/admin/activities">
            Lihat Kegiatan
          </Button>
        </div>
      </section>
    </AdminShell>
  );
}
