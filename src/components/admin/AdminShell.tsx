import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/modules", label: "Modul" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-surface p-6 md:flex">
        <p className="mb-8 text-lg font-semibold">Gapensi</p>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-canvas hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-auto">
          <Button variant="ghost" type="submit" className="px-0">
            Keluar
          </Button>
        </form>
      </aside>
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-[var(--text-hero)] font-semibold tracking-tight">
            {title}
          </h1>
          <div className="mt-8 space-y-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
