"use client";

import { useActionState, useEffect, useState } from "react";
import { updateActivitySchedule } from "../actions";
import { Button } from "@/components/ui/Button";
import { toJakartaInputValue } from "@/lib/activity-phase";

type Schedule = {
  registrationStart: Date | null;
  pretestStart: Date | null;
  materialStart: Date | null;
  posttestStart: Date | null;
  closedAt: Date | null;
};

const FIELDS: { name: keyof Schedule; label: string }[] = [
  { name: "registrationStart", label: "Pendaftaran mulai" },
  { name: "pretestStart", label: "Pretest mulai" },
  { name: "materialStart", label: "Materi dibuka" },
  { name: "posttestStart", label: "Posttest mulai" },
  { name: "closedAt", label: "Kegiatan ditutup" },
];

const inputClass =
  "w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-2.5 text-[15px] transition-all duration-200 ease-out focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function ScheduleForm({
  activityId,
  schedule,
}: {
  activityId: string;
  schedule: Schedule;
}) {
  const [state, formAction, pending] = useActionState<
    { ok?: boolean; error?: string },
    FormData
  >(updateActivitySchedule, {});
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-6">
      <input type="hidden" name="activityId" value={activityId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label
              htmlFor={f.name}
              className="label-eyebrow mb-1.5 block text-ink-secondary"
            >
              {f.label}
            </label>
            <input
              id={f.name}
              name={f.name}
              type="datetime-local"
              defaultValue={
                schedule[f.name] ? toJakartaInputValue(schedule[f.name]!) : ""
              }
              className={inputClass}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-secondary">
        Waktu Jakarta (WIB). Kosongkan untuk melewati fase.
      </p>
      <div className="mt-4 flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Jadwal"}
        </Button>
        {flash ? (
          <p role="status" className="text-sm font-medium text-accent">
            Tersimpan ✓
          </p>
        ) : null}
        {state.error ? (
          <p role="alert" className="text-sm font-medium text-flag">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
