"use client";

import { useActionState, useState } from "react";
import { createModule } from "./actions";
import { TextField, TextArea } from "@/components/ui/Field";
import { AddFab, Modal } from "@/components/ui/Modal";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function AddModuleFab() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createModule, {});

  return (
    <>
      <AddFab label="Tambah modul baru" onClick={() => setOpen(true)} />

      <Modal
        label="Tambah modul baru"
        title="Modul baru"
        open={open}
        onClose={() => setOpen(false)}
      >
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
              <span role="alert" className="text-sm text-flag">
                {state.error}
              </span>
            ) : null}
          </div>
        </form>
      </Modal>
    </>
  );
}
