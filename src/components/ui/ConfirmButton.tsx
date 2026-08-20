"use client";

import { useEffect, useRef, useState } from "react";

export function ConfirmButton({
  label,
  confirmLabel = "Yakin? Klik lagi",
  className = "",
}: {
  label: string;
  confirmLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setArmed(false), 3000);
        }
      }}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
        armed
          ? "bg-flag text-white"
          : "border border-hairline-strong bg-surface text-flag hover:bg-flag/5"
      } ${className}`}
    >
      {armed ? confirmLabel : label}
      {armed ? (
        <span role="status" className="sr-only">
          {confirmLabel}
        </span>
      ) : null}
    </button>
  );
}
