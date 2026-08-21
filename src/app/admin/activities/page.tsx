import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { activityPhase, PHASE_LABEL } from "@/lib/activity-phase";
import { AddActivityFab } from "./AddActivityFab";

const PHASE_CHIP: Record<string, string> = {
  SCHEDULED: "bg-canvas text-ink-secondary",
  REGISTRATION: "bg-accent-soft text-accent",
  PRETEST: "bg-accent-soft text-accent",
  MATERIAL: "bg-accent-soft text-accent",
  POSTTEST: "bg-success-soft text-success",
  CLOSED: "bg-canvas text-ink-secondary",
};

type StageCounts = {
  REGISTERED: number;
  PRETEST_DONE: number;
  POSTTEST_PASSED: number;
};

const emptyCounts = (): StageCounts => ({
  REGISTERED: 0,
  PRETEST_DONE: 0,
  POSTTEST_PASSED: 0,
});

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const [moduleCount, activities, stageRows, modules] = await Promise.all([
    prisma.module.count(),
    prisma.activity.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q } },
              { module: { title: { contains: q } } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      include: {
        module: { select: { title: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.participant.groupBy({
      by: ["activityId", "stage"],
      _count: { _all: true },
    }),
    prisma.module.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  const stageByActivity = new Map<string, StageCounts>();
  for (const r of stageRows) {
    const cur = stageByActivity.get(r.activityId) ?? emptyCounts();
    cur[r.stage] += r._count._all;
    stageByActivity.set(r.activityId, cur);
  }

  return (
    <AdminShell title="Kegiatan" eyebrow="Bimtek & pelatihan">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-eyebrow text-ink-secondary">
          {activities.length} kegiatan
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <form method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari kegiatan"
              aria-label="Cari kegiatan"
              className="w-56 rounded-md border border-hairline-strong bg-surface px-3 py-2.5 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </form>
        </div>
      </section>

      {activities.length > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          {activities.map((a, i) => {
            const counts = stageByActivity.get(a.id) ?? emptyCounts();
            const total = counts.REGISTERED + counts.PRETEST_DONE + counts.POSTTEST_PASSED;
            const passedPct = total ? Math.round((counts.POSTTEST_PASSED / total) * 100) : 0;
            const phase = activityPhase(a, new Date());
            return (
              <div
                key={a.id}
                className={`flex items-center justify-between gap-4 px-6 py-5 ${
                  i > 0 ? "border-t border-hairline" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-secondary">
                    <span>{a.module.title}</span>
                    <span aria-hidden className="text-hairline-strong">·</span>
                    <span className="tabular-nums">{a._count.participants} peserta</span>
                  </div>
                  {total > 0 ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-canvas">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${passedPct}%` }}
                        />
                      </div>
                      <span className="text-[13px] tabular-nums text-ink-secondary">
                        {counts.POSTTEST_PASSED} lulus posttest
                      </span>
                    </div>
                  ) : null}
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${PHASE_CHIP[phase]}`}
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                  {PHASE_LABEL[phase]}
                </span>
                <Button
                  href={`/admin/activities/${a.id}`}
                  variant="secondary"
                  className="shrink-0"
                >
                  Lihat Detail
                </Button>
              </div>
            );
          })}
        </div>
      ) : q ? (
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface px-6 py-12 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          <p className="font-semibold">Tidak ada kegiatan yang cocok</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Tidak ditemukan kegiatan untuk pencarian &ldquo;{q}&rdquo;.{" "}
            <Link href="/admin/activities" className="font-medium text-accent hover:underline">
              Reset pencarian
            </Link>
          </p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface px-6 py-12 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          <p className="font-semibold">Belum ada kegiatan</p>
          <p className="mt-1 text-sm text-ink-secondary">
            {moduleCount === 0
              ? "Buat modul dulu di menu Modul, lalu tambah kegiatan."
              : "Buat kegiatan pertama lewat tombol + di kanan bawah."}
          </p>
        </div>
      )}

      {modules.length > 0 ? <AddActivityFab modules={modules} /> : null}
    </AdminShell>
  );
}
