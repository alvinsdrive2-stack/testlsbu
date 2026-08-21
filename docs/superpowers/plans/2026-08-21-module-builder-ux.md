# Module Builder UX + Navigation Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade halaman `/admin/modules/[id]` — materi rich text (TipTap) + video (embed/upload), FAB tambah soal, penjelasan menempel di jawaban benar — plus loading indicator global berlogo dan swap background ke webp baru.

**Architecture:** Semua perubahan UI di client components existing; data tetap di kolom `Material.content` (HTML) dan `Material.videoUrl` (embed URL atau path `/uploads/...`), tanpa migrasi Prisma. Upload video lewat route handler baru (bukan server action, agar bebas body-size-limit 1MB). Sanitasi HTML saat render di sisi participant. Loading indicator = overlay client component di root layout yang mendeteksi klik anchor internal.

**Tech Stack:** Next.js 15 (App Router, React 19), TipTap, sanitize-html, zod v4, Vitest, Tailwind v4 dengan design tokens di `globals.css`.

**Konvensi project:**
- Komponen UI kecil di `src/components/ui/`, komponen section halaman di sebelah `page.tsx`-nya.
- Server actions di `src/app/admin/modules/actions.ts`, pola `useActionState` dengan state `{ error?: string }`.
- Token warna Tailwind: `accent`, `accent-soft`, `surface`, `canvas`, `ink`, `ink-secondary`, `hairline`, `hairline-strong`, `flag`, `success`.
- Commit message bahasa Indonesia santai, tanpa Co-Authored-By.

---

### Task 1: Install dependencies

**Files:** tidak ada (hanya package.json)

- [ ] **Step 1: Install TipTap + sanitize-html**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image sanitize-html
npm install -D @types/sanitize-html
```

Expected: instalasi sukses, `package.json` berisi entri baru.

- [ ] **Step 2: Verifikasi build masih hijau**

Run: `npm run build`
Expected: sukses tanpa error type.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install tiptap + sanitize-html buat materi richtext"
```

---

### Task 2: Helper `videoEmbedUrl` (TDD)

**Files:**
- Create: `src/lib/video.ts`
- Test: `src/lib/__tests__/video.test.ts`

- [ ] **Step 1: Tulis test failing**

`src/lib/__tests__/video.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { videoEmbedUrl } from "../video";

describe("videoEmbedUrl", () => {
  it("YouTube watch URL jadi embed URL", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("YouTube short URL jadi embed URL", () => {
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("YouTube shorts URL jadi embed URL", () => {
    expect(videoEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("Vimeo URL jadi player URL", () => {
    expect(videoEmbedUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871"
    );
  });

  it("Vimeo /video/ URL jadi player URL", () => {
    expect(videoEmbedUrl("https://vimeo.com/video/76979871")).toBe(
      "https://player.vimeo.com/video/76979871"
    );
  });

  it("path upload lokal return null", () => {
    expect(videoEmbedUrl("/uploads/videos/abc.mp4")).toBeNull();
  });

  it("URL biasa return null", () => {
    expect(videoEmbedUrl("https://example.com/foo")).toBeNull();
  });

  it("string kosong return null", () => {
    expect(videoEmbedUrl("")).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan fail**

Run: `npx vitest run src/lib/__tests__/video.test.ts`
Expected: FAIL — modul `../video` tidak ditemukan.

- [ ] **Step 3: Implementasi minimal**

`src/lib/video.ts`:

```ts
export function videoEmbedUrl(url: string): string | null {
  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return null;
}
```

- [ ] **Step 4: Jalankan test, pastikan pass**

Run: `npx vitest run src/lib/__tests__/video.test.ts`
Expected: PASS semua.

- [ ] **Step 5: Commit**

```bash
git add src/lib/video.ts src/lib/__tests__/video.test.ts
git commit -m "feat: helper embed youtube/vimeo + unit test"
```

---

### Task 3: Helper sanitasi HTML materi (TDD)

**Files:**
- Create: `src/lib/sanitize.ts`
- Test: `src/lib/__tests__/sanitize.test.ts`

- [ ] **Step 1: Tulis test failing**

`src/lib/__tests__/sanitize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sanitizeMaterialHtml } from "../sanitize";

