import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { CreateModuleForm } from "./CreateModuleForm";

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
      <section className="border border-hairline bg-surface p-6">
        <p className="text-h2 font-semibold">Modul baru</p>
        <CreateModuleForm />
      </section>

      {modules.length > 0 ? (
        <section>
          <p className="label-eyebrow mb-3 text-ink-secondary">
            {modules.length} modul
          </p>
          <div className="divide-y divide-hairline border-y border-hairline">
            {modules.map((m) => (
              <Link
                key={m.id}
                href={`/admin/modules/${m.id}`}
                className="group flex items-baseline justify-between gap-4 py-5"
              >
                <span className="font-semibold group-hover:text-accent">
                  {m.title}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-ink-secondary">
                  Pretest {countFor(m.id, "PRETEST")} · Posttest{" "}
                  {countFor(m.id, "POSTTEST")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-ink-secondary">
          Belum ada modul. Buat modul pertama di atas.
        </p>
      )}
    </AdminShell>
  );
}
