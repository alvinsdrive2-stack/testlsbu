"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ boundaries }: { boundaries: string }) {
  const router = useRouter();

  useEffect(() => {
    const times = boundaries
      .split(",")
      .filter(Boolean)
      .map((b) => new Date(b).getTime())
      .filter((t) => Number.isFinite(t) && t > Date.now());

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30_000);

    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (times.length) {
      const delay = Math.min(...times) - Date.now() + 1500;
      if (delay > 0) {
        timeout = setTimeout(() => router.refresh(), delay);
      }
    }

    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [boundaries, router]);

  return null;
}
