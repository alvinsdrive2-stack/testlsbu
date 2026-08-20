import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export default async function ModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const [modules, questionCounts] = await Promise.all([
    prisma.module.findMany({
      where: q ? { title: { contains: q } } : {},
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { materials: true } } },
    }),
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
        <div className="flex flex-wrap items-center gap-3">
          <form method="get">
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari modul"
              aria-label="Cari modul"
              className="w-56 rounded-md border border-hairline-strong bg-surface px-3 py-2.5 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </form>
          <Button href="/admin/modules/new">Tambah Modul</Button>
        </div>
      </section>

      {modules.length > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          {modules.map((m, i) => {
            const pretest = countFor(m.id, "PRETEST");
            const posttest = countFor(m.id, "POSTTEST");
            return (
              <div
                key={m.id}
                className={`flex items-center justify-between gap-4 px-6 py-5 ${
                  i > 0 ? "border-t border-hairline" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.title}</p>
                  {m.description ? (
                    <p className="mt-0.5 truncate text-sm text-ink-secondary">
                      {m.description}
                    </p>
                  ) : null}
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-ink-secondary">
                    <span>Pretest {pretest}</span>
                    <span aria-hidden className="text-hairline-strong">·</span>
                    <span>Posttest {posttest}</span>
                    <span aria-hidden className="text-hairline-strong">·</span>
                    <span>{m._count.materials} materi</span>
                  </p>
                  {pretest + posttest === 0 ? (
                    <p className="mt-1 text-sm font-medium text-flag">
                      Belum ada soal
                    </p>
                  ) : null}
                </div>
                <Button
                  href={`/admin/modules/${m.id}`}
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
          <p className="font-semibold">Tidak ada modul yang cocok</p>
          <p className="mt-1 text-sm text-ink-secondary">
            Tidak ditemukan modul untuk pencarian &ldquo;{q}&rdquo;.{" "}
            <Link href="/admin/modules" className="font-medium text-accent hover:underline">
              Reset pencarian
            </Link>
          </p>
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
