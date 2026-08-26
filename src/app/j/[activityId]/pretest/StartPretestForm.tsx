"use client";

import { useActionState } from "react";
import { startPretest, type PretestFormState } from "./actions";
import { Button } from "@/components/ui/Button";

export function StartPretestForm({ activityId }: { activityId: string }) {
  const [state, formAction, pending] = useActionState<
    PretestFormState,
    FormData
  >(startPretest, {});

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="activityId" value={activityId} />
      <p className="mb-4 rounded-md border border-warning/40 bg-warning-soft px-4 py-3 text-left text-sm leading-relaxed text-ink">
        Ujian hanya bisa dikerjakan <strong>selama sesi pretest
        berlangsung</strong>. Kalau sesi berganti atau waktu habis, jawaban
        terkirim otomatis dan ujian terkunci.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyiapkan…" : "Mulai Pretest"}
      </Button>
      {state.error ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-flag/30 bg-flag/10 px-4 py-3 text-sm font-medium text-flag"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
