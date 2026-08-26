"use client";

import { useState, useRef } from "react";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import { CERTIFICATE_FIELDS } from "@/lib/certificate-fields";

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
};

export default function CertificatePreviewPage() {
  const [imageSize, setImageSize] = useState({ width: 2000, height: 1414 });
  const [texts, setTexts] = useState<DraggableText[]>(
    CERTIFICATE_FIELDS.map((f) => ({
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
    }))
  );

  const [dragging, setDragging] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (img) {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  const handleMouseDown = (id: string) => {
    setDragging(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setTexts((prev) =>
      prev.map((t) =>
        t.id === dragging
          ? { ...t, x: Math.round(x), y: Math.round(y) }
          : t
      )
    );
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

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

  const copyConfig = () => {
    const config = texts.map((t) => ({
      label: t.label,
      x: t.x,
      y: t.y,
      fontSize: t.fontSize,
      color: t.color,
      align: t.align,
      fontWeight: t.fontWeight,
      fontFamily: t.fontFamily,
    }));
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  return (
    <div className="min-h-screen bg-canvas p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-h1 font-bold">Preview Sertifikat</h1>
          <button
            onClick={copyConfig}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-surface hover:brightness-110"
          >
            Copy Konfigurasi
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div
              className="relative inline-block cursor-crosshair"
              style={{ containerType: "inline-size" }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
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
                    onMouseDown={() => handleMouseDown(text.id)}
                    className="absolute cursor-move select-none"
                    style={{
                      left: `${(actualX / imageSize.width) * 100}%`,
                      top: `${(text.y / imageSize.height) * 100}%`,
                      transform:
                        text.align === "middle"
                          ? "translate(-50%, -50%)"
                          : text.align === "end"
                          ? "translate(-100%, -50%)"
                          : "translate(0, -50%)",
                      fontSize: `${(text.fontSize / 10 / imageSize.width) * 100}cqw`,
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
                      setTexts((prev) =>
                        prev.map((t) => (t.id === text.id ? { ...t, fontSize: size } : t))
                      );
                    }}
                    className="w-full rounded-md border border-hairline-strong px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-ink-secondary">X:</span> {text.x}
                  </div>
                  <div>
                    <span className="text-ink-secondary">Y:</span> {text.y}
                  </div>
                  <div>
                    <span className="text-ink-secondary">Align:</span> {text.align}
                  </div>
                  <div>
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
            key={texts.map((t) => t.content).join("|")}
            src={`/api/certificate-preview?${new URLSearchParams(
              texts.map((t) => [t.id, t.content])
            ).toString()}`}
            alt="Hasil render sertifikat"
            className="max-w-full h-auto rounded-[var(--radius-card)] border border-hairline"
          />
          <p className="text-sm text-ink-secondary">
            Gambar ini dirender engine yang sama persis dengan file download.
            Posisi dan ukuran diambil dari config di src/lib/certificate-render.ts.
          </p>
        </section>
      </div>
    </div>
  );
}
