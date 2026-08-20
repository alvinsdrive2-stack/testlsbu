import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { CreateModuleForm } from "../CreateModuleForm";

export default function NewModulePage() {
  return (
    <AdminShell title="Modul Baru" eyebrow="Pustaka soal & materi">
      <Link
        href="/admin/modules"
        className="text-sm font-medium text-accent hover:underline"
      >
        ← Kembali ke daftar modul
      </Link>
      <section className="max-w-xl rounded-[var(--radius-card)] border border-hairline bg-surface p-6 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
        <p className="text-h2 font-semibold">Detail modul</p>
        <CreateModuleForm />
      </section>
    </AdminShell>
  );
}
