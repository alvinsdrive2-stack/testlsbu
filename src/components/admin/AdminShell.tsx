import Link from "next/link";
import { SidebarNav, MobileNav } from "./AdminNav";
import { ProfileMenu } from "./ProfileMenu";
import { PageTransition } from "@/components/ui/PageTransition";
import { Backdrop } from "@/components/ui/Backdrop";

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
      <Backdrop />

      <div className="fixed right-4 top-4 z-30">
        <ProfileMenu />
      </div>

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
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
            v0.1
          </p>
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
          <PageTransition>
            {eyebrow ? (
              <p className="label-eyebrow mb-2 text-ink-secondary">{eyebrow}</p>
            ) : null}
            <h1 className="text-[clamp(30px,4vw,56px)] font-bold leading-none tracking-tight">
              {title}
            </h1>
            <div className="mt-12 space-y-12">{children}</div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