describe("sanitizeMaterialHtml", () => {
  it("tag yang diizinkan tetap ada", () => {
    const html = "<h2>Judul</h2><p>Halo <strong>tebal</strong> <em>miring</em></p><ul><li>item</li></ul>";
    expect(sanitizeMaterialHtml(html)).toContain("<h2>");
    expect(sanitizeMaterialHtml(html)).toContain("<strong>");
    expect(sanitizeMaterialHtml(html)).toContain("<em>");
    expect(sanitizeMaterialHtml(html)).toContain("<li>");
  });

  it("script dan onclick dibuang", () => {
    const html = '<p>ok</p><script>alert(1)</script><p onclick="x()">klik</p>';
    const clean = sanitizeMaterialHtml(html);
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("ok");
  });

  it("javascript: href dibuang", () => {
    const clean = sanitizeMaterialHtml('<a href="javascript:alert(1)">x</a>');
    expect(clean).not.toContain("javascript:");
  });

  it("img dengan src http tetap", () => {
    const clean = sanitizeMaterialHtml('<img src="https://example.com/a.png" alt="a">');
    expect(clean).toContain("<img");
    expect(clean).toContain('alt="a"');
  });

  it("string kosong aman", () => {
    expect(sanitizeMaterialHtml("")).toBe("");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan fail**

Run: `npx vitest run src/lib/__tests__/sanitize.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 3: Implementasi**

`src/lib/sanitize.ts`:

```ts
import sanitizeHtml from "sanitize-html";

export function sanitizeMaterialHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "h2", "h3", "strong", "em", "s", "u", "ul", "ol", "li",
      "a", "img", "br", "blockquote", "code", "pre", "hr",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
  });
}
```

- [ ] **Step 4: Jalankan test, pastikan pass**

Run: `npx vitest run src/lib/__tests__/sanitize.test.ts`
Expected: PASS semua.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sanitize.ts src/lib/__tests__/sanitize.test.ts
git commit -m "feat: sanitizer html materi + unit test"
```

---

### Task 4: Route handler upload video

**Files:**
- Create: `src/app/api/admin/upload-video/route.ts`

Catatan: middleware hanya match `/admin/:path*`, jadi route ini WAJIB verifikasi cookie admin sendiri (sama seperti `src/middleware.ts`).

- [ ] **Step 1: Tulis route handler**

`src/app/api/admin/upload-video/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_SIZE = 200 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
};

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("gapensi_admin")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET)
    );
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "File harus berupa video" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Ukuran video maksimal 200 MB" },
      { status: 400 }
    );
  }

  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Format video ${file.type} tidak didukung` },
      { status: 400 }
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(dir, { recursive: true });

  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/videos/${name}` });
}
```

- [ ] **Step 2: Tambahkan `.gitignore` entry folder uploads**

Tambahkan baris berikut di akhir `.gitignore`:

