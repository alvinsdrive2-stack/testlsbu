"use client";

import { useActionState } from "react";
import { createActivity } from "./actions";
import { TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CreateActivityForm({
  modules,
}: {
  modules: { id: string; title: string }[];
}) {
  const [state, formAction] = useActionState(createActivity, {});

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <label
          htmlFor="moduleId"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Modul
        </label>
        <select
          id="moduleId"
          name="moduleId"
          required
          className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>
      <TextField label="Judul kegiatan" name="title" required minLength={3} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Buat Kegiatan</SubmitButton>
        {state.error ? (
          <span className="text-sm text-flag">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
