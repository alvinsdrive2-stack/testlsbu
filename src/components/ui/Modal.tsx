"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { Card } from "./Card";

export function Modal({
  label,
  title,
  open,
  onClose,
  children,
}: {
  label: string;
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-h2 font-bold">{title}</h3>
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="px-3"
          >
            ✕
          </Button>
        </div>
        {children}
      </Card>
    </div>,
    document.body
  );
}

export function AddFab({ label, onClick }: { label: string; onClick: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Portal ke body: biar `fixed` gak ketawan containing block transform
  // dari PageTransition (animate-page-enter pakai fill-mode both).
  if (!mounted) return null;

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-lg border border-accent-hover bg-accent text-white transition-colors hover:bg-accent-hover"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-6">
        <path
          d="M12 5v14M5 12h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>,
    document.body
  );
}
