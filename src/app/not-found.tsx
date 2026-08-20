import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-hairline bg-surface p-10 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
        <p className="label-eyebrow text-ink-secondary">404</p>
        <h1 className="mt-3 text-[var(--text-h2)] font-bold tracking-tight text-ink">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          Link salah atau sudah kedaluwarsa.
        </p>
        <Button href="/p" className="mt-8">
          Ke Dashboard
        </Button>
      </div>
    </main>
  );
}
