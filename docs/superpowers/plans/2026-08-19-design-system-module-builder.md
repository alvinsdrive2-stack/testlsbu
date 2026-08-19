# Design System + Modul Builder Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun design system Apple-like dan modul builder admin (CRUD soal MC, opsi, materi, settings) yang reusable untuk kegiatan.

**Architecture:** Next.js 15 App Router + Server Actions untuk semua mutasi. Setiap halaman admin pakai `AdminShell` (sidebar + konten satu kolom). Semua validasi input pakai zod di server action. Prisma 6 + MySQL.

**Tech Stack:** Next 15, React 19, Tailwind CSS 4 (via `@theme`), Prisma 6, zod, vitest.

**Design rules (dari frontend-design skill, wajib dipegang):**
- 1 layar = 1 pesan. Konten utama satu kolom, max-width terbatas.
- Deference: UI diem, konten jadi utama. Netral (putih/abu) + accent navy `#002B66` hanya untuk aksi/status, bukan dekorasi. Kuning emas `#FFC107` hanya untuk highlight/status aktif — jangan dipakai dekorasi atau teks besar (kontras rendah di putih).
- Typo: system-ui stack, heading besar & pendek, hierarki lewat ukuran + whitespace, bukan warna.
- Shadow/garis minimal — hanya untuk pemisahan hierarki yang jelas.
- CTA utama 1 per layar, teks singkat kata kerja ("Simpan", "Tambah Soal").

**Prasyarat sebelum Task 1:**
- MySQL jalan, `DATABASE_URL` di `.env` benar.
- Jalankan migrasi awal:

```bash
npx prisma migrate dev --name init
```

Expected: tabel `Module`, `Question`, `Option`, `Material`, `Activity`, `Participant`, `Attempt`, `Answer` terbuat.

---

### Task 1: Install dependency + design tokens global

**Files:**
- Modify: `package.json` (via npm)
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install zod & vitest**

```bash
npm install zod
npm install -D vitest
```

- [ ] **Step 2: Tulis design tokens di globals.css**

Ganti seluruh isi `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-accent: #002b66;
  --color-accent-hover: #003366;
  --color-highlight: #ffc107;
  --color-highlight-hover: #d99b00;
  --color-surface: #ffffff;
  --color-canvas: #f8f9fa;
  --color-ink: #212529;
  --color-ink-secondary: #6c757d;
  --color-hairline: #e9ecef;

  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;

  --text-hero: clamp(28px, 3vw, 40px);
  --text-h1: 24px;
  --text-h2: 18px;
  --text-body: 15px;

  --radius-card: 16px;
}

body {
  font-family: var(--font-sans);
  color: var(--color-ink);
  background: var(--color-canvas);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Update layout.tsx — font & metadata**

Ganti isi `src/app/layout.tsx` (hapus Geist font bawaan, pakai system stack):

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gapensi Ujian",
  description: "Platform ujian pelatihan Gapensi",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verifikasi build**

```bash
npx next build
```

Expected: build sukses, tidak ada error.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: design tokens global gaya apple-like"
```

---

### Task 2: Komponen UI dasar (Button, Card, Field)

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Field.tsx`

- [ ] **Step 1: Button**

```tsx
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover disabled:opacity-40",
  secondary:
    "bg-white text-ink border border-hairline hover:bg-canvas disabled:opacity-40",
  ghost: "text-accent hover:bg-canvas disabled:opacity-40",
  danger: "bg-white text-red-600 border border-hairline hover:bg-red-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Card**

```tsx
import { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-hairline bg-surface ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 3: Field (label + kontrol satu baris)**

```tsx
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-accent";

export function TextField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <Label htmlFor={props.id ?? props.name!}>{label}</Label>
      <input className={inputClass} {...props} />
    </div>
  );
}

