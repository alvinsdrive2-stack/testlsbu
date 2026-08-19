import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard">
      <Link
        href="/admin/modules"
        className="block rounded-[var(--radius-card)] border border-hairline bg-surface p-6 hover:bg-canvas"
      >
        <p className="text-h2 font-semibold">Modul</p>
        <p className="mt-1 text-sm text-ink-secondary">
          Kelola soal, materi, dan pengaturan ujian.
        </p>
      </Link>
    </AdminShell>
  );
}
