"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createModule } from "./actions";
import { TextField, TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function AddModuleFab() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, formAction] = useActionState(createModule, {});

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
        aria-label="Tambah modul baru"
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
            aria-label="Tambah modul baru"
            className="w-full max-w-lg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-h2 font-bold">Modul baru</h3>
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
            <form action={formAction} className="space-y-4">
              <TextField
                label="Judul"
                name="title"
                required
                minLength={3}
                autoFocus
              />
              <TextArea label="Deskripsi (opsional)" name="description" />
              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton pendingLabel="Membuat…">Buat Modul</SubmitButton>
                {state.error ? (
                  <span className="text-sm text-flag">{state.error}</span>
                ) : null}
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </>,
    document.body
  );
}
