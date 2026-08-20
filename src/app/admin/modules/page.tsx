import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export default async function ModulesPage() {
  const [modules, questionCounts] = await Promise.all([
    prisma.module.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.question.groupBy({
      by: ["moduleId", "section"],
      _count: { _all: true },
    }),
  ]);

  const countFor = (moduleId: string, section: string) =>
    questionCounts.find(
      (c) => c.moduleId === moduleId && c.section === section
    )?._count._all ?? 0;

  return (
    <AdminShell title="Modul" eyebrow="Pustaka soal & materi">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-eyebrow text-ink-secondary">{modules.length} modul</p>
        <Button href="/admin/modules/new">Tambah Modul</Button>
      </section>

      {modules.length > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          {modules.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center justify-between gap-4 px-6 py-5 ${
                i > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold">{m.title}</p>
                {m.description ? (
                  <p className="mt-0.5 truncate text-sm text-ink-secondary">
                    {m.description}
                  </p>
                ) : null}
                <p className="mt-0.5 text-sm tabular-nums text-ink-secondary">
                  Pretest {countFor(m.id, "PRETEST")} soal · Posttest{" "}
                  {countFor(m.id, "POSTTEST")} soal
                </p>
              </div>
              <Button
                href={`/admin/modules/${m.id}`}
                variant="secondary"
                className="shrink-0"
              >
                Lihat Detail
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface px-6 py-12 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          <p className="font-semibold">Belum ada modul</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Buat modul pertama lewat tombol Tambah Modul.
          </p>
        </div>
      )}
    </AdminShell>
  );
}