export function TextArea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <Label htmlFor={props.id ?? props.name!}>{label}</Label>
      <textarea className={`${inputClass} min-h-24`} {...props} />
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: tidak ada error.

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "feat: komponen ui dasar button card field"
```

---

### Task 3: AdminShell — layout admin (sidebar + satu kolom konten)

**Files:**
- Create: `src/components/admin/AdminShell.tsx`
- Create: `src/app/admin/actions.ts` (logout)

- [ ] **Step 1: Logout action**

```tsx
"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession } from "@/lib/session";

export async function logout() {
  await destroyAdminSession();
  redirect("/admin/login");
}
```

- [ ] **Step 2: AdminShell**

```tsx
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/modules", label: "Modul" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-surface p-6 md:flex">
        <p className="mb-8 text-lg font-semibold">Gapensi</p>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-canvas hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-auto">
          <Button variant="ghost" type="submit" className="px-0">
            Keluar
          </Button>
        </form>
      </aside>
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-[var(--text-hero)] font-semibold tracking-tight">
            {title}
          </h1>
          <div className="mt-8 space-y-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Pakai AdminShell di dashboard admin**

Ganti isi `src/app/admin/page.tsx`:

```tsx
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminDashboardPage() {
  return (
    <AdminShell title="Dashboard">
      <Link
        href="/admin/modules"
        className="block rounded-[var(--radius-card)] border border-hairline bg-surface p-6 hover:bg-canvas"
      >
        <p className="text-h2 font-semibold">Modul</p>
        <p className="mt-1 text-sm text-ink-secondary">
          Kelola soal, materi, dan pengaturan ujian.
        </p>
      </Link>
    </AdminShell>
  );
}
```

- [ ] **Step 4: Cek di browser**

```bash
npm run dev
```

Buka http://localhost:3000/admin → login → dashboard tampil dengan sidebar. Pastikan logout jalan.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin src/app/admin
git commit -m "feat: admin shell dengan sidebar dan logout"
```

---

### Task 4: Skema zod + halaman daftar modul + buat modul

**Files:**
- Create: `src/lib/schemas.ts`
- Create: `src/app/admin/modules/actions.ts`
- Create: `src/app/admin/modules/page.tsx`

- [ ] **Step 1: Skema zod**

```ts
import { z } from "zod";

export const moduleCreateSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
});

export const moduleSettingsSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  shuffleQuestions: z.coerce.boolean().default(false),
  shuffleOptions: z.coerce.boolean().default(false),
  pretestDurationMin: z.coerce.number().int().min(1).max(480),
  posttestDurationMin: z.coerce.number().int().min(1).max(480),
  pretestPassingGrade: z.coerce.number().int().min(0).max(100),
  posttestPassingGrade: z.coerce.number().int().min(0).max(100),
});
```

- [ ] **Step 2: Server action buat modul**

```tsx
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { moduleCreateSchema } from "@/lib/schemas";

export async function createModule(formData: FormData) {
  const parsed = moduleCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const module = await prisma.module.create({
    data: { title: parsed.data.title, description: parsed.data.description },
  });

  revalidatePath("/admin/modules");
  redirect(`/admin/modules/${module.id}`);
}
```

- [ ] **Step 3: Halaman daftar modul**

```tsx
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { TextField, TextArea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { createModule } from "./actions";

export default async function ModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  return (
    <AdminShell title="Modul">
      <Card className="p-6">
        <p className="text-h2 font-semibold">Modul baru</p>
        <form action={createModule} className="mt-4 space-y-4">
          <TextField label="Judul" name="title" required minLength={3} />
          <TextArea label="Deskripsi (opsional)" name="description" />
          <Button type="submit">Buat Modul</Button>
        </form>
      </Card>

      {modules.length > 0 ? (
        <div className="space-y-3">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={`/admin/modules/${m.id}`}
              className="block rounded-[var(--radius-card)] border border-hairline bg-surface p-5 hover:bg-canvas"
            >
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-ink-secondary">
                {m._count.questions} soal
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">
          Belum ada modul. Buat modul pertama di atas.
        </p>
      )}
    </AdminShell>
  );
}
```

- [ ] **Step 4: Cek di browser**

Buat satu modul, expected: redirect ke `/admin/modules/[id]` (404 dulu — halaman builder dibuat di Task 5). Daftar modul menampilkan modul baru setelah kembali ke `/admin/modules`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/schemas.ts src/app/admin/modules
git commit -m "feat: daftar modul dan aksi buat modul"
```