```
public/uploads/
```

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/upload-video/route.ts .gitignore
git commit -m "feat: route upload video admin ke public/uploads/videos"
```

---

### Task 5: Komponen `RichTextEditor` (TipTap)

**Files:**
- Create: `src/components/ui/RichTextEditor.tsx`
- Modify: `src/app/globals.css` (tambah class `prose-gapensi`)

- [ ] **Step 1: Tulis komponen**

`src/components/ui/RichTextEditor.tsx`:

```tsx
"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { useEffect, useRef } from "react";

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-8 rounded-md px-2.5 py-1 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-accent-soft text-accent" : "text-ink-secondary hover:bg-canvas hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      TiptapImage,
    ],
    content: defaultValue || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-gapensi min-h-40 w-full rounded-b-md border border-t-0 border-hairline-strong bg-surface px-3.5 py-3 text-base focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      if (hiddenRef.current) hiddenRef.current.value = editor.getHTML();
    },
  });

  useEffect(() => {
    if (hiddenRef.current) hiddenRef.current.value = defaultValue || "<p></p>";
  }, [defaultValue]);

  if (!editor) {
    return (
      <div>
        <span className="mb-1.5 block text-sm font-medium">{label}</span>
        <input type="hidden" name={name} ref={hiddenRef} defaultValue={defaultValue} />
        <div className="min-h-40 animate-pulse rounded-md border border-hairline-strong bg-canvas" />
      </div>
    );
  }

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL link", previous ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function setImage() {
    const url = window.prompt("URL gambar", "https://");
    if (!url || url === "https://") return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} ref={hiddenRef} />
      <div className="overflow-hidden rounded-md focus-within:ring-2 focus-within:ring-accent/20">
        <div className="flex flex-wrap gap-1 rounded-t-md border border-hairline-strong bg-canvas px-2 py-1.5">
          <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            B
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            I
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            S
          </ToolbarButton>
          <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </ToolbarButton>
          <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            H3
          </ToolbarButton>
          <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            •
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1.
          </ToolbarButton>
          <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
            🔗
          </ToolbarButton>
          <ToolbarButton label="Gambar" onClick={setImage}>
            🖼
          </ToolbarButton>
        </div>
        <editor-input-slot />
      </div>
    </div>
  );
}
```

PENTING — perbaiki dua hal di atas saat menulis file final:
1. `useReducer` harus di-import dari `react` (gabung dengan import yang ada: `import { useEffect, useReducer, useRef } from "react";`).
2. Baris `<editor-input-slot />` GANTI dengan `<EditorContent editor={editor} />` dan tambahkan import `EditorContent` dari `@tiptap/react` (gabung: `import { useEditor, EditorContent } from "@tiptap/react";`).

Render ulang toolbar saat selection berubah: daftarkan listener setelah editor tersedia — tambahkan `useEffect` berikut setelah deklarasi `editor`:

```tsx
useEffect(() => {
  if (!editor) return;
  editor.on("transaction", forceRender);
  return () => {
    editor.off("transaction", forceRender);
  };
}, [editor]);
```

Dan paksa sinkron hidden input sekali saat editor siap:

```tsx
useEffect(() => {
  if (editor && hiddenRef.current) {
    hiddenRef.current.value = editor.getHTML();
  }
}, [editor]);
```

- [ ] **Step 2: Tambah CSS `prose-gapensi` di `globals.css`**

Tambahkan sebelum blok `@media (prefers-reduced-motion: reduce)` di `src/app/globals.css`:

```css
.prose-gapensi h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 1.25rem 0 0.5rem;
  color: var(--color-ink);
}

.prose-gapensi h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 1rem 0 0.4rem;
  color: var(--color-ink);
}

.prose-gapensi p {
  margin: 0.5rem 0;
}

.prose-gapensi ul {
  list-style: disc;
  padding-left: 1.5rem;
}

.prose-gapensi ol {
  list-style: decimal;
  padding-left: 1.5rem;
}

.prose-gapensi li {
  margin: 0.2rem 0;
}

.prose-gapensi a {
  color: var(--color-accent);
  text-decoration: underline;
}

.prose-gapensi img {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.75rem 0;
}

.prose-gapensi blockquote {
  border-left: 3px solid var(--color-hairline-strong);
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: var(--color-ink-secondary);
}

