import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { TextField, TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { createModule } from "./actions";

export default async function ModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <AdminShell title="Modul">
      <Card className="p-6">
        <p className="text-h2 font-semibold">Modul baru</p>
        <form action={createModule} className="mt-4 space-y-4">
          <TextField label="Judul" name="title" required minLength={3} />
          <TextArea label="Deskripsi (opsional)" name="description" />
          <Button type="submit">Buat Modul</Button>
        </form>
      </Card>

      {modules.length > 0 ? (
        <div className="space-y-3">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={`/admin/modules/${m.id}`}
              className="block rounded-[var(--radius-card)] border border-hairline bg-surface p-5 hover:bg-canvas"
            >
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-ink-secondary">
                {m._count.questions} soal
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">
          Belum ada modul. Buat modul pertama di atas.
        </p>
      )}
    </AdminShell>
  );
}
