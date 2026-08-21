import Image from "next/image";
import { Backdrop } from "@/components/ui/Backdrop";
import { PageTransition } from "@/components/ui/PageTransition";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Backdrop />
      <main className="flex min-h-screen items-center justify-center px-4">
        <PageTransition className="w-full max-w-md">
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-10 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            <Image
              src="/favicon.png"
              alt="Logo Gapensi"
              width={64}
              height={64}
              className="mx-auto h-10 w-auto rounded-md"
            />
            <h1 className="mt-6 text-h2 font-bold tracking-tight text-ink">
              404 — Halaman tidak ditemukan
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              Jika ingin mendaftar kegiatan, silahkan register ke BPD Gapensi
              daerah Anda.
            </p>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