.prose-gapensi code {
  background: var(--color-canvas);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.prose-gapensi pre {
  background: var(--color-canvas);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.prose-gapensi hr {
  border: none;
  border-top: 1px solid var(--color-hairline);
  margin: 1rem 0;
}
```

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: sukses tanpa error type.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/RichTextEditor.tsx src/app/globals.css
git commit -m "feat: komponen richtext editor tiptap + styling prose"
```

---

### Task 6: Komponen `VideoField` (embed atau upload)

**Files:**
- Create: `src/app/admin/modules/[id]/VideoField.tsx`

- [ ] **Step 1: Tulis komponen**

`src/app/admin/modules/[id]/VideoField.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const inputClass =
  "mt-2 w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-3 text-base transition-all duration-200 ease-out placeholder:text-ink-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function VideoField({ defaultValue = "" }: { defaultValue?: string }) {
  const isUploaded = defaultValue.startsWith("/uploads/");
  const [mode, setMode] = useState<"url" | "upload">(
    isUploaded ? "upload" : "url"
  );
  const [url, setUrl] = useState(isUploaded ? "" : defaultValue);
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
    }
  }

  const value = mode === "url" ? url : uploadedUrl;

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">
        Video (opsional)
      </span>
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
```

Perbaikan saat menulis file final: pindahkan `inputClass` ke atribut `className` pada `<input type="text">` mode URL (tambahkan `className={inputClass}`), atau hapus konstanta dan tulis class langsung di input seperti pada `Field.tsx`.

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/modules/[id]/VideoField.tsx"
git commit -m "feat: field video materi mode link/upload"
```

---

### Task 7: Integrasi ke `MaterialSection` + schema videoUrl

**Files:**
- Modify: `src/app/admin/modules/[id]/MaterialSection.tsx`
- Modify: `src/app/admin/modules/actions.ts:15-24` (materialSchema)

- [ ] **Step 1: Update materialSchema di `actions.ts`**

Ganti definisi `materialSchema` (baris 15-24) menjadi:

```ts
const videoUrlField = z
  .string()
  .trim()
  .refine(
    (v) =>
      v === "" ||
      v.startsWith("/uploads/") ||
      /^https?:\/\/.+/.test(v),
    "URL video tidak valid"
  );

const materialSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(3, "Judul materi minimal 3 karakter"),
  content: z.string().min(1, "Konten tidak boleh kosong"),
  videoUrl: videoUrlField.optional(),
});
```

Catatan: field `videoUrl` di form sekarang selalu terkirim (hidden input `VideoField`), jadi pemanggil `formData.get("videoUrl") || ""` di `createMaterial` dan `updateMaterial` tetap berfungsi tanpa perubahan.

- [ ] **Step 2: Update `EditMaterialForm` dan `CreateMaterialForm` di `MaterialSection.tsx`**

Tambahkan import:

```tsx
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { VideoField } from "./VideoField";
```

Hapus import `TextArea` dari `@/components/ui/Field` ( `TextField` tetap dipakai).

Di `EditMaterialForm`, ganti:

```tsx
<TextArea label="Konten" name="content" defaultValue={material.content} required />
<TextField
  label="URL video (opsional)"
  name="videoUrl"
  type="url"
  defaultValue={material.videoUrl ?? ""}
/>
```

menjadi:

```tsx
<RichTextEditor label="Konten" name="content" defaultValue={material.content} />
<VideoField defaultValue={material.videoUrl ?? ""} />
```

Di `CreateMaterialForm`, ganti:

```tsx
<TextArea label="Konten" name="content" required />
<TextField label="URL video (opsional)" name="videoUrl" type="url" />
```

menjadi:

```tsx
<RichTextEditor label="Konten" name="content" />
<VideoField />
```

- [ ] **Step 3: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/modules/[id]/MaterialSection.tsx" src/app/admin/modules/actions.ts
git commit -m "feat: materi pakai richtext editor + field video"
```

---

### Task 8: Actions soal — `questionId` di create, penjelasan lewat action sendiri

**Files:**
- Modify: `src/app/admin/modules/actions.ts`

- [ ] **Step 1: Perluas FormState**

Ganti (baris 26):

```ts
type FormState = { error?: string };
```

menjadi:

```ts
type FormState = { error?: string; ok?: boolean; questionId?: string };
```

- [ ] **Step 2: `createQuestion` return questionId**

Di `createQuestion`, ganti bagian create + return:

```ts
const question = await prisma.question.create({
  data: {
    moduleId: parsed.data.moduleId,
    section: "PRETEST",
    text: parsed.data.text,
    explanation: parsed.data.explanation || null,
    order: (last?.order ?? 0) + 1,
  },
});

revalidatePath(`/admin/modules/${parsed.data.moduleId}`);
return { ok: true, questionId: question.id };
```

(Potongan schema `questionCreateSchema` dan query `last` tidak berubah.)

- [ ] **Step 3: `updateQuestion` hanya update teks**

Ganti isi `updateQuestion` menjadi:

```ts
export async function updateQuestion(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const text = String(formData.get("text"));

  if (text.trim().length < 3) return { error: "Soal minimal 3 karakter" };

  await prisma.question.update({
    where: { id: questionId },
    data: { text },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
  return {};
}
```

