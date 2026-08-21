"use client";

import { useState } from "react";

export function PdfField({ defaultValue = "" }: { defaultValue?: string }) {
  const [uploadedUrl, setUploadedUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload-pdf", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Upload gagal");
      }
      setUploadedUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">
        Lampiran PDF (opsional)
      </span>
      <input type="hidden" name="pdfUrl" value={uploadedUrl} />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          disabled={busy}
          className="text-sm"
        />
        {busy ? (
          <span className="text-sm text-ink-secondary">Mengunggah…</span>
        ) : null}
        {!busy && uploadedUrl ? (
          <span className="truncate text-sm text-success">{uploadedUrl}</span>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-sm text-flag">{error}</p> : null}
    </div>
  );
}
