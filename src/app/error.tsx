"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-hairline bg-surface p-10 text-center shadow-[0_1px_3px_rgba(15,20,25,0.06)]">
        <p className="label-eyebrow text-ink-secondary">Terjadi masalah</p>
        <h1 className="mt-3 text-[var(--text-h2)] font-bold tracking-tight text-ink">
          Ups, ada yang tidak beres
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          Terjadi kesalahan tak terduga saat memuat halaman. Silakan coba lagi —
          kalau masih muncul, hubungi admin.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-200 ease-out hover:bg-accent-hover active:scale-[0.98]"
        >
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
