import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

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
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-eyebrow text-ink-secondary">
          {activities.length} kegiatan
        </p>
        <Button href="/admin/activities/new">Tambah Kegiatan</Button>
      </section>

      {activities.length > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
          {activities.map((a, i) => (
            <div
              key={a.id}
              className={`flex items-center justify-between gap-4 px-6 py-5 ${
                i > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold">{a.title}</p>
                <p className="mt-0.5 text-sm text-ink-secondary">
                  {a.module.title} ·{" "}
                  <span
                    className={
                      a.status === "CLOSED" ? "" : "font-medium text-accent"
                    }
                  >
                    {STATUS_LABEL[a.status]}
                  </span>{" "}
                  · {a._count.participants} peserta
                </p>
              </div>
              <Button
                href={`/admin/activities/${a.id}`}
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
          <p className="font-semibold">Belum ada kegiatan</p>
          <p className="mt-1 text-sm text-ink-secondary">
            {modules.length === 0
              ? "Buat modul dulu di menu Modul, lalu tambah kegiatan."
              : "Buat kegiatan pertama lewat tombol Tambah Kegiatan."}
          </p>
        </div>
      )}
    </AdminShell>
  );
}