---

### Task 5: Halaman builder modul — settings

**Files:**
- Modify: `src/app/admin/modules/actions.ts`
- Create: `src/app/admin/modules/[id]/page.tsx`
- Create: `src/app/admin/modules/[id]/SettingsForm.tsx`

- [ ] **Step 1: Tambah action updateSettings di actions.ts**

Append ke `src/app/admin/modules/actions.ts`:

```tsx
import { moduleSettingsSchema } from "@/lib/schemas";

export async function updateModuleSettings(formData: FormData) {
  const parsed = moduleSettingsSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    shuffleQuestions: formData.get("shuffleQuestions") === "on",
    shuffleOptions: formData.get("shuffleOptions") === "on",
    pretestDurationMin: formData.get("pretestDurationMin"),
    posttestDurationMin: formData.get("posttestDurationMin"),
    pretestPassingGrade: formData.get("pretestPassingGrade"),
    posttestPassingGrade: formData.get("posttestPassingGrade"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { moduleId, ...data } = parsed.data;

  await prisma.module.update({ where: { id: moduleId }, data });

  revalidatePath(`/admin/modules/${moduleId}`);
}
```

(Gabungkan import `moduleSettingsSchema` dengan import zod yang sudah ada di atas file.)

- [ ] **Step 2: SettingsForm (client component untuk toggle)**

```tsx
"use client";

import { useState } from "react";
import { updateModuleSettings } from "../actions";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type Settings = {
  id: string;
  title: string;
  description: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  pretestDurationMin: number;
  posttestDurationMin: number;
  pretestPassingGrade: number;
  posttestPassingGrade: number;
};

export function SettingsForm({ module }: { module: Settings }) {
  const [sq, setSq] = useState(module.shuffleQuestions);
  const [so, setSo] = useState(module.shuffleOptions);

  return (
    <Card className="p-6">
      <p className="text-h2 font-semibold">Pengaturan Ujian</p>
      <form action={updateModuleSettings} className="mt-4 space-y-4">
        <input type="hidden" name="moduleId" value={module.id} />
        <TextField
          label="Judul"
          name="title"
          defaultValue={module.title}
          required
          minLength={3}
        />
        <TextField
          label="Deskripsi"
          name="description"
          defaultValue={module.description ?? ""}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Durasi pretest (menit)"
            name="pretestDurationMin"
            type="number"
            min={1}
            max={480}
            defaultValue={module.pretestDurationMin}
          />
          <TextField
            label="Durasi posttest (menit)"
            name="posttestDurationMin"
            type="number"
            min={1}
            max={480}
            defaultValue={module.posttestDurationMin}
          />
          <TextField
            label="Passing grade pretest"
            name="pretestPassingGrade"
            type="number"
            min={0}
            max={100}
            defaultValue={module.pretestPassingGrade}
          />
          <TextField
            label="Passing grade posttest"
            name="posttestPassingGrade"
            type="number"
            min={0}
            max={100}
            defaultValue={module.posttestPassingGrade}
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="shuffleQuestions"
              checked={sq}
              onChange={(e) => setSq(e.target.checked)}
              className="size-4 accent-[#002b66]"
            />
            Acak urutan soal
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="shuffleOptions"
              checked={so}
              onChange={(e) => setSo(e.target.checked)}
              className="size-4 accent-[#002b66]"
            />
            Acak urutan opsi jawaban
          </label>
        </div>
        <Button type="submit">Simpan</Button>
      </form>
    </Card>
  );
}
```

- [ ] **Step 3: Halaman builder (placeholder bagian soal & materi dulu)**

