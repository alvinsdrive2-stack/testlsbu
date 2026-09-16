"use client";

import { useEffect, useState } from "react";
import type { EmailStatus } from "@/app/api/check-email/route";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "checking" | EmailStatus | "error";

export function EmailField({ activityId }: { activityId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/check-email?email=${encodeURIComponent(value)}&activityId=${encodeURIComponent(activityId)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { status: EmailStatus } = await res.json();
        setStatus(data.status);
      } catch {
        setStatus("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [email, activityId]);

  const borderClass =
    status === "taken"
      ? "border-flag focus:border-flag focus:ring-flag/20"
      : status === "known"
        ? "border-accent focus:border-accent focus:ring-accent/20"
        : status === "ok"
          ? "border-success focus:border-success focus:ring-success/20"
          : "";

  return (
    <div>
      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
        Email aktif
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={status === "taken"}
        className={`w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-3 text-base text-ink transition-all duration-200 ease-out placeholder:text-ink-secondary/60 focus:outline-none focus:ring-2 ${borderClass}`}
      />
      {status === "checking" ? (
        <p className="mt-1.5 text-[13px] text-ink-secondary">
          Memeriksa ketersediaan email…
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-ink-secondary">
          Gagal memeriksa email. Coba ketik ulang — kalau terus gagal, daftar saja,
          admin akan verifikasi manual.
        </p>
      ) : null}
      {status === "taken" ? (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-flag">
          Email ini sudah terdaftar di kegiatan ini. Silakan gunakan nomor WA yang
          sama dengan pendaftaran sebelumnya untuk masuk langsung, atau{" "}
          <a href="/login" className="underline hover:opacity-80">
            login di sini
          </a>
          .
        </p>
      ) : null}
      {status === "known" ? (
        <p className="mt-1.5 text-[13px] font-medium text-accent">
          Email ini sudah dipakai di kegiatan lain. Isi dengan nomor WA yang sama
          seperti pendaftaran sebelumnya, lalu daftar — tidak masalah, kegiatan kamu
          yang lain tetap aman.
        </p>
      ) : null}
      {status === "ok" ? (
        <p className="mt-1.5 text-[13px] text-success">
          Email dapat digunakan
        </p>
      ) : null}
    </div>
  );
}
