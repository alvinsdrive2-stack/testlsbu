import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md border-y border-hairline py-16 text-center">
        <p className="label-eyebrow text-flag">404</p>
        <h1 className="mt-3 text-[var(--text-h2)] font-bold tracking-tight">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          Link salah atau sudah kedaluwarsa.
        </p>
        <Link
          href="/p"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 ease-out hover:bg-accent-hover active:scale-[0.98]"
        >
          Ke Dashboard
        </Link>
      </div>
    </main>
  );
}
