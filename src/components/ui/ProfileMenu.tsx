"use client";

import { useEffect, useRef, useState } from "react";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileMenu({
  name,
  roleLabel,
  logoutAction,
  variant = "labeled",
}: {
  name: string;
  roleLabel: string;
  logoutAction: () => Promise<void>;
  variant?: "labeled" | "compact";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {variant === "compact" ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menu akun"
          className="flex size-10 items-center justify-center rounded-full border-[3px] border-ink bg-accent text-sm font-bold text-white transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
        >
          {initials(name) || "A"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Menu akun"
          className="flex items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-canvas"
        >
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-full border-[3px] border-ink bg-accent text-[13px] font-bold text-white"
          >
            {initials(name)}
          </span>
          <span className="hidden text-[15px] font-medium sm:inline">{name}</span>
        </button>
      )}

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-md border border-hairline bg-surface shadow-[0_8px_30px_rgba(15,20,25,0.14)]"
        >
          <div className="border-b border-hairline px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="text-[13px] text-ink-secondary">{roleLabel}</p>
          </div>
          <form action={logoutAction}>
            <button
              role="menuitem"
              type="submit"
              className="group flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-flag/5 hover:text-flag"
            >
              <svg
                viewBox="0 0 20 20"
                aria-hidden
                className="size-4.5 shrink-0 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 6l3.5 3.5L13 13" />
                <path d="M16.5 9.5H8" />
                <path d="M11 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h6" />
              </svg>
              Keluar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
