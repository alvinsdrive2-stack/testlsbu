import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { SidebarNav, MobileNav } from "./AdminNav";

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-flag/5 hover:text-flag"
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className="size-4.5 shrink-0 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 6l3.5 3.5L13 13" />
          <path d="M16.5 9.5H8" />
          <path d="M11 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h6" />
        </svg>
        <span>Keluar</span>
      </button>
    </form>
  );
}

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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col shadow-2xl bg-surface pt-3 md:flex">
        <Link href="/admin" className="flex flex-col items-center gap-3 text-center pb-4 shadow-xl rounded-2xl w-full">
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
        <div className="mt-6">
          <SidebarNav />
        </div>
        <div className="mt-auto border-t border-hairline pt-4">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
            v0.1
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 hidden h-14 items-center justify-end border-b border-hairline bg-surface/95 px-6 backdrop-blur-xl md:flex">
          <LogoutButton />
        </header>

        <header className="border-b border-hairline bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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
            <LogoutButton />
          </div>
          <div className="mt-3">
            <MobileNav />
          </div>
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
