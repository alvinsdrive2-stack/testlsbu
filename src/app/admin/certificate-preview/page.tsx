"use client";

import { useState, useRef, useEffect } from "react";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";

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

export default function CertificatePreviewPage() {
  const [imageSize, setImageSize] = useState({ width: 1200, height: 800 });
  const [texts, setTexts] = useState<DraggableText[]>([
    {
      id: "number",
      x: 600,
      y: 176,
      fontSize: 180,
      color: "#108af4",
      align: "middle",
      content: "CERT-001",
      label: "Nomor Sertifikat",
      fontWeight: "300",
      fontFamily: "Poppins",
    },
    {
      id: "name",
      x: 600,
      y: 309,
      fontSize: 600,
      color: "#012A4D",
      align: "middle",
      content: "Nama Peserta",
      label: "Nama",
      fontWeight: "normal",
      fontFamily: "Poppins",
    },
    {
      id: "company",
      x: 600,
      y: 237,
      fontSize: 400,
      color: "#012A4D",
      align: "middle",
      content: "Nama Perusahaan",
      label: "Perusahaan",
      fontWeight: "normal",
      fontFamily: "Poppins",
    },
    {
      id: "npwp",
      x: 600,
      y: 274,
      fontSize: 199,
      color: "#012A4D",
      align: "middle",
      content: "NPWP Perusahaan",
      label: "NPWP",
      fontWeight: "normal",
      fontFamily: "Poppins",
    },
    {
      id: "module",
      x: 600,
      y: 442,
      fontSize: 190,
      color: "#0d0d0d",
      align: "middle",
      content: "Nama Modul",
      label: "Modul",
      fontWeight: "normal",
      fontFamily: "Poppins",
    },
  ]);

  const [dragging, setDragging] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      setImageSize({
        width: imgRef.current.width,
        height: imgRef.current.height,
      });
    }
  }, []);

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
                      fontSize: `${text.fontSize / 10}px`,
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
      </div>
    </div>
  );
}
