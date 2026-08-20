import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
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
    <AdminShell title="Kegiatan">
      <Card className="p-6">
        <p className="text-h2 font-semibold">Kegiatan baru</p>
        {modules.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Buat modul dulu di menu Modul.
          </p>
        ) : (
          <form action={createActivity} className="mt-4 space-y-4">
            <div>
              <label htmlFor="moduleId" className="mb-1 block text-sm font-medium">
                Modul
              </label>
              <select
                id="moduleId"
                name="moduleId"
                required
                className="w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-accent"
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
      </Card>

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((a) => (
            <Link
              key={a.id}
              href={`/admin/activities/${a.id}`}
              className="block rounded-[var(--radius-card)] border border-hairline bg-surface p-5 hover:bg-canvas"
            >
              <p className="font-semibold">{a.title}</p>
              <p className="text-sm text-ink-secondary">
                {a.module.title} · {STATUS_LABEL[a.status]} ·{" "}
                {a._count.participants} peserta
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">Belum ada kegiatan.</p>
      )}
    </AdminShell>
  );
}
