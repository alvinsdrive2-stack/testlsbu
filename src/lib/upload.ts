export const VIDEO_MAX_SIZE = 200 * 1024 * 1024;
export const PDF_MAX_SIZE = 25 * 1024 * 1024;

export const VIDEO_SIZE_LABEL = "200 MB";
export const PDF_SIZE_LABEL = "25 MB";

export const VIDEO_FORMAT_LABEL = "MP4, WebM, OGG, atau MOV";

export const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-matroska",
]);

export const VIDEO_EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
};

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export function uploadWithProgress(
  url: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // response bukan JSON — biarkan data kosong
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) {
        resolve({ ok: true, url: data.url });
      } else {
        resolve({ ok: false, error: data.error || "Upload gagal, coba lagi" });
      }
    };

    xhr.onerror = () =>
      resolve({ ok: false, error: "Gagal terhubung ke server. Cek koneksi atau login ulang." });

    xhr.send(form);
  });
}
