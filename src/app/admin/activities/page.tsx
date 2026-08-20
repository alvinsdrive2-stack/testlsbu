import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { createActivity } from "./actions";

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
          <form action={createActivity} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="moduleId"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-secondary"
              >
                Modul
              </label>
              <select
                id="moduleId"
                name="moduleId"
                required
                className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <TextField label="Judul kegiatan" name="title" required minLength={3} />
            <Button type="submit">Buat Kegiatan</Button>
          </form>
        )}
      </section>

      {activities.length > 0 ? (
        <section>
          <p className="label-eyebrow mb-3 text-ink-secondary">
            {activities.length} kegiatan
          </p>
          <div className="divide-y divide-hairline border-y border-hairline">
            {activities.map((a) => (
              <Link
                key={a.id}
                href={`/admin/activities/${a.id}`}
                className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-5"
              >
                <span className="font-semibold group-hover:text-accent">
                  {a.title}
                </span>
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
