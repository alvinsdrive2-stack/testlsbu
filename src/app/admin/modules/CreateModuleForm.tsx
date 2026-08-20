"use client";

import { useActionState } from "react";
import { createModule } from "./actions";
import { TextField, TextArea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CreateModuleForm() {
  const [state, formAction] = useActionState(createModule, {});

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <TextField label="Judul" name="title" required minLength={3} />
      <TextArea label="Deskripsi (opsional)" name="description" />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Buat Modul</SubmitButton>
        {state.error ? (
          <span className="text-sm text-flag">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
