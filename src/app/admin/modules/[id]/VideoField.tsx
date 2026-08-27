"use client";

import { useState } from "react";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import { Button } from "@/components/ui/Button";
import {
  VIDEO_FORMAT_LABEL,
  VIDEO_MAX_SIZE,
  VIDEO_MIMES,
  VIDEO_SIZE_LABEL,
  formatBytes,
  uploadWithProgress,
} from "@/lib/upload";

const MKV_HINT =
  "File MKV tidak bisa diputar di browser. Konversi ke MP4 dulu.";
const NON_MP4_HINT =
  "Format ini mungkin tidak bisa diputar di semua browser. MP4 (H.264) paling aman.";

export function VideoField({ defaultValue = "" }: { defaultValue?: string }) {
  const isUploaded = defaultValue.startsWith("/uploads/");
  const [mode, setMode] = useState<"url" | "upload">(
    isUploaded ? "upload" : "url"
  );
  const [url, setUrl] = useState(defaultValue);
  const [uploadedUrl, setUploadedUrl] = useState(
    isUploaded ? defaultValue : ""
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const current = uploadedUrl || (isUploaded && !removed ? defaultValue : "");
  const ext = current.split(".").pop()?.toLowerCase() ?? null;
  const isMkv = ext === "mkv";
  const notMp4 = ext !== null && ext !== "mp4" && !isMkv;

  const value = mode === "url" ? url : removed ? "" : uploadedUrl || defaultValue;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(0);
    setFileName(file.name);
    setFileSize(file.size);

    if (file.type === "video/x-matroska") {
      setError(MKV_HINT);
      toastWarning(MKV_HINT);
      setBusy(false);
      return;
    }
    if (!file.type.startsWith("video/")) {
      setError("File harus berupa video.");
      toastWarning("File harus berupa video");
      setBusy(false);
      return;
    }
    if (file.type && !VIDEO_MIMES.has(file.type)) {
      const msg = `Format video tidak didukung. Gunakan ${VIDEO_FORMAT_LABEL}.`;
      setError(msg);
      toastWarning(msg);
      setBusy(false);
      return;
    }
    if (file.size > VIDEO_MAX_SIZE) {
      const msg = `Ukuran video terlalu besar. Maksimal ${VIDEO_SIZE_LABEL}.`;
      setError(msg);
      toastWarning(msg);
      setBusy(false);
      return;
    }

    const res = await uploadWithProgress("/api/admin/upload-video", file, setProgress);
    if (res.ok) {
      setUploadedUrl(res.url);
      setRemoved(false);
      toastSuccess("Video berhasil diunggah");
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
        <span className="text-sm font-medium">Video materi</span>
        <span className="text-xs text-ink-secondary">
          Maks {VIDEO_SIZE_LABEL} · {VIDEO_FORMAT_LABEL}
        </span>
      </div>
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
        <div className="mt-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-3 text-base transition-all duration-200 ease-out placeholder:text-ink-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <p className="mt-1 text-xs text-ink-secondary">
            Kalau video nggak bisa diputar (embed dibatasi uploader), pakai mode
            Upload file.
          </p>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-hairline-strong bg-canvas px-4 py-5 text-center transition-colors hover:border-accent">
            <input
              type="file"
              accept="video/*"
              onChange={handleFile}
              disabled={busy}
              className="hidden"
            />
            <span className="text-sm font-medium">Pilih file video</span>
            <span className="text-xs text-ink-secondary">
              MP4 (H.264) paling aman diputar di semua browser
            </span>
          </label>

          {busy ? (
            <div className="rounded-md border border-hairline bg-surface px-3 py-2">
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

          {!busy && current ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-hairline bg-surface px-3 py-2">
              <span className="text-sm font-medium text-success">
                ✓ Video terpasang
              </span>
              {fileName ? (
                <span className="truncate text-xs text-ink-secondary">
                  {fileName}
                  {fileSize != null ? ` · ${formatBytes(fileSize)}` : ""}
                </span>
              ) : null}
              <a
                href={current}
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

          {!busy && isMkv ? (
            <p className="text-xs text-flag">{MKV_HINT}</p>
          ) : !busy && notMp4 && current ? (
            <p className="text-xs text-ink-secondary">{NON_MP4_HINT}</p>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="mt-2 rounded-md border border-flag/30 bg-flag/10 px-3 py-2 text-sm text-flag">
          {error}
        </p>
      ) : null}
    </div>
  );
}