```tsx
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export default async function ModuleBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const module = await prisma.module.findUnique({ where: { id } });

  if (!module) notFound();

  return (
    <AdminShell title={module.title}>
      <SettingsForm module={module} />
    </AdminShell>
  );
}
```

- [ ] **Step 4: Cek di browser**

Ubah durasi → Simpan → refresh → nilai bertahan.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/modules
git commit -m "feat: form pengaturan modul durasi passing grade shuffle"
```

---

### Task 6: CRUD soal PRETEST/POSTTEST

**Files:**
- Modify: `src/app/admin/modules/actions.ts`
- Create: `src/app/admin/modules/[id]/QuestionSection.tsx`

- [ ] **Step 1: Tambah action soal di actions.ts**

Append ke `src/app/admin/modules/actions.ts`:

```tsx
import { z } from "zod";

const questionCreateSchema = z.object({
  moduleId: z.string().min(1),
  section: z.enum(["PRETEST", "POSTTEST"]),
  text: z.string().min(3, "Soal minimal 3 karakter"),
});

export async function createQuestion(formData: FormData) {
  const parsed = questionCreateSchema.safeParse({
    moduleId: formData.get("moduleId"),
    section: formData.get("section"),
    text: formData.get("text"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const last = await prisma.question.findFirst({
    where: { moduleId: parsed.data.moduleId, section: parsed.data.section },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.question.create({
    data: {
      moduleId: parsed.data.moduleId,
      section: parsed.data.section,
      text: parsed.data.text,
      order: (last?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/admin/modules/${parsed.data.moduleId}`);
}

export async function updateQuestionText(formData: FormData) {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const text = String(formData.get("text"));

  if (text.trim().length < 3) throw new Error("Soal minimal 3 karakter");

  await prisma.question.update({ where: { id: questionId }, data: { text } });

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function deleteQuestion(formData: FormData) {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return;

  await prisma.question.delete({ where: { id: questionId } });

  const remaining = await prisma.question.findMany({
    where: { moduleId, section: question.section },
    orderBy: { order: "asc" },
  });

  let order = 1;
  for (const q of remaining) {
    await prisma.question.update({ where: { id: q.id }, data: { order } });
    order++;
  }

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function moveQuestion(formData: FormData) {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const direction = String(formData.get("direction")) as "up" | "down";

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return;

  const siblings = await prisma.question.findMany({
    where: { moduleId, section: question.section },
    orderBy: { order: "asc" },
  });

  const index = siblings.findIndex((q) => q.id === questionId);
  const swapWith = direction === "up" ? index - 1 : index + 1;

  if (swapWith < 0 || swapWith >= siblings.length) return;

  const reordered = [...siblings];
  [reordered[index], reordered[swapWith]] = [
    reordered[swapWith],
    reordered[index],
  ];

  let order = 1;
  for (const q of reordered) {
    await prisma.question.update({ where: { id: q.id }, data: { order } });
    order++;
  }

  revalidatePath(`/admin/modules/${moduleId}`);
}
```

(Gabungkan semua import zod/prisma/revalidatePath jadi satu blok di atas file — jangan duplikat.)

- [ ] **Step 2: QuestionSection component**

```tsx
import { createQuestion, updateQuestionText, deleteQuestion, moveQuestion } from "../actions";
import { Card } from "@/components/ui/Card";
import { TextArea, TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Question, Option } from "@/generated/prisma/client";

type Section = "PRETEST" | "POSTTEST";

export function QuestionSection({
  moduleId,
  section,
  questions,
}: {
  moduleId: string;
  section: Section;
  questions: (Question & { options: Option[] })[];
}) {
  const title = section === "PRETEST" ? "Soal Pretest" : "Soal Posttest";

  return (
    <section>
      <h2 className="text-h1 font-semibold">{title}</h2>

      <div className="mt-4 space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-ink-secondary">Soal {i + 1}</p>
              <div className="flex gap-1">
                <form action={moveQuestion}>
                  <input type="hidden" name="questionId" value={q.id} />
                  <input type="hidden" name="moduleId" value={moduleId} />
                  <input type="hidden" name="direction" value="up" />
                  <Button variant="ghost" type="submit" disabled={i === 0}>
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
                  >
                    ↓
                  </Button>
                </form>
                <form action={deleteQuestion}>
                  <input type="hidden" name="questionId" value={q.id} />
                  <input type="hidden" name="moduleId" value={moduleId} />
                  <Button variant="danger" type="submit">
                    Hapus
                  </Button>
                </form>
              </div>
            </div>

            <form action={updateQuestionText} className="mt-2 space-y-3">
              <input type="hidden" name="questionId" value={q.id} />
              <input type="hidden" name="moduleId" value={moduleId} />
              <TextArea
                label="Teks soal"
                name="text"
                defaultValue={q.text}
                required
                minLength={3}
              />
              <Button variant="secondary" type="submit">
                Simpan Soal
              </Button>
            </form>

            <div className="mt-4 space-y-2 border-t border-hairline pt-4">
              {q.options.map((opt) => (
                <p
                  key={opt.id}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    opt.isCorrect
                      ? "bg-accent/10 font-medium text-ink"
                      : "text-ink-secondary"
                  }`}
                >
                  {opt.isCorrect ? "✓ " : ""}
                  {opt.text}
                </p>
              ))}
              {q.options.length === 0 ? (
                <p className="text-sm text-ink-secondary">
                  Belum ada opsi jawaban.
                </p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <form action={createQuestion} className="space-y-3">
          <input type="hidden" name="moduleId" value={moduleId} />
          <input type="hidden" name="section" value={section} />
          <TextArea
            label="Tambah soal baru"
            name="text"
            required
            minLength={3}
          />
          <Button type="submit">Tambah Soal</Button>
        </form>
      </Card>
    </section>
  );
}
```

- [ ] **Step 3: Render di halaman builder**

Modify `src/app/admin/modules/[id]/page.tsx` — query questions + render section:

```tsx
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { QuestionSection } from "./QuestionSection";

export default async function ModuleBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      questions: {
        where: {},
        orderBy: { order: "asc" },
        include: { options: true },
      },
    },
  });

  if (!module) notFound();

  const pretest = module.questions.filter((q) => q.section === "PRETEST");
  const posttest = module.questions.filter((q) => q.section === "POSTTEST");

  return (
    <AdminShell title={module.title}>
      <SettingsForm module={module} />
      <QuestionSection moduleId={module.id} section="PRETEST" questions={pretest} />
      <QuestionSection moduleId={module.id} section="POSTTEST" questions={posttest} />
    </AdminShell>
  );
}
```

- [ ] **Step 4: Cek di browser**

Tambah 2 soal pretest + 1 soal posttest, reorder ↑↓, hapus satu. Expected: urutan konsisten setelah refresh.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/modules
git commit -m "feat: crud soal pretest posttest dengan reorder"
```

---

### Task 7: CRUD opsi jawaban + tandai benar

**Files:**
- Modify: `src/app/admin/modules/actions.ts`
- Modify: `src/app/admin/modules/[id]/QuestionSection.tsx`
- Test: `src/lib/__tests__/correctOption.test.ts` — tidak berlaku (logic di DB). Skip unit test, verifikasi via browser.

- [ ] **Step 1: Tambah action opsi di actions.ts**

Append:

```tsx
export async function addOption(formData: FormData) {
  const questionId = String(formData.get("questionId"));
  const moduleId = String(formData.get("moduleId"));
  const text = String(formData.get("text"));

  if (text.trim().length < 1) throw new Error("Opsi tidak boleh kosong");

  await prisma.option.create({
    data: {
      questionId,
      text,
      isCorrect: false,
    },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function setCorrectOption(formData: FormData) {
  const optionId = String(formData.get("optionId"));
  const moduleId = String(formData.get("moduleId"));

  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: { question: true },
  });
  if (!option) return;

  await prisma.$transaction([
    prisma.option.updateMany({
      where: { questionId: option.questionId },
      data: { isCorrect: false },
    }),
    prisma.option.update({
      where: { id: optionId },
      data: { isCorrect: true },
    }),
  ]);

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function deleteOption(formData: FormData) {
  const optionId = String(formData.get("optionId"));
  const moduleId = String(formData.get("moduleId"));

  await prisma.option.delete({ where: { id: optionId } });

  revalidatePath(`/admin/modules/${moduleId}`);
}
```

- [ ] **Step 2: Render opsi interaktif di QuestionSection**

Ganti blok `<div className="mt-4 space-y-2 border-t border-hairline pt-4">` dan isinya dengan:

```tsx
import { addOption, setCorrectOption, deleteOption } from "../actions";

// ...di dalam card soal:
<div className="mt-4 space-y-2 border-t border-hairline pt-4">
  {q.options.map((opt) => (
    <div
      key={opt.id}
      className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm"
    >
      <span className={opt.isCorrect ? "font-medium text-ink" : "text-ink-secondary"}>
        {opt.isCorrect ? "✓ " : ""}
        {opt.text}
      </span>
      <div className="flex shrink-0 gap-1">
        {!opt.isCorrect ? (
          <form action={setCorrectOption}>
            <input type="hidden" name="optionId" value={opt.id} />
            <input type="hidden" name="moduleId" value={moduleId} />
            <Button variant="ghost" type="submit">
              Jadikan benar
            </Button>
          </form>
        ) : null}
        <form action={deleteOption}>
          <input type="hidden" name="optionId" value={opt.id} />
          <input type="hidden" name="moduleId" value={moduleId} />
          <Button variant="ghost" type="submit">
            Hapus
          </Button>
        </form>
      </div>
    </div>
  ))}

  <form action={addOption} className="flex items-end gap-2 pt-2">
    <input type="hidden" name="questionId" value={q.id} />
    <input type="hidden" name="moduleId" value={moduleId} />
    <div className="flex-1">
      <label className="mb-1 block text-sm font-medium" htmlFor={`opt-${q.id}`}>
        Tambah opsi
      </label>
      <input
        id={`opt-${q.id}`}
        name="text"
        required
        className="w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
    <Button variant="secondary" type="submit">
      Tambah
    </Button>
  </form>
</div>
```

- [ ] **Step 3: Cek di browser**

Tambah 4 opsi di satu soal, jadikan satu benar, hapus satu opsi lain. Expected: maksimal satu opsi bertanda ✓.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/modules
git commit -m "feat: crud opsi jawaban dan tandai jawaban benar"
```

---

### Task 8: CRUD materi

**Files:**
- Modify: `src/app/admin/modules/actions.ts`
- Create: `src/app/admin/modules/[id]/MaterialSection.tsx`
- Modify: `src/app/admin/modules/[id]/page.tsx`

- [ ] **Step 1: Tambah action materi di actions.ts**

Append:

```tsx
const materialSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(3, "Judul materi minimal 3 karakter"),
  content: z.string().min(1, "Konten tidak boleh kosong"),
  videoUrl: z
    .string()
    .url("URL video tidak valid")
    .optional()
    .or(z.literal("")),
});

