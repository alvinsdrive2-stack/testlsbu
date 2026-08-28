"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/700.css";
import {
  CERTIFICATE_FIELDS,
  type CertificateFieldConfig,
} from "@/lib/certificate-fields";
import { toastError, toastSuccess } from "@/lib/toast";

interface DraggableText {
  id: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align: "start" | "middle" | "end";
  content: string;
  label: string;
  fontWeight?: string;
  fontFamily?: string;
}

const DEFAULT_CONTENT: Record<string, string> = {
  number: "CERT-001",
  name: "Nama Peserta",
  company: "Nama Perusahaan",
  npwp: "NPWP Perusahaan",
  module: "Nama Modul",
  date: "1 Januari 2026",
};

function applyFields(
  prev: DraggableText[],
  fields: CertificateFieldConfig[]
): DraggableText[] {
  return prev.map((t) => {
    const f = fields.find((f) => f.key === t.id);
    return f
      ? {
          ...t,
          x: f.x,
          y: f.y,
          fontSize: f.fontSize,
          color: f.color,
          align: f.align,
          fontWeight: f.fontWeight,
          fontFamily: f.fontFamily,
        }
      : t;
  });
}

const DEFAULT_TEXTS: DraggableText[] = CERTIFICATE_FIELDS.map((f) => ({
  id: f.key,
  x: f.x,
  y: f.y,
  fontSize: f.fontSize,
  color: f.color,
  align: f.align,
  content: DEFAULT_CONTENT[f.key] ?? f.label,
  label: f.label,
  fontWeight: f.fontWeight,
  fontFamily: f.fontFamily,
}));