Alasan: kalau tetap menulis `explanation: null` saat form edit tidak lagi mengirim field explanation, penjelasan tersimpan akan terhapus setiap kali teks soal disimpan.

- [ ] **Step 4: Tambah action `updateExplanation`**

Tambahkan setelah `updateQuestion`:

```ts
export async function updateExplanation(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const explanation = String(formData.get("explanation") || "").trim();

  await prisma.question.update({
    where: { id: questionId },
    data: { explanation: explanation || null },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
  return {};
}
```

- [ ] **Step 5: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/modules/actions.ts
git commit -m "feat: createQuestion balikin id + action updateExplanation"
```

---

### Task 9: Rework `QuestionSection` — FAB + modal + penjelasan di jawaban benar

**Files:**
- Modify: `src/app/admin/modules/[id]/QuestionSection.tsx` (rewrite penuh)

- [ ] **Step 1: Tulis ulang file dengan konten berikut**

```tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import type { Question, Option } from "@prisma/client";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  moveQuestion,
  addOption,
  setCorrectOption,
  deleteOption,
  updateExplanation,
} from "../actions";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return <span className="text-sm text-flag">{error}</span>;
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="size-3.5 shrink-0 transition-transform duration-200 ease-out"
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditQuestionForm({
  questionId,
  moduleId,
  initialText,
}: {
  questionId: string;
  moduleId: string;
  initialText: string;
}) {
  const [state, formAction] = useActionState(updateQuestion, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <TextArea
        label="Teks soal"
        name="text"
        defaultValue={initialText}
        required
        minLength={3}
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="secondary">Simpan Soal</SubmitButton>
        <ErrorNote error={state.error} />
      </div>
    </form>
  );
}

function ExplanationForm({
  questionId,
  moduleId,
  initialExplanation,
}: {
  questionId: string;
  moduleId: string;
  initialExplanation: string;
}) {
  const [state, formAction] = useActionState(updateExplanation, {});
  return (
    <form
      action={formAction}
      className="mt-2 space-y-2 rounded-md border border-accent-soft bg-accent-soft/60 p-3"
    >
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <TextArea
        label="Penjelasan jawaban benar (opsional)"
        name="explanation"
        defaultValue={initialExplanation}
        className="min-h-20"
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="secondary" className="px-4 py-2 text-sm">
          Simpan Penjelasan
        </SubmitButton>
        <ErrorNote error={state.error} />
      </div>
    </form>
  );
}

function AddOptionForm({
  questionId,
  moduleId,
}: {
  questionId: string;
  moduleId: string;
}) {
  const [state, formAction] = useActionState(addOption, {});
  return (
    <form action={formAction} className="flex items-end gap-2 pt-2">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <div className="flex-1">
        <label
          className="mb-1 block text-sm font-medium"
          htmlFor={`opt-${questionId}`}
        >
          Tambah opsi
        </label>
        <input
          id={`opt-${questionId}`}
          name="text"
          required
          className="w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <SubmitButton variant="secondary">Tambah</SubmitButton>
      <ErrorNote error={state.error} />
    </form>
  );
}

function DeleteOptionButton({
  optionId,
  moduleId,
}: {
  optionId: string;
  moduleId: string;
}) {
  const [state, formAction] = useActionState(deleteOption, {});
  return (
    <div className="flex items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="optionId" value={optionId} />
        <input type="hidden" name="moduleId" value={moduleId} />
        <ConfirmButton label="Hapus" className="px-3 py-1 text-xs" />
      </form>
      <ErrorNote error={state.error} />
    </div>
  );
}

