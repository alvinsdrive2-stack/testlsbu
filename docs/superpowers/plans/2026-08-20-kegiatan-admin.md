# Kegiatan (Activity) Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin dapat membuat kegiatan dari modul, mengontrol status (pretest → posttest → tutup), melihat link join + link posttest per peserta, dan memantau tabel peserta.

**Architecture:** Next.js 15 App Router + Server Actions. Kegiatan mereferensikan modul (relasi, bukan snapshot). Link join = `/j/[activityId]`, link posttest peserta = `/t/[participantToken]` (halamannya dibuat di Plan 3; admin copy link duluan).

**Tech Stack:** sama seperti Plan 1 (Next 15, Tailwind 4 tokens, Prisma 6, zod).

**Design rules:** sama seperti Plan 1 — netral + navy untuk aksi, 1 CTA utama per layar, tabel monitoring pakai garis hairline tipis, tanpa dekorasi.

---

### Task 1: Actions kegiatan

**Files:**
- Create: `src/app/admin/activities/actions.ts`

- [ ] Step 1: Tulis actions

```tsx
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const activityCreateSchema = z.object({
  moduleId: z.string().min(1, "Pilih modul"),
  title: z.string().min(3, "Judul minimal 3 karakter"),
});

export async function createActivity(formData: FormData) {
  const parsed = activityCreateSchema.safeParse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }

  const activity = await prisma.activity.create({
    data: { moduleId: parsed.data.moduleId, title: parsed.data.title },
  });

  revalidatePath("/admin/activities");
  redirect(`/admin/activities/${activity.id}`);
}

const NEXT_STATUS: Record<string, "POSTTEST_OPEN" | "CLOSED"> = {
  PRETEST_OPEN: "POSTTEST_OPEN",
  POSTTEST_OPEN: "CLOSED",
};

export async function advanceActivityStatus(formData: FormData) {
  const activityId = String(formData.get("activityId"));

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) return;

  const next = NEXT_STATUS[activity.status];
  if (!next) return; // CLOSED = terminal

  await prisma.activity.update({ where: { id: activityId }, data: { status: next } });

  revalidatePath(`/admin/activities/${activityId}`);
  revalidatePath("/admin/activities");
}

export async function deleteActivity(formData: FormData) {
  const activityId = String(formData.get("activityId"));

  await prisma.activity.delete({ where: { id: activityId } });

  revalidatePath("/admin/activities");
  redirect("/admin/activities");
}
```

- [ ] Step 2: Type-check: `npx tsc --noEmit` — pass.
- [ ] Step 3: Commit: `git add src/app/admin/activities && git commit -m "feat: aksi kegiatan buat status maju hapus"`

---

### Task 2: Halaman daftar kegiatan + nav

**Files:**
- Create: `src/app/admin/activities/page.tsx`
- Modify: `src/components/admin/AdminShell.tsx` (nav + item "Kegiatan" → `/admin/activities`)

- [ ] Step 1: Halaman daftar

```tsx
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { createActivity } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  PRETEST_OPEN: "Pretest dibuka",
  POSTTEST_OPEN: "Posttest dibuka",
  CLOSED: "Ditutup",
};

export default async function ActivitiesPage() {
  const [modules, activities] = await Promise.all([
    prisma.module.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        module: { select: { title: true } },
        _count: { select: { participants: true } },
      },
    }),
  ]);

  return (
    <AdminShell title="Kegiatan">
      <Card className="p-6">
        <p className="text-h2 font-semibold">Kegiatan baru</p>
        {modules.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Buat modul dulu di menu Modul.
          </p>
        ) : (
          <form action={createActivity} className="mt-4 space-y-4">
            <div>
              <label htmlFor="moduleId" className="mb-1 block text-sm font-medium">
                Modul
              </label>
              <select
                id="moduleId"
                name="moduleId"
                required
                className="w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <TextField label="Judul kegiatan" name="title" required minLength={3} />
            <Button type="submit">Buat Kegiatan</Button>
          </form>
        )}
      </Card>

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((a) => (
            <Link
              key={a.id}
              href={`/admin/activities/${a.id}`}
              className="block rounded-[var(--radius-card)] border border-hairline bg-surface p-5 hover:bg-canvas"
            >
              <p className="font-semibold">{a.title}</p>
              <p className="text-sm text-ink-secondary">
                {a.module.title} · {STATUS_LABEL[a.status]} ·{" "}
                {a._count.participants} peserta
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">Belum ada kegiatan.</p>
      )}
    </AdminShell>
  );
}
```

- [ ] Step 2: AdminShell — tambah `{ href: "/admin/activities", label: "Kegiatan" }` setelah Modul di array `nav`.

- [ ] Step 3: Verify `npx tsc --noEmit` + commit `git commit -m "feat: daftar kegiatan dan buat kegiatan dari modul"`

---

### Task 3: Detail kegiatan — kontrol status + link + monitoring

