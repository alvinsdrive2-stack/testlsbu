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
      <div className="w-full max-w-md border-y border-hairline py-16 text-center">
        <p className="label-eyebrow text-flag">Terjadi masalah</p>
        <h1 className="mt-3 text-[var(--text-h2)] font-bold tracking-tight">
          Ups, ada yang tidak beres
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          {error.message ||
            "Terjadi kesalahan tak terduga. Silakan coba lagi."}
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