export default function CertificatePreviewPage() {
  const [imageSize, setImageSize] = useState({ width: 2000, height: 1414 });
  const [displayWidth, setDisplayWidth] = useState(0);
  const [texts, setTexts] = useState<DraggableText[]>(DEFAULT_TEXTS);
  const [dragging, setDragging] = useState<string | null>(null);
  const [savedFields, setSavedFields] = useState<CertificateFieldConfig[] | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loadError, setLoadError] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/certificate-config")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled && data?.fields) {
          setSavedFields(data.fields);
          setTexts((prev) => applyFields(prev, data.fields));
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // snapshot untuk panel render asli — debounce biar drag/typenggak spam render server
  const [renderInputs, setRenderInputs] = useState<DraggableText[]>(texts);
  useEffect(() => {
    const t = setTimeout(() => setRenderInputs(texts), 400);
    return () => clearTimeout(t);
  }, [texts]);

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (img) {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const update = () => setDisplayWidth(img.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(img);
    return () => ro.disconnect();
  }, []);

  const scale = displayWidth > 0 && imageSize.width > 0 ? displayWidth / imageSize.width : 1;

  const dragIdRef = useRef<string | null>(null);

  const startDrag = (id: string) => {
    dragIdRef.current = id;
    setDragging(id);
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const id = dragIdRef.current;
    if (!id || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setTexts((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, x: Math.round(x), y: Math.round(y) }
          : t
      )
    );
  };

  // stabil via useCallback — dipasang langsung sebagai listener window, identitasnya nggak boleh berubah
  const endDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragging(null);
  }, []);

  // handler global mouse+touch selama drag — keep di ref biar effect nggak perlu re-bind tiap render
  const moveDragRef = useRef(moveDrag);
  moveDragRef.current = moveDrag;

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      moveDragRef.current(e.clientX, e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      if (touch) moveDragRef.current(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", endDrag);
    window.addEventListener("touchcancel", endDrag);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", endDrag);
      window.removeEventListener("touchcancel", endDrag);
    };
  }, [dragging, endDrag]);

  const handleContentChange = (id: string, value: string) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content: value } : t))
    );
  };

  const handleAlignChange = (id: string, align: "start" | "middle" | "end") => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, align } : t))
    );
  };

  const handleColorChange = (id: string, color: string) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, color } : t))
    );
  };

  const handleFontSizeChange = (id: string, size: number) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, fontSize: size } : t))
    );
  };

  const handleFontWeightChange = (id: string, weight: string) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, fontWeight: weight } : t))
    );
  };

  const handlePositionChange = (
    id: string,
    axis: "x" | "y",
    percent: number
  ) => {
    const clamped = Math.min(100, Math.max(0, percent));
    setTexts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const px =
          (clamped / 100) *
          (axis === "x" ? imageSize.width : imageSize.height);
        return { ...t, [axis]: Math.round(px) };
      })
    );
  };

  const toFields = (list: DraggableText[]): CertificateFieldConfig[] =>
    list.map((t) => ({
      key: t.id as CertificateFieldConfig["key"],
      label: t.label,
      x: t.x,
      y: t.y,
      fontSize: t.fontSize,
      color: t.color,
      align: t.align,
      fontWeight: t.fontWeight || "normal",
      fontFamily: t.fontFamily || "Poppins",
    }));

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/admin/certificate-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: toFields(texts) }),
      });
      setSaveState(res.ok ? "saved" : "error");
      if (res.ok) {
        setSavedFields(toFields(texts));
        toastSuccess("Konfigurasi sertifikat tersimpan");
      }
      else toastError("Gagal menyimpan konfigurasi.");
    } catch {
      setSaveState("error");
      toastError("Gagal menyimpan konfigurasi.");
    }
  };

  const handleReset = () => {
    setTexts((prev) => applyFields(prev, CERTIFICATE_FIELDS));
    setSaveState("idle");
  };

  const copyConfig = () => {
    setCopyFailed(false);
    navigator.clipboard
      .writeText(JSON.stringify(toFields(texts), null, 2))
      .catch(() => setCopyFailed(true));
  };

  const realPreviewSrc = () => {
    const p = new URLSearchParams();
    for (const t of renderInputs) p.set(t.id, t.content);
    p.set("config", encodeURIComponent(JSON.stringify(toFields(renderInputs))));
    return `/api/certificate-preview?${p.toString()}`;
  };

  // snapshot posisi hasil load/save — dipakai buat deteksi perubahan belum disimpan
  const savedSnapshot = useMemo(
    () =>
      savedFields
        ? JSON.stringify(toFields(applyFields(DEFAULT_TEXTS, savedFields)))
        : null,
    [savedFields]
  );

  const isDirty =
    savedSnapshot !== null &&
    JSON.stringify(toFields(texts)) !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-8 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-semibold text-accent hover:underline"
            >
              &larr; Kembali ke Dashboard
            </Link>
            <span aria-hidden className="h-4 w-px bg-hairline-strong" />
            <Link href="/admin" className="flex flex-col">
              <span className="text-base font-bold leading-none tracking-tight text-accent">
                GAPENSI
              </span>
              <span className="label-eyebrow text-ink-secondary">Panel Admin</span>
            </Link>
          </div>
          <h1 className="text-sm font-semibold text-ink">Editor Sertifikat</h1>
        </div>
      </header>

      <main className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {loadError ? (
          <p role="alert" className="rounded-md border border-flag/30 bg-flag/10 px-4 py-3 text-sm font-medium text-flag">
            Gagal memuat konfigurasi tersimpan. Kalau kamu klik Simpan sekarang,
            konfigurasi di server bisa tertimpa versi default. Refresh halaman buat
            coba lagi.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h1 font-bold">
            Preview Sertifikat
            {isDirty ? (
              <span className="ml-3 align-middle text-sm font-medium text-ink-secondary">
                Belum disimpan
              </span>
            ) : null}
          </h2>
          <div className="flex items-center gap-3">
            {saveState === "saved" ? (
              <span className="text-sm font-medium text-accent">Tersimpan</span>
            ) : saveState === "error" ? (
              <span className="text-sm font-medium text-flag">Gagal simpan</span>
            ) : null}
            {copyFailed ? (
              <span className="text-sm font-medium text-flag">Gagal menyalin</span>
            ) : null}
            <button
              onClick={copyConfig}
              className="rounded-md border border-hairline-strong bg-surface px-4 py-2 text-sm font-semibold hover:bg-canvas"
            >
              Copy JSON
            </button>
            <button
              onClick={handleReset}
              className="rounded-md border border-hairline-strong bg-surface px-4 py-2 text-sm font-semibold hover:bg-canvas"
            >
              Reset Default
            </button>
            <button
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-surface hover:brightness-110 disabled:opacity-40"
            >
              {saveState === "saving" ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative inline-block cursor-crosshair">
              <img
                ref={imgRef}
                src="/template/template1.png"
                alt="Template"
                className="max-w-full h-auto border border-hairline"
                draggable={false}
                style={{ maxWidth: "100%" }}
                onLoad={handleImageLoad}
              />
              {texts.map((text) => {
                const centerX = imageSize.width / 2;
                const actualX = text.align === "middle" ? centerX : text.x;
                return (
                  <div
                    key={text.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      startDrag(text.id);
                    }}
                    onTouchStart={() => startDrag(text.id)}
                    className="absolute z-10 cursor-move select-none touch-none"
                    style={{
                      left: `${(actualX / imageSize.width) * 100}%`,
                      top: `${(text.y / imageSize.height) * 100}%`,
                      transform:
                        text.align === "middle"
                          ? "translate(-50%, -50%)"
                          : text.align === "end"
                          ? "translate(-100%, -50%)"
                          : "translate(0, -50%)",
                      fontSize: `${(text.fontSize / 10) * scale}px`,
                      color: text.color,
                      fontWeight: text.fontWeight || "normal",
                      fontFamily: text.fontFamily || "Arial",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {text.content}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-h2 font-semibold">Edit Text</h2>
            {texts.map((text) => (
              <div key={text.id} className="rounded-md border border-hairline bg-surface p-4">
                <label className="label-eyebrow mb-2 block text-ink-secondary">
                  {text.label}
                </label>
                <input
                  type="text"
                  value={text.content}
                  onChange={(e) => handleContentChange(text.id, e.target.value)}
                  className="mb-3 w-full rounded-md border border-hairline-strong px-3 py-2 text-sm"
                />
                <div className="mb-3">
                  <label className="mb-1 block text-xs text-ink-secondary">Font Size</label>
                  <input
                    type="number"
                    value={text.fontSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value) || 24;
                      handleFontSizeChange(text.id, size);
                    }}
                    className="w-full rounded-md border border-hairline-strong px-3 py-2 text-sm"
                  />
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-ink-secondary">
                      X (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={Number(((text.x / imageSize.width) * 100).toFixed(1))}
                      onChange={(e) =>
                        handlePositionChange(text.id, "x", parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-md border border-hairline-strong px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-ink-secondary">
                      Y (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={Number(((text.y / imageSize.height) * 100).toFixed(1))}
                      onChange={(e) =>
                        handlePositionChange(text.id, "y", parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-md border border-hairline-strong px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div className="text-xs">
                    <span className="text-ink-secondary">Align:</span> {text.align}
                  </div>
                  <div className="text-xs">
                    <span className="text-ink-secondary">Color:</span> {text.color}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-ink-secondary">Text Align</label>
                  <select
                    value={text.align}
                    onChange={(e) =>
                      handleAlignChange(text.id, e.target.value as "start" | "middle" | "end")
                    }
                    className="w-full rounded-md border border-hairline-strong px-3 py-2 text-sm"
                  >
                    <option value="start">Left (Start)</option>
                    <option value="middle">Center (Middle)</option>
                    <option value="end">Right (End)</option>
                  </select>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-ink-secondary">Ketebalan</label>
                  <select
                    value={text.fontWeight || "normal"}
                    onChange={(e) => handleFontWeightChange(text.id, e.target.value)}
                    className="w-full rounded-md border border-hairline-strong px-3 py-2 text-sm"
                  >
                    <option value="bold">Bold (700)</option>
                    <option value="normal">Normal (400)</option>
                    <option value="300">Light (300)</option>
                  </select>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-ink-secondary">Warna</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={text.color}
                      onChange={(e) => handleColorChange(text.id, e.target.value)}
                      className="h-10 w-16 rounded border border-hairline-strong"
                    />
                    <input
                      type="text"
                      value={text.color}
                      onChange={(e) => handleColorChange(text.id, e.target.value)}
                      className="flex-1 rounded-md border border-hairline-strong px-3 py-2 text-sm"
                      placeholder="#666666"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-h2 font-semibold">
            Hasil Render Asli (1:1 dengan sertifikat download)
          </h2>
          <img
            src={realPreviewSrc()}
            alt="Hasil render sertifikat"
            className="max-w-full h-auto rounded-[var(--radius-card)] border border-hairline"
          />
          <p className="text-sm text-ink-secondary">
            Dirender engine yang sama dengan file download peserta, pakai konfigurasi
            di atas (belum perlu disimpan). Klik Simpan Konfigurasi untuk dipakai
            permanen di sertifikat peserta.
          </p>
        </section>
      </div>
      </main>
    </div>
  );
}
