import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { SidebarNav, MobileNav } from "./AdminNav";

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
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-hairline bg-surface p-6 md:flex">
        <Link href="/admin" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.png"
            alt="Logo Gapensi"
            className="h-10 w-auto rounded-md"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-base font-bold leading-none tracking-tight text-accent">
              GAPENSI
            </span>
            <span className="label-eyebrow text-ink-secondary">Panel Admin</span>
          </span>
        </Link>
        <div className="mt-10">
          <SidebarNav />
        </div>
        <form action={logout} className="mt-auto">
          <button
            type="submit"
            className="text-sm font-medium text-ink-secondary hover:text-accent"
          >
            Keluar
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-hairline bg-surface px-6 py-4 md:hidden">
          <div className="mb-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.png"
              alt="Logo Gapensi"
              className="h-8 w-auto rounded-md"
            />
            <span className="text-base font-bold leading-none tracking-tight text-accent">
              GAPENSI
            </span>
          </div>
          <MobileNav />
        </header>
        <main className="mx-auto my-[2.5vh] min-h-[95vh] max-w-11/12  bg-white px-6 py-8 shadow-2xl">
          {eyebrow ? (
            <p className="label-eyebrow mb-2 text-ink-secondary">{eyebrow}</p>
          ) : null}
          <h1 className="text-[clamp(40px,8vw,96px)] font-bold leading-none tracking-tight">
            {title}
          </h1>
          <div className="mt-12 space-y-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
