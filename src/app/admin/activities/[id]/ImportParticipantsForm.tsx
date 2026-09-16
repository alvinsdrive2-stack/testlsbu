"use client";

import { useActionState } from "react";
import {
  importParticipants,
  type ImportState,
} from "./import-actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ImportParticipantsForm({ activityId }: { activityId: string }) {
  const [state, formAction] = useActionState<ImportState, FormData>(
    importParticipants,
    {}
  );

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="activityId" value={activityId} />
        <div className="min-w-64 flex-1">
          <label
            htmlFor="import-file"
            className="label-eyebrow mb-1.5 block text-ink-secondary"
          >
            File Excel (.xlsx)
          </label>
          <input
            id="import-file"
            name="file"
            type="file"
            accept=".xlsx"
            required
            className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <SubmitButton pendingLabel="Mengimport…">Import Peserta</SubmitButton>
      </form>

      <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
        Kolom wajib: NAMA PESERTA, NAMA PERUSAHAAN, NPWP PERUSAHAAN, TELEPON,
        ALAMAT EMAIL PESERTA. File hasil <span className="font-medium">Export Excel</span> bisa
        langsung diimport ulang. Tulis NPWP dan telepon sebagai teks, bukan
        angka, supaya digitnya tidak berubah.
      </p>

      {state.error ? (
        <div role="alert" className="mt-4 rounded-md border border-flag/30 bg-flag/5 px-4 py-3">
          <p className="text-sm font-medium text-flag">{state.error}</p>
          {state.errors && state.errors.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-flag">
              {state.errors.slice(0, 20).map((e) => (
                <li key={e.row}>
                  Baris {e.row}: {e.message}
                </li>
              ))}
              {state.errors.length > 20 ? (
                <li>…dan {state.errors.length - 20} baris lainnya.</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}

      {state.ok ? (
        <div
          role="status"
          className="mt-4 rounded-md border border-success/30 bg-success-soft px-4 py-3"
        >
          <p className="text-sm font-semibold text-success">
            {state.inserted} peserta berhasil diimport.
          </p>
          {state.newUsers || state.reusedUsers ? (
            <p className="mt-1 text-sm text-ink-secondary">
              {state.newUsers ?? 0} identitas baru
              {state.reusedUsers
                ? `, ${state.reusedUsers} peserta yang sudah punya akun dari kegiatan lain (datanya tidak diubah)`
                : ""}
              .
            </p>
          ) : null}
          {state.duplicateInActivity && state.duplicateInActivity > 0 ? (
            <p className="mt-1 text-sm font-medium text-flag">
              Perhatian: {state.duplicateInActivity} baris sudah terdaftar di
              kegiatan ini sebelumnya dan dilewati — pastikan file tidak
              ter-upload dua kali.
            </p>
          ) : null}
          {state.failedRows && state.failedRows > 0 ? (
            <p className="mt-1 text-sm text-ink-secondary">
              {state.failedRows} baris dilewati karena tidak valid:
            </p>
          ) : null}
          {state.errors && state.errors.length > 0 ? (
            <ul className="mt-1 space-y-1 text-sm text-ink-secondary">
              {state.errors.slice(0, 20).map((e) => (
                <li key={e.row}>
                  Baris {e.row}: {e.message}
                </li>
              ))}
              {state.errors.length > 20 ? (
                <li>…dan {state.errors.length - 20} baris lainnya.</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
