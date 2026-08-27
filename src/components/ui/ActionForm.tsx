"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { useActionToast } from "./useActionToast";

export type ActionFormState = { error?: string; ok?: boolean };

export function ActionForm({
  action,
  inputs,
  className,
  children,
  successMessage,
}: {
  action: (
    prev: ActionFormState,
    formData: FormData
  ) => Promise<ActionFormState>;
  inputs?: Record<string, string>;
  className?: string;
  children: ReactNode;
  /** Teks toast saat action sukses. Kosongkan untuk flow yang redirect (sukses dikirim via QueryToast). */
  successMessage?: string;
}) {
  const [state, formAction] = useActionState<ActionFormState, FormData>(
    action,
    {}
  );

  useActionToast(state, successMessage ? { success: successMessage } : undefined);

  return (
    <form action={formAction} className={className}>
      {inputs
        ? Object.entries(inputs).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      {children}
      {state.error ? (
        <span role="alert" className="mt-1 block text-sm font-medium text-flag">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
