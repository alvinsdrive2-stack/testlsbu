"use client";

import { useActionState } from "react";
import { createActivity } from "./actions";
import { TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const SCHEDULE_ROWS = [
  { name: "registrationStart", label: "Pendaftaran dibuka", hint: "Peserta mengisi form pendaftaran" },
  { name: "pretestStart", label: "Pretest dimulai", hint: "Peserta mengerjakan pretest" },
  { name: "materialStart", label: "Sesi materi dimulai", hint: "Materi & PDF bisa diakses peserta" },
  { name: "posttestStart", label: "Posttest dimulai", hint: "Ujian akhir dibuka" },
  { name: "closedAt", label: "Kegiatan ditutup", hint: "Semua akses peserta ditutup" },
] as const;

/** Default: hari ini +offset, jam WIB tertentu. */
function defaultWIB(offset: number, hour: number, minute = 0) {
  const shifted = new Date(Date.now() + offset * 86_400_000 + 7 * 3_600_000);
  return `${shifted.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const DEFAULTS: Record<(typeof SCHEDULE_ROWS)[number]["name"], string> = {
  registrationStart: defaultWIB(1, 8),
  pretestStart: defaultWIB(2, 8),
  materialStart: defaultWIB(2, 13),
  posttestStart: defaultWIB(3, 8),
  closedAt: defaultWIB(3, 17),
};

const inputClass =
  "w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-2.5 text-[15px] transition-all duration-200 ease-out focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function CreateActivityForm({
  modules,
  variant = "full",
}: {
  modules: { id: string; title: string }[];
  variant?: "quick" | "full";
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

      {variant === "full" ? (
        <div className="space-y-4 border-t border-hairline pt-4">
          <p className="text-sm font-semibold text-ink">Jadwal timeline</p>
          <p className="text-[13px] text-ink-secondary">
            Waktu Jakarta (WIB). Fase kegiatan berjalan otomatis mengikuti jadwal
            ini.
          </p>
          {SCHEDULE_ROWS.map((row) => (
            <div key={row.name}>
              <label
                htmlFor={row.name}
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                {row.label}
              </label>
              <input
                id={row.name}
                name={row.name}
                type="datetime-local"
                required
                defaultValue={DEFAULTS[row.name]}
                className={inputClass}
              />
              <p className="mt-1 text-[13px] text-ink-secondary">{row.hint}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-ink-secondary">
          Jadwal & timeline bisa diisi setelah kegiatan dibuat, di halaman
          detailnya.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Buat Kegiatan</SubmitButton>
        {state.error ? (
          <span className="text-sm text-flag">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