export function QuestionSection({
  moduleId,
  questions,
}: {
  moduleId: string;
  questions: (Question & { options: Option[] })[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [createState, createFormAction] = useActionState(createQuestion, {});

  useEffect(() => {
    if (createState.ok && createState.questionId) {
      setModalOpen(false);
      setOpen((s) => ({ ...s, [createState.questionId as string]: true }));
    }
  }, [createState]);

  return (
    <section>
      <div className="mb-4 border-b border-hairline pb-2">
        <h2 className="text-h2 font-bold">Soal Ujian</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Satu set soal, dipakai untuk pretest dan posttest.
        </p>
      </div>

      <div className="mt-4 space-y-4 pb-20">
        {questions.length === 0 ? (
          <Card className="p-6 text-center text-[15px] text-ink-secondary">
            Belum ada soal. Klik tombol + di kanan bawah untuk menambah.
          </Card>
        ) : null}

        {questions.map((q, i) => {
          const expanded = open[q.id] ?? false;
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-ink-secondary">Soal {i + 1}</p>
                  <p className="mt-1 truncate text-[15px] font-medium">
                    {q.text}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-secondary">
                    {q.options.length} opsi
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <form action={moveQuestion}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <input type="hidden" name="direction" value="up" />
                    <Button
                      variant="ghost"
                      type="submit"
                      disabled={i === 0}
                      aria-label={`Naikkan urutan soal ${i + 1}`}
                    >
                      ↑
                    </Button>
                  </form>
                  <form action={moveQuestion}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <input type="hidden" name="direction" value="down" />
                    <Button
                      variant="ghost"
                      type="submit"
                      disabled={i === questions.length - 1}
                      aria-label={`Turunkan urutan soal ${i + 1}`}
                    >
                      ↓
                    </Button>
                  </form>
                  <form action={deleteQuestion}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="moduleId" value={moduleId} />
                    <ConfirmButton label="Hapus" />
                  </form>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen((s) => ({ ...s, [q.id]: !s[q.id] }))
                }
                className="mt-4 flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-accent hover:bg-canvas"
              >
                <span
                  className={`transition-transform duration-200 ease-out ${
                    expanded ? "rotate-180" : ""
                  }`}
                >
                  <Chevron />
                </span>
                {expanded ? "Tutup edit" : "Edit soal & opsi"}
              </button>

              {expanded ? (
                <div className="mt-3 space-y-3">
                  <EditQuestionForm
                    questionId={q.id}
                    moduleId={moduleId}
                    initialText={q.text}
                  />

                  <div className="space-y-2 border-t border-hairline pt-4">
                    {q.options.map((opt) => (
                      <div key={opt.id}>
                        <div
                          className={`flex items-center justify-between gap-2 border px-3 py-2 text-sm ${
                            opt.isCorrect
                              ? "border-accent bg-accent-soft/40"
                              : "border-hairline"
                          }`}
                        >
                          <span
                            className={
                              opt.isCorrect
                                ? "font-medium text-ink"
                                : "text-ink-secondary"
                            }
                          >
                            {opt.isCorrect ? "✓ " : ""}
                            {opt.text}
                          </span>
                          <div className="flex shrink-0 gap-1">
                            {!opt.isCorrect ? (
                              <form action={setCorrectOption}>
                                <input
                                  type="hidden"
                                  name="optionId"
                                  value={opt.id}
                                />
                                <input
                                  type="hidden"
                                  name="moduleId"
                                  value={moduleId}
                                />
                                <Button variant="ghost" type="submit">
                                  Jadikan benar
                                </Button>
                              </form>
                            ) : null}
                            <DeleteOptionButton
                              optionId={opt.id}
                              moduleId={moduleId}
                            />
                          </div>
                        </div>
                        {opt.isCorrect ? (
                          <ExplanationForm
                            questionId={q.id}
                            moduleId={moduleId}
                            initialExplanation={q.explanation ?? ""}
                          />
                        ) : null}
                      </div>
                    ))}

                    <AddOptionForm questionId={q.id} moduleId={moduleId} />
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="Tambah soal baru"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-all duration-200 ease-out hover:bg-accent-hover active:scale-95"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-6">
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
          onClick={() => setModalOpen(false)}
        >
          <Card className="w-full max-w-lg p-5">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-h2 font-bold">Soal baru</h3>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Tutup"
                  className="px-3"
                >
                  ✕
                </Button>
              </div>
              <form action={createFormAction} className="space-y-3">
                <input type="hidden" name="moduleId" value={moduleId} />
                <TextArea
                  label="Teks soal"
                  name="text"
                  required
                  minLength={3}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <SubmitButton pendingLabel="Menambah…">Tambah Soal</SubmitButton>
                  <ErrorNote error={createState.error} />
                </div>
              </form>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
```

Catatan: komponen `TextArea` dari `Field.tsx` tidak menerima `className` custom — saat menulis `ExplanationForm`, hapus prop `className="min-h-20"` dari `TextArea` (default `min-h-28` sudah cukup), ATAU tambahkan dukungan `className` di `Field.tsx` dengan mengubah `TextArea` menjadi:

```tsx
export function TextArea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  className?: string;
}) {
  return (
    <div>
      <Label htmlFor={props.id ?? props.name!}>{label}</Label>
      <textarea className={`${inputClass} min-h-28 ${className}`} {...props} />
    </div>
  );
}
```

Jika `Field.tsx` diubah, include dalam commit.

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/modules/[id]/QuestionSection.tsx" src/components/ui/Field.tsx
git commit -m "feat: fab + modal tambah soal, penjelasan nempel di jawaban benar"
```

---

### Task 10: Render materi HTML + video di halaman participant

**Files:**
- Modify: `src/app/p/page.tsx:9-14` (hapus youtubeEmbed lokal), `src/app/p/page.tsx:287-333` (section materi)

- [ ] **Step 1: Update import & hapus helper lokal**

Hapus fungsi `youtubeEmbed` (baris 9-14). Tambahkan import di bagian atas:

```tsx
import { videoEmbedUrl } from "@/lib/video";
import { sanitizeMaterialHtml } from "@/lib/sanitize";
```

- [ ] **Step 2: Update render materi**

Ganti isi `.map((m, i) => { ... })` pada section materi (baris 297-330) menjadi:

```tsx
.map((m, i) => {
  const embed = m.videoUrl ? videoEmbedUrl(m.videoUrl) : null;
  return (
    <article key={m.id} className="p-6">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[15px] font-semibold tabular-nums text-accent"
        >
          {String(i + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 w-full">
          <h3 className="text-[clamp(21px,2vw,29px)] font-semibold">{m.title}</h3>
          <div
            className="prose-gapensi mt-3 text-[16px] leading-relaxed text-ink-secondary"
            dangerouslySetInnerHTML={{
              __html: sanitizeMaterialHtml(m.content),
            }}
          />
          {m.videoUrl && embed ? (
            <div className="mt-6 aspect-video overflow-hidden rounded-md border border-hairline">
              <iframe
                src={embed}
                title={m.title}
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : null}
          {m.videoUrl && !embed ? (
            <video
              controls
              preload="metadata"
              src={m.videoUrl}
              className="mt-6 aspect-video w-full rounded-md border border-hairline"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
})
```

- [ ] **Step 3: Cek halaman lain yang render materi**

Run grep: `grep -rn "m.content\|videoUrl" src/app/j src/app/t src/app/exam`
Expected: tidak ada hasil (materi hanya dirender di `/p`). Jika ada, terapkan pola yang sama.

- [ ] **Step 4: Verifikasi build + test**

Run: `npm run build && npx vitest run`
Expected: build sukses, semua test pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/p/page.tsx
git commit -m "feat: render materi html tersanitasi + video embed/upload di dashboard peserta"
```

---

### Task 11: `NavigationProgress` — loading indicator global berlogo

**Files:**
- Create: `src/components/ui/NavigationProgress.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (keyframes fade)

- [ ] **Step 1: Tulis komponen**

`src/components/ui/NavigationProgress.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const TIMEOUT_MS = 10_000;

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;

      const samePage =
        url.pathname === location.pathname &&
        !url.search &&
        !location.search;
      if (samePage) return;

      setActive(true);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setActive(false);
  }, [pathname]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="animate-nav-fade fixed inset-0 z-[100] flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
    >
      <div className="relative size-16">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-hairline-strong border-t-accent" />
        <Image
          src="/favicon.png"
          alt=""
          width={28}
          height={28}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
        />
      </div>
    </div>
  );
}
```

Catatan: jika nanti ada `public/logo.png`, ganti `src="/favicon.png"` menjadi `src="/logo.png"`.

- [ ] **Step 2: Pasang di root layout**

`src/app/layout.tsx` — tambahkan import dan render di dalam `<body>`:

```tsx
import { NavigationProgress } from "@/components/ui/NavigationProgress";

<body>
  <NavigationProgress />
  {children}
</body>
```

- [ ] **Step 3: Tambah keyframes `nav-fade` di `globals.css`**

Tambahkan setelah blok `.animate-page-enter`:

```css
@keyframes nav-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-nav-fade {
  animation: nav-fade 0.15s ease-out both;
}
```

- [ ] **Step 4: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/NavigationProgress.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: loading indicator global tiap pindah halaman"
```

---

### Task 12: Background global pakai webp baru

**Files:**
- Modify: `src/components/ui/Backdrop.tsx:10`

- [ ] **Step 1: Ganti src image**

Di `src/components/ui/Backdrop.tsx`, ganti `src="/bg.jpg"` menjadi:

```tsx
src="/4ace03a7-27c8-45c6-a5f2-8e304e1d67f4.webp"
```

Komponen `Backdrop` dipakai di `src/app/p/page.tsx` dan `src/components/admin/AdminShell.tsx`, jadi perubahan ini otomatis berlaku di participant dan admin.

- [ ] **Step 2: Verifikasi build**

Run: `npm run build`
Expected: sukses.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Backdrop.tsx
git commit -m "chore: background global ganti ke webp baru"
```

---

### Task 13: Verifikasi manual end-to-end

**Files:** tidak ada (verifikasi runtime)

- [ ] **Step 1: Jalankan dev server**

Run: `npm run dev` (background)
Expected: server jalan di localhost:3000.

- [ ] **Step 2: Alur admin materi**

Buka `/admin/modules/cmt1cg9fg00121h4cftvyg0dp` (login admin bila diminta):
1. Edit materi → ketik teks, format bold/H2/list, sisipkan link → Simpan → refresh → format tetap.
2. Mode video "Link YouTube/Vimeo" → paste URL YouTube → Simpan → cek dashboard participant `/p` iframe muncul.
3. Mode video "Upload file" → upload mp4 kecil → path `/uploads/videos/...` muncul → Simpan → cek `/p` tag `<video>` muncul dan bisa diputar.
4. Upload file non-video → error "File harus berupa video" muncul, form tidak rusak.

- [ ] **Step 3: Alur admin soal**

1. Klik FAB `+` → modal muncul → isi teks soal → Tambah → modal tutup → card soal baru muncul expanded.
2. Tambah 2 opsi → klik "Jadikan benar" di salah satu → field penjelasan muncul di bawah opsi benar → isi → Simpan Penjelasan → refresh → penjelasan tetap ada.
3. Edit teks soal → Simpan → penjelasan TIDAK hilang (regresi updateQuestion).
4. Tutup modal via klik overlay dan tombol ✕.

- [ ] **Step 4: Alur loading indicator**

1. Dari `/p` klik link internal → overlay logo + spinner muncul sebentar → hilang saat halaman baru muncul.
2. Klik link `#anchor` (misal ke section materi) → overlay TIDAK muncul.
3. Buka link dengan Ctrl+click (tab baru) → overlay TIDAK muncul.

- [ ] **Step 5: Background**

Cek `/p` dan halaman admin → background pakai webp baru (visual sama seperti sebelumnya karena gambar sama, tapi network request menunjuk file webp).

- [ ] **Step 6: Full check**

Run: `npm run build && npx vitest run`
Expected: build sukses, semua test pass.

---

## Self-Review (sudah dicek)

- Spec coverage: richtext (Task 5,7), video embed+upload (Task 2,4,6,7), render participant (Task 10), FAB+modal (Task 9), penjelasan di jawaban benar (Task 8,9), loading indicator (Task 11), background webp (Task 12, tambahan user). Semua tercakup.
- Tipe konsisten: `videoEmbedUrl` (Task 2) dipakai Task 10; `FormState` baru (Task 8) dipakai Task 9; `sanitizeMaterialHtml` (Task 3) dipakai Task 10.
- Tanpa placeholder: semua langkah berisi kode lengkap atau perintah eksplisit.
