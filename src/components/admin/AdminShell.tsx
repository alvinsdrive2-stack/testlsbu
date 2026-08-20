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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col shadow-2xl bg-surface p-6 md:flex">
        <Link href="/admin" className="flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.png"
            alt="Logo Gapensi"
            className="h-20 w-auto rounded-xl"
          />
          <span className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold leading-none tracking-tight text-accent">
              GAPENSI
            </span>
            <span className="label-eyebrow text-ink-secondary">Panel Admin</span>
          </span>
        </Link>
        <div className="mt-10">
          <SidebarNav />
        </div>
        <div className="mt-auto border-t border-hairline pt-4">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
            v0.1
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-hairline-strong bg-surface px-3 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:bg-canvas hover:text-ink"
            >
              <svg
                viewBox="0 0 20 20"
                aria-hidden
                className="size-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13.5 6.5L17 10l-3.5 3.5" />
                <path d="M17 10H7.5" />
                <path d="M11 3.5H4.5A1.5 1.5 0 0 0 3 5v10a1.5 1.5 0 0 0 1.5 1.5H11" />
              </svg>
              Keluar
            </button>
          </form>
        </div>
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
          <h1 className="text-[clamp(30px,4vw,56px)] font-bold leading-none tracking-tight">
            {title}
          </h1>
          <div className="mt-12 space-y-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