**Files:**
- Create: `src/app/admin/activities/[id]/CopyLink.tsx`
- Create: `src/app/admin/activities/[id]/page.tsx`

- [ ] Step 1: CopyLink (client, copy ke clipboard)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate font-mono text-xs text-ink-secondary">{path}</p>
      </div>
      <Button variant="secondary" type="button" onClick={copy}>
        {copied ? "Tersalin" : "Salin Link"}
      </Button>
    </div>
  );
}
```

- [ ] Step 2: Halaman detail

```tsx
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { advanceActivityStatus, deleteActivity } from "../actions";
import { CopyLink } from "./CopyLink";

const STATUS_LABEL: Record<string, string> = {
  PRETEST_OPEN: "Pretest dibuka",
  POSTTEST_OPEN: "Posttest dibuka",
  CLOSED: "Ditutup",
};

const NEXT_ACTION_LABEL: Record<string, string> = {
  PRETEST_OPEN: "Buka Posttest",
  POSTTEST_OPEN: "Tutup Kegiatan",
};

const STAGE_LABEL: Record<string, string> = {
  REGISTERED: "Terdaftar",
  PRETEST_DONE: "Pretest selesai",
  POSTTEST_PASSED: "Lulus posttest",
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      module: true,
      participants: {
        orderBy: { createdAt: "asc" },
        include: {
          attempts: { select: { section: true, score: true, passed: true } },
        },
      },
    },
  });

  if (!activity) notFound();

  const joinPath = `/j/${activity.id}`;
  const nextAction = NEXT_ACTION_LABEL[activity.status];

  return (
    <AdminShell title={activity.title}>
      <Card className="p-6">
        <p className="text-sm text-ink-secondary">
          Modul: {activity.module.title}
        </p>
        <p className="mt-1 text-h2 font-semibold">
          Status: {STATUS_LABEL[activity.status]}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {nextAction ? (
            <form action={advanceActivityStatus}>
              <input type="hidden" name="activityId" value={activity.id} />
              <Button type="submit">{nextAction}</Button>
            </form>
          ) : null}
          <form action={deleteActivity}>
            <input type="hidden" name="activityId" value={activity.id} />
            <Button variant="danger" type="submit">
              Hapus Kegiatan
            </Button>
          </form>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <p className="text-h2 font-semibold">Link</p>
        <CopyLink path={joinPath} label="Link pendaftaran peserta (pretest)" />
        {activity.status === "POSTTEST_OPEN" ? (
          <div className="space-y-2 border-t border-hairline pt-4">
            <p className="text-sm font-medium">
              Link posttest per peserta
            </p>
            {activity.participants.length === 0 ? (
              <p className="text-sm text-ink-secondary">
                Belum ada peserta terdaftar.
              </p>
            ) : (
              activity.participants.map((p) => (
                <CopyLink
                  key={p.id}
                  path={`/t/${p.token}`}
                  label={p.nama}
                />
              ))
            )}
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <p className="text-h2 font-semibold">Peserta</p>
        {activity.participants.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Belum ada peserta terdaftar.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-ink-secondary">
                  <th className="py-2 pr-4 font-medium">Nama</th>
                  <th className="py-2 pr-4 font-medium">Badan Usaha</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Nilai Pretest</th>
                  <th className="py-2 pr-4 font-medium">Posttest Terbaik</th>
                </tr>
              </thead>
              <tbody>
                {activity.participants.map((p) => {
                  const pretest = p.attempts
                    .filter((a) => a.section === "PRETEST" && a.score !== null)
                    .map((a) => a.score!);
                  const pretestScore = pretest.length ? Math.max(...pretest) : null;
                  const postPassed = p.attempts
                    .filter((a) => a.section === "POSTTEST" && a.passed)
                    .map((a) => a.score!);
                  const postBest = postPassed.length ? Math.max(...postPassed) : null;

                  return (
                    <tr key={p.id} className="border-b border-hairline">
                      <td className="py-2 pr-4">{p.nama}</td>
                      <td className="py-2 pr-4 text-ink-secondary">
                        {p.badanUsaha}
                      </td>
                      <td className="py-2 pr-4">{STAGE_LABEL[p.stage]}</td>
                      <td className="py-2 pr-4">
                        {pretestScore ?? "-"}
                      </td>
                      <td className="py-2 pr-4">
                        {postBest ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
```

- [ ] Step 3: Verify `npx tsc --noEmit` + `npm run build`
- [ ] Step 4: Smoke: buat kegiatan via prisma script atau UI, majukan status, cek tabel + link muncul saat POSTTEST_OPEN.
- [ ] Step 5: Commit `git commit -m "feat: detail kegiatan status link dan monitoring peserta"`

---

## Plan berikutnya

**Plan 3:** Flow peserta — `/j/[activityId]` pendaftaran, engine ujian (attempt, timer, autosave, scoring, shuffle seeded), `/p` dashboard peserta + materi, `/t/[token]` posttest retry.
