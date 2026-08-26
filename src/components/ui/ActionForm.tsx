"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";

export type ActionFormState = { error?: string };

export function ActionForm({
  action,
  inputs,
  className,
  children,
}: {
  action: (
    prev: ActionFormState,
    formData: FormData
  ) => Promise<ActionFormState>;
  inputs?: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  const [state, formAction] = useActionState<ActionFormState, FormData>(
    action,
    {}
  );

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
