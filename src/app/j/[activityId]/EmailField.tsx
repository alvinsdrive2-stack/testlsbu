"use client";

import { useEffect, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "checking" | "taken" | "ok";

export function EmailField() {
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
          `/api/check-email?email=${encodeURIComponent(value)}`
        );
        const data: { taken: boolean } = await res.json();
        setStatus(data.taken ? "taken" : "ok");
      } catch {
        setStatus("idle");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [email]);

  const borderClass =
    status === "taken"
      ? "border-flag focus:border-flag focus:ring-flag/20"
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
        <p className="mt-1.5 text-[13px] text-ink-secondary">Memeriksa email…</p>
      ) : null}
      {status === "taken" ? (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-flag">
          Email sudah dipakai badan usaha lain. Gunakan email lain, atau login ke
          dashboard jika ini email kamu.
        </p>
      ) : null}
      {status === "ok" ? (
        <p className="mt-1.5 text-[13px] text-success">Email tersedia</p>
      ) : null}
    </div>
  );
}
