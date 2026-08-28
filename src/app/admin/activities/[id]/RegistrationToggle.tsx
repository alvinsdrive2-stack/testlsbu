"use client";

import { useActionState } from "react";
import { setRegistrationOpen } from "../actions";
import { useActionToast } from "@/components/ui/useActionToast";

export function RegistrationToggle({
  activityId,
  open,
}: {
  activityId: string;
  open: boolean;
}) {
  const [state, formAction, pending] = useActionState(setRegistrationOpen, {});
  useActionToast(state, {
    success: open ? "Pendaftaran dibuka" : "Pendaftaran ditutup",
  });

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="open" value={open ? "0" : "1"} />
      <button
        type="submit"
        disabled={pending}
        role="switch"
        aria-checked={open}
        aria-label="Buka/tutup pendaftaran"
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-60 ${
          open
            ? "border-accent bg-accent"
            : "border-hairline-strong bg-hairline-strong/40"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all ${
            open ? "left-[22px]" : "left-[3px]"
          }`}
        />
      </button>
      <span
        className={`text-sm font-semibold ${open ? "text-accent" : "text-ink-secondary"}`}
      >
        {pending
          ? "Menyimpan…"
          : open
            ? "Pendaftaran dibuka"
            : "Pendaftaran ditutup"}
      </span>
      {state.error ? (
        <span role="alert" className="text-sm font-medium text-flag">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
