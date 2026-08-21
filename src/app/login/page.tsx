import Image from "next/image";
import { loginParticipant } from "./actions";
import { Button } from "@/components/ui/Button";
import { Backdrop } from "@/components/ui/Backdrop";
import { PageTransition } from "@/components/ui/PageTransition";

export default async function ParticipantLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen">
      <Backdrop />
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <PageTransition className="w-full max-w-sm">
          <div className="w-full rounded-[var(--radius-card)] border border-hairline bg-surface p-10 shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
            <div className="flex items-center gap-3">
              <Image
                src="/favicon.png"
                alt="Logo Gapensi"
                width={64}
                height={64}
                className="h-10 w-auto rounded-md"
              />
              <span className="text-lg font-bold leading-none tracking-tight text-accent">
                GAPENSI
              </span>
            </div>
            <p className="label-eyebrow mt-6 text-ink-secondary">Dashboard Peserta</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
              Masuk ke Dashboard
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              Pakai email dan nomor WA yang kamu daftarkan.
            </p>
            <form action={loginParticipant} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  className="w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-3 text-base text-ink transition-all duration-200 ease-out placeholder:text-ink-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label
                  htmlFor="wa"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Nomor WA
                </label>
                <input
                  id="wa"
                  name="wa"
                  type="tel"
                  required
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-3 text-base text-ink transition-all duration-200 ease-out placeholder:text-ink-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              {error ? (
                <p role="alert" className="text-sm font-medium text-flag">
                  Email atau nomor WA tidak ditemukan. Pastikan data sama dengan
                  saat pendaftaran.
                </p>
              ) : null}
              <Button type="submit" className="w-full">
                Masuk
              </Button>
            </form>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
