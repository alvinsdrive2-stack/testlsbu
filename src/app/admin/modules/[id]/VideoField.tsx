"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function VideoField({ defaultValue = "" }: { defaultValue?: string }) {
  const isUploaded = defaultValue.startsWith("/uploads/");
  const [mode, setMode] = useState<"url" | "upload">(
    isUploaded ? "upload" : "url"
  );
  const [url, setUrl] = useState(defaultValue);
  const [uploadedUrl, setUploadedUrl] = useState(
    isUploaded ? defaultValue : ""
  );
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
      const res = await fetch("/api/admin/upload-video", {
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

  const value = mode === "url" ? url : uploadedUrl || defaultValue;

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">Video (opsional)</span>
      <input type="hidden" name="videoUrl" value={value} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === "url" ? "primary" : "secondary"}
          className="px-3 py-1.5 text-sm"
          onClick={() => setMode("url")}
        >
          Link YouTube/Vimeo
        </Button>
        <Button
          type="button"
          variant={mode === "upload" ? "primary" : "secondary"}
          className="px-3 py-1.5 text-sm"
          onClick={() => setMode("upload")}
        >
          Upload file
        </Button>
      </div>
      {mode === "url" ? (
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="mt-2 w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-3 text-base transition-all duration-200 ease-out placeholder:text-ink-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="video/*"
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
      )}
      {error ? <p className="mt-1 text-sm text-flag">{error}</p> : null}
    </div>
  );
}
