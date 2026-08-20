import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminDashboardPage() {
  const [moduleCount, activityCount, participantCount] = await Promise.all([
    prisma.module.count(),
    prisma.activity.count(),
    prisma.participant.count(),
  ]);

  const stats = [
    { label: "Modul", value: moduleCount, href: "/admin/modules" },
    { label: "Kegiatan", value: activityCount, href: "/admin/activities" },
    { label: "Peserta", value: participantCount, href: "/admin/activities" },
  ];

  return (
    <AdminShell title="Dashboard" eyebrow="Ringkasan">
      <section className="grid grid-cols-3 divide-x divide-hairline border-y border-hairline">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="px-6 py-10 transition-colors first:pl-0 hover:bg-surface"
          >
            <p className="text-[var(--text-h1)] font-bold tabular-nums">
              {s.value}
            </p>
            <p className="label-eyebrow mt-1 text-ink-secondary">{s.label}</p>
          </Link>
        ))}
      </section>
      <section className="space-y-6">
        <p className="max-w-xl text-[var(--text-body)] leading-relaxed text-ink-secondary">
          Kelola modul soal dan materi, buka kegiatan bimtek, lalu pantau
          progres peserta dari pretest sampai posttest.
        </p>
        <div className="flex gap-3">
          <Link
            href="/admin/modules"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Kelola Modul
          </Link>
          <Link
            href="/admin/activities"
            className="rounded-md border border-hairline-strong bg-surface px-4 py-2 text-sm font-semibold hover:bg-canvas"
          >
            Lihat Kegiatan
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
