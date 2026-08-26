"use client";

import { useActionState } from "react";
import { startPosttestRetry, type PosttestFormState } from "./actions";
import { Button } from "@/components/ui/Button";

export function StartPosttestForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<
    PosttestFormState,
    FormData
  >(startPosttestRetry, {});

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="token" value={token} />
      <p className="mb-4 rounded-md border border-warning/40 bg-warning-soft px-4 py-3 text-left text-sm leading-relaxed text-ink">
        Ujian hanya bisa dikerjakan <strong>selama sesi posttest
        berlangsung</strong>. Kalau sesi berganti atau waktu habis, jawaban
        terkirim otomatis dan ujian terkunci.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyiapkan…" : "Mulai Posttest"}
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
