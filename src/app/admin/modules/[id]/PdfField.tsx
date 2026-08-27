"use client";

import { useState } from "react";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import {
  PDF_MAX_SIZE,
  PDF_SIZE_LABEL,
  formatBytes,
  uploadWithProgress,
} from "@/lib/upload";

export function PdfField({ defaultValue = "" }: { defaultValue?: string }) {
  const [uploadedUrl, setUploadedUrl] = useState(defaultValue);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const value = removed ? "" : uploadedUrl;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    setFileName(file.name);
    setFileSize(file.size);

    if (file.type !== "application/pdf") {
      setError("File harus berupa PDF (.pdf).");
      toastWarning("File harus berupa PDF (.pdf)");
      setBusy(false);
      return;
    }
    if (file.size > PDF_MAX_SIZE) {
      const msg = `Ukuran PDF terlalu besar. Maksimal ${PDF_SIZE_LABEL}.`;
      setError(msg);
      toastWarning(msg);
      setBusy(false);
      return;
    }

    const res = await uploadWithProgress("/api/admin/upload-pdf", file, setProgress);
    if (res.ok) {
      setUploadedUrl(res.url);
      setRemoved(false);
      toastSuccess("PDF berhasil diunggah");
    } else {
      setError(res.error);
      toastError(res.error);
    }
    setBusy(false);
    e.target.value = "";
  }

  function handleRemove() {
    setUploadedUrl("");
    setRemoved(true);
    setFileName(null);
    setFileSize(null);
    setError(null);
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-1">
        <span className="text-sm font-medium">Lampiran PDF</span>
        <span className="text-xs text-ink-secondary">Maks {PDF_SIZE_LABEL} · .pdf</span>
      </div>
      <input type="hidden" name="pdfUrl" value={value} />

      <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-hairline-strong bg-canvas px-4 py-4 text-center transition-colors hover:border-accent">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          disabled={busy}
          className="hidden"
        />
        <span className="text-sm font-medium">Pilih file PDF</span>
        <span className="text-xs text-ink-secondary">Bisa dipratinjau di dashboard peserta</span>
      </label>

      {busy ? (
        <div className="mt-2 rounded-md border border-hairline bg-surface px-3 py-2">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-ink-secondary">{fileName}</span>
            <span className="shrink-0 tabular-nums text-ink-secondary">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-accent transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {!busy && value ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-hairline bg-surface px-3 py-2">
          <span className="text-sm font-medium text-success">✓ PDF terpasang</span>
          {fileName ? (
            <span className="truncate text-xs text-ink-secondary">
              {fileName}
              {fileSize != null ? ` · ${formatBytes(fileSize)}` : ""}
            </span>
          ) : null}
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs font-medium text-accent hover:underline"
          >
            Lihat file
          </a>
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-medium text-flag hover:underline"
          >
            Hapus
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-md border border-flag/30 bg-flag/10 px-3 py-2 text-sm text-flag">
          {error}
        </p>
      ) : null}
    </div>
  );
}
