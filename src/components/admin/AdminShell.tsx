import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { AdminNav } from "./AdminNav";

export function AdminShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-baseline gap-3">
            <span className="text-lg font-bold tracking-tight text-accent">
              GAPENSI
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-ink-secondary sm:inline">
              Panel Admin
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <AdminNav />
            <form action={logout}>
              <button
                type="submit"
                className="text-sm font-medium text-ink-secondary hover:text-flag"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-16">
        {eyebrow ? (
          <p className="label-eyebrow mb-2 text-flag">{eyebrow}</p>
        ) : null}
        <h1 className="text-[var(--text-hero)] font-bold tracking-tight">
          {title}
        </h1>
        <div className="mt-12 space-y-12">{children}</div>
      </main>
    </div>
  );
}
