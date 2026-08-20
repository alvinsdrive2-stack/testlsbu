import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { CreateActivityForm } from "./CreateActivityForm";

const STATUS_LABEL: Record<string, string> = {
  PRETEST_OPEN: "Pretest dibuka",
  POSTTEST_OPEN: "Posttest dibuka",
  CLOSED: "Ditutup",
};

export default async function ActivitiesPage() {
  const [modules, activities] = await Promise.all([
    prisma.module.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        module: { select: { title: true } },
        _count: { select: { participants: true } },
      },
    }),
  ]);

  return (
    <AdminShell title="Kegiatan" eyebrow="Bimtek & pelatihan">
      <section className="border border-hairline bg-surface p-6">
        <p className="text-h2 font-semibold">Kegiatan baru</p>
        {modules.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Buat modul dulu di menu Modul.
          </p>
        ) : (
          <CreateActivityForm modules={modules} />
        )}
      </section>

      {activities.length > 0 ? (
        <section>
          <p className="label-eyebrow mb-3 text-ink-secondary">
            {activities.length} kegiatan
          </p>
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
                  <span
                    className={
                      a.status === "CLOSED" ? "" : "font-medium text-accent"
                    }
                  >
                    {STATUS_LABEL[a.status]}
                  </span>{" "}
                  · {a._count.participants} peserta
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-sm text-ink-secondary">Belum ada kegiatan.</p>
      )}
    </AdminShell>
  );
}
