"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CreateActivityForm } from "./CreateActivityForm";

export function AddActivityFab({
  modules,
}: {
  modules: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tambah kegiatan baru"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-all duration-200 ease-out hover:bg-accent-hover active:scale-95"
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
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <Card
            role="dialog"
            aria-modal="true"
            aria-label="Tambah kegiatan baru"
            className="w-full max-w-lg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-h2 font-bold">Kegiatan baru</h3>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="px-3"
              >
                ✕
              </Button>
            </div>
            <CreateActivityForm modules={modules} variant="quick" />
          </Card>
        </div>
      ) : null}
    </>,
    document.body
  );
}
