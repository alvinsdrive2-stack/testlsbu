"use client";

import { useEffect, useState } from "react";

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return null;

  const diff = new Date(target).getTime() - now;
  if (diff <= 0) {
    return <span className="font-medium text-success">Sudah dibuka</span>;
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const label =
    days > 0
      ? `${days} hari ${pad(hours)}:${pad(mins)}:${pad(secs)}`
      : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

  return <span className="font-medium tabular-nums">{label}</span>;
}
