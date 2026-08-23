"use client";

import { useActionState, useEffect, useState } from "react";
import { updateActivitySchedule } from "../actions";
import { Button } from "@/components/ui/Button";
import {
  toJakartaInputValue,
  type ActivityPhase,
} from "@/lib/activity-phase";

type Schedule = {
  registrationStart: Date | null;
  pretestStart: Date | null;
  materialStart: Date | null;
  posttestStart: Date | null;
  closedAt: Date | null;
};

type Row = {
  name: keyof Schedule;
  label: string;
  desc: string;
  phase: ActivityPhase;
};

const ROWS: Row[] = [
  {
    name: "registrationStart",
    label: "Pendaftaran",
    desc: "Peserta mengisi form pendaftaran",
    phase: "REGISTRATION",
  },
  {
    name: "pretestStart",
    label: "Pretest",
    desc: "Peserta mengerjakan pretest",
    phase: "PRETEST",
  },
  {
    name: "materialStart",
    label: "Sesi Materi",
    desc: "Materi & PDF bisa diakses peserta",
    phase: "MATERIAL",
  },
  {
    name: "posttestStart",
    label: "Posttest",
    desc: "Ujian akhir dibuka",
    phase: "POSTTEST",
  },
  {
    name: "closedAt",
    label: "Tutup Kegiatan",
    desc: "Semua akses peserta ditutup",
    phase: "CLOSED",
  },
];

const PHASE_ORDER: ActivityPhase[] = [
  "REGISTRATION",
  "PRETEST",
  "MATERIAL",
  "POSTTEST",
  "CLOSED",
];

const inputClass =
  "w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-2.5 text-[15px] transition-all duration-200 ease-out focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function ScheduleForm({
  activityId,
  schedule,
  activePhase,
}: {
  activityId: string;
  schedule: Schedule;
  activePhase: ActivityPhase;
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

  const currentIdx = PHASE_ORDER.indexOf(activePhase);

  return (
    <form action={formAction} className="mt-6">
      <input type="hidden" name="activityId" value={activityId} />
      <ol className="relative space-y-6">
        <span
          aria-hidden
          className="absolute bottom-3 left-[7px] top-3 w-px bg-hairline"
        />
        {ROWS.map((row) => {
          const rowIdx = PHASE_ORDER.indexOf(row.phase);
          const isActive = rowIdx === currentIdx;
          const isPast = currentIdx >= 0 && rowIdx < currentIdx;
          const value = schedule[row.name];
          return (
            <li key={row.name} className="relative flex gap-4">
              <span
                aria-hidden
                className={`relative z-10 mt-1.5 size-[15px] shrink-0 rounded-full border-2 transition-colors ${
                  isActive
                    ? "border-accent bg-accent ring-4 ring-accent/15"
                    : isPast
                      ? "border-success bg-success"
                      : "border-hairline-strong bg-surface"
                }`}
              />
              <div
                className={`min-w-0 flex-1 rounded-lg border px-4 py-3 transition-colors ${
                  isActive
                    ? "border-accent/40 bg-accent-soft/40"
                    : "border-transparent hover:border-hairline hover:bg-canvas/60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {row.label}
                    </span>
                    {isActive ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        Berjalan
                      </span>
                    ) : !value ? (
                      <span className="text-[12px] font-medium text-ink-secondary">
                        dilewati
                      </span>
                    ) : null}
                  </span>
                  <input
                    id={row.name}
                    name={row.name}
                    type="datetime-local"
                    required
                    aria-label={row.label}
                    defaultValue={value ? toJakartaInputValue(value) : ""}
                    className={`${inputClass} sm:w-64`}
                  />
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
                  {row.desc}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm text-ink-secondary">
        Waktu Jakarta (WIB). Semua jadwal wajib diisi — fase kegiatan berjalan
        otomatis mengikuti jadwal ini.
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
