import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { CreateActivityForm } from "../CreateActivityForm";

export default async function NewActivityPage() {
  const modules = await prisma.module.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <AdminShell title="Kegiatan Baru" eyebrow="Bimtek & pelatihan">
      <Link
        href="/admin/activities"
        className="text-sm font-medium text-accent hover:underline"
      >
        ← Kembali ke daftar kegiatan
      </Link>
      <section className="max-w-xl rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
        {modules.length === 0 ? (
          <div>
            <p className="font-semibold">Belum ada modul</p>
            <p className="mt-1 text-sm text-ink-secondary">
              Kegiatan butuh modul sebagai basis soal & materi.
            </p>
            <Button href="/admin/modules" className="mt-4">
              Buat Modul
            </Button>
          </div>
        ) : (
          <>
            <p className="text-h2 font-semibold">Detail kegiatan</p>
            <CreateActivityForm modules={modules} />
          </>
        )}
      </section>
    </AdminShell>
  );
}