export async function createMaterial(formData: FormData) {
  const parsed = materialSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl") || "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { moduleId, videoUrl, ...data } = parsed.data;

  const last = await prisma.material.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.material.create({
    data: { ...data, moduleId, videoUrl: videoUrl || null, order: (last?.order ?? 0) + 1 },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function updateMaterial(formData: FormData) {
  const materialId = String(formData.get("materialId"));
  const moduleId = String(formData.get("moduleId"));

  const parsed = materialSchema.safeParse({
    moduleId,
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl") || "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const { videoUrl, ...data } = parsed.data;

  await prisma.material.update({
    where: { id: materialId },
    data: { ...data, videoUrl: videoUrl || null },
  });

  revalidatePath(`/admin/modules/${moduleId}`);
}

export async function deleteMaterial(formData: FormData) {
  const materialId = String(formData.get("materialId"));
  const moduleId = String(formData.get("moduleId"));

  await prisma.material.delete({ where: { id: materialId } });

  revalidatePath(`/admin/modules/${moduleId}`);
}
```

- [ ] **Step 2: MaterialSection component**

```tsx
import { createMaterial, updateMaterial, deleteMaterial } from "../actions";
import { Card } from "@/components/ui/Card";
import { TextArea, TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Material } from "@/generated/prisma/client";

export function MaterialSection({
  moduleId,
  materials,
}: {
  moduleId: string;
  materials: Material[];
}) {
  return (
    <section>
      <h2 className="text-h1 font-semibold">Materi</h2>

      <div className="mt-4 space-y-4">
        {materials.map((m, i) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-secondary">Materi {i + 1}</p>
              <form action={deleteMaterial}>
                <input type="hidden" name="materialId" value={m.id} />
                <input type="hidden" name="moduleId" value={moduleId} />
                <Button variant="danger" type="submit">
                  Hapus
                </Button>
              </form>
            </div>
            <form action={updateMaterial} className="mt-2 space-y-3">
              <input type="hidden" name="materialId" value={m.id} />
              <input type="hidden" name="moduleId" value={moduleId} />
              <TextField label="Judul" name="title" defaultValue={m.title} required minLength={3} />
              <TextArea label="Konten" name="content" defaultValue={m.content} required />
              <TextField
                label="URL video (opsional)"
                name="videoUrl"
                type="url"
                defaultValue={m.videoUrl ?? ""}
              />
              <Button variant="secondary" type="submit">
                Simpan Materi
              </Button>
            </form>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <form action={createMaterial} className="space-y-3">
          <input type="hidden" name="moduleId" value={moduleId} />
          <TextField label="Judul materi baru" name="title" required minLength={3} />
          <TextArea label="Konten" name="content" required />
          <TextField label="URL video (opsional)" name="videoUrl" type="url" />
          <Button type="submit">Tambah Materi</Button>
        </form>
      </Card>
    </section>
  );
}
```

- [ ] **Step 3: Query + render materi di page.tsx**

Tambahkan `materials: { orderBy: { order: "asc" } }` ke `include` prisma di `page.tsx`, lalu render di bawah QuestionSection POSTTEST:

```tsx
import { MaterialSection } from "./MaterialSection";

// setelah <QuestionSection ... POSTTEST ... />:
<MaterialSection moduleId={module.id} materials={module.materials} />
```

- [ ] **Step 4: Cek di browser**

Tambah 2 materi (satu dengan videoUrl YouTube), edit judul, hapus satu.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/modules
git commit -m "feat: crud materi dengan video opsional"
```

---

### Task 9: Bersihkan scaffold bawaan + verifikasi akhir

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `README.md`

- [ ] **Step 1: Ganti halaman root jadi redirect**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/admin/login");
}
```

- [ ] **Step 2: Full check**

```bash
npx tsc --noEmit && npx next build
```

Expected: sukses tanpa error.

- [ ] **Step 3: Smoke test manual lengkap**

`npm run dev`, lalu: login → buat modul → isi settings → tambah 3 soal pretest + 3 soal posttest + opsi (1 benar tiap soal) + 1 materi dengan video → reorder soal → simpan semua → refresh → semua data bertahan.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: selesai modul builder admin"
```

---

## Plan berikutnya (di luar scope plan ini)

- **Plan 2:** Kegiatan (Activity) — buat dari modul, kontrol status, link join, link posttest per peserta, monitoring tabel peserta.
- **Plan 3:** Flow peserta — pendaftaran `/j/[activityId]`, engine ujian (timer, autosave, submit, scoring, shuffle seeded), dashboard peserta, posttest retry.
