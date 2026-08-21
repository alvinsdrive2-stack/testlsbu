# Kalender Kegiatan + Fix Skor Posttest + PDF + Review Jawaban — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix total bug penilaian posttest (satu pintu bank soal), tambah lampiran PDF materi, toggle review jawaban tanpa bocor kunci, dan ganti status manual kegiatan jadi jadwal sekuensial 4 fase (pendaftaran → pretest → materi → posttest) dengan gating strict.

**Architecture:** Bank soal tunggal diakses lewat `getExamQuestions()` supaya halaman ujian, penilaian, dan review tidak bisa mismatch. Jadwal kegiatan jadi kolom datetime di `Activity`; fase aktif diturunkan fungsi murni `activityPhase()` dari waktu sekarang; enum `ActivityStatus` dan tombol advance dihapus.

**Tech Stack:** Next.js 15 App Router, Prisma + MySQL, zod v4, vitest, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-21-activity-schedule-design.md`

**Branch:** `feat/activity-schedule` dari `master`.

**PENTING:** JANGAN jalankan `npm run build` kecuali user minta. Test jalan via `npx vitest run`.

---

### Task 1: Satu pintu bank soal + fix penilaian posttest + AnswerReview + rescore

**Files:**
- Create: `src/lib/exam-questions.ts`
- Create: `scripts/rescore-attempts.ts`
- Create: `src/components/exam/AnswerReview.tsx`
- Delete: `src/app/t/[token]/PosttestReview.tsx`
- Modify: `src/app/exam/actions.ts`
- Modify: `src/app/t/[token]/page.tsx`
- Modify: `src/app/j/[activityId]/pretest/page.tsx` (hanya ganti query soal pakai helper)

- [ ] **Step 1: Helper `getExamQuestions`**

`src/lib/exam-questions.ts`:

```ts
import { prisma } from "@/lib/prisma";

/**
 * Satu-satunya pintu query bank soal. Pretest dan posttest memakai bank
 * yang sama (section PRETEST). Semua konsumen — halaman ujian, penilaian,
 * review — wajib lewat sini supaya tidak bisa mismatch section.
 */
export function getExamQuestions(moduleId: string) {
  return prisma.question.findMany({
    where: { moduleId, section: "PRETEST" },
    include: { options: true },
    orderBy: { order: "asc" },
  });
}
```

- [ ] **Step 2: `finalizeAttempt` menilai via helper**

Di `src/app/exam/actions.ts`, ganti query di `finalizeAttempt` (baris 39-42):

```ts
import { getExamQuestions } from "@/lib/exam-questions";
// ...
  const questions = await getExamQuestions(
    attempt.participant.activity.moduleId
  );
```

Hapus parameter `section` dari query lama. Logika correct/passed/stage tidak berubah.

- [ ] **Step 3: Komponen `AnswerReview`**

Pindahkan isi `src/app/t/[token]/PosttestReview.tsx` ke `src/components/exam/AnswerReview.tsx`, perubahan:

- Nama komponen: `AnswerReview`, props tetap `{ attemptId: string }`.
- Query soal ganti `getExamQuestions(attempt.participant.activity.moduleId)` (hapus hardcode `section: "PRETEST"` inline, hapus orderBy — sudah di helper).
- Heading jadi dinamis: `Review Jawaban — {attempt.section === "PRETEST" ? "Pretest" : "Posttest"}`.

Delete `src/app/t/[token]/PosttestReview.tsx`. Update import di `src/app/t/[token]/page.tsx`:

```ts
import { AnswerReview } from "@/components/exam/AnswerReview";
```

Ganti semua `<PosttestReview attemptId={...} />` jadi `<AnswerReview attemptId={...} />` (2 tempat: PosttestFailed, PosttestPassed).

- [ ] **Step 4: Halaman pretest pakai helper**

Di `src/app/j/[activityId]/pretest/page.tsx` ganti query soal (baris 125-129) pakai `getExamQuestions(activity.moduleId)`.

Halaman posttest `src/app/t/[token]/page.tsx` query soal (baris 158-162) juga ganti `getExamQuestions(activity.moduleId)` — isinya sama (bank tunggal), tapi konsisten satu pintu.

- [ ] **Step 5: Script rescore**

`scripts/rescore-attempts.ts` (jalankan manual `npx tsx scripts/rescore-attempts.ts`):

```ts
import { prisma } from "../src/lib/prisma";
import { getExamQuestions } from "../src/lib/exam-questions";
import { computeScore } from "../src/lib/exam";

async function main() {
  const attempts = await prisma.attempt.findMany({
    where: { submittedAt: { not: null } },
    include: {
      answers: true,
      participant: { include: { activity: true } },
    },
  });

  for (const attempt of attempts) {
    const questions = await getExamQuestions(
      attempt.participant.activity.moduleId
    );
    const correctByQuestion = new Map(
      questions.map((q) => [q.id, q.options.find((o) => o.isCorrect)?.id ?? null])
    );
    let correct = 0;
    for (const [questionId, correctOptionId] of correctByQuestion) {
      const answer = attempt.answers.find((a) => a.questionId === questionId);
      if (answer?.optionId && answer.optionId === correctOptionId) correct++;
    }
    const score = computeScore(questions.length, correct);

    const mod = await prisma.module.findUnique({
      where: { id: attempt.participant.activity.moduleId },
    });
    const passingGrade =
      attempt.section === "PRETEST"
        ? (mod?.pretestPassingGrade ?? 0)
        : (mod?.posttestPassingGrade ?? 70);
    const passed = score >= passingGrade;

    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { score, passed },
    });
    console.log(
      `${attempt.id} ${attempt.section}: ${attempt.score ?? "-"} -> ${score} (${passed ? "lulus" : "tidak lulus"})`
    );
  }

  // Koreksi stage peserta berdasarkan hasil baru
  const participants = await prisma.participant.findMany({
    include: { attempts: { where: { submittedAt: { not: null } } } },
  });
  for (const p of participants) {
    const stage = p.attempts.some((a) => a.section === "POSTTEST" && a.passed)
      ? "POSTTEST_PASSED"
      : p.attempts.some((a) => a.section === "PRETEST")
        ? "PRETEST_DONE"
        : "REGISTERED";
    if (stage !== p.stage) {
      await prisma.participant.update({ where: { id: p.id }, data: { stage } });
      console.log(`${p.nama}: stage ${p.stage} -> ${stage}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 6: Jalankan test existing**

Run: `npx vitest run`
Expected: semua PASS (tidak ada test yang menyentuh section query ini).

- [ ] **Step 7: Commit**

```bash
git add -A src/lib/exam-questions.ts scripts/rescore-attempts.ts src/components/exam/AnswerReview.tsx src/app/t/[token]/ src/app/j/[activityId]/pretest/page.tsx src/app/exam/actions.ts
git commit -m "fix: penilaian posttest pakai satu pintu bank soal; AnswerReview reusable; script rescore"
```

---

### Task 2: Lampiran PDF materi

**Files:**
- Modify: `prisma/schema.prisma` (Material)
- Create: `src/app/api/admin/upload-pdf/route.ts`
- Create: `src/app/admin/modules/[id]/PdfField.tsx`
- Modify: `src/app/admin/modules/[id]/page.tsx` (form materi: render PdfField, hidden input pdfUrl)
- Modify: `src/app/admin/modules/actions.ts` (materialSchema + create/update)
- Modify: `src/app/p/page.tsx` (viewer + tombol unduh)

- [ ] **Step 1: Skema + migrasi**

`prisma/schema.prisma` model Material tambah:

```prisma
  pdfUrl String?
```

Run: `npx prisma migrate dev --name material_pdf`
Expected: migrasi sukses, `ALTER TABLE Material ADD pdfUrl`.

- [ ] **Step 2: Endpoint upload PDF**

`src/app/api/admin/upload-pdf/route.ts` — salin pola `src/app/api/admin/upload-video/route.ts` (auth JWT admin, streaming pipeline, rm on failure) dengan perbedaan:

```ts
const MAX_SIZE = 25 * 1024 * 1024;

// validasi:
if (file.type !== "application/pdf") {
  return NextResponse.json({ error: "File harus berupa PDF" }, { status: 400 });
}
if (file.size > MAX_SIZE) {
  return NextResponse.json({ error: "Ukuran PDF maksimal 25 MB" }, { status: 400 });
}

const dir = path.join(process.cwd(), "public", "uploads", "pdfs");
// ...
const name = `${randomUUID()}.pdf`;
// ...
return NextResponse.json({ url: `/uploads/pdfs/${name}` });
```

- [ ] **Step 3: Field admin + action**

`src/app/admin/modules/[id]/PdfField.tsx` — pola sama dengan `VideoField.tsx` versi upload (client component, state `uploadedUrl`, input file, POST FormData ke `/api/admin/upload-pdf`, tampil nama file terpilih). Hidden input `name="pdfUrl"` value `uploadedUrl || defaultValue || ""`. Tanpa mode URL — upload saja.

Di `src/app/admin/modules/actions.ts`:

```ts
const pdfUrlField = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || v.startsWith("/uploads/pdfs/"),
    "Lampiran PDF tidak valid"
  );
```

`materialSchema` tambah `pdfUrl: pdfUrlField.optional()`. `createMaterial` + `updateMaterial` parse `pdfUrl: formData.get("pdfUrl") || ""` dan simpan `pdfUrl: pdfUrl || null` (pola sama dengan videoUrl).

Render `<PdfField defaultValue={m.pdfUrl ?? ""} />` di form materi (create + edit) di `page.tsx`, di sebelah VideoField, plus hidden input di form create.

- [ ] **Step 4: Viewer peserta**

Di `src/app/p/page.tsx` section materi, setelah blok video, tambah:

```tsx
{m.pdfUrl ? (
  <div className="mt-6">
    <div className="overflow-hidden rounded-md border border-hairline">
      <iframe
        src={m.pdfUrl}
        title={`PDF ${m.title}`}
        className="h-[800px] w-full"
      />
    </div>
    <a
      href={m.pdfUrl}
      download
      className="mt-3 inline-flex min-h-10 items-center rounded-md border border-hairline-strong bg-surface px-4 text-sm font-semibold hover:bg-canvas"
    >
      Unduh PDF
    </a>
  </div>
) : null}
```

- [ ] **Step 5: Commit**

```bash
git add -A prisma/schema.prisma prisma/migrations src/app/api/admin/upload-pdf src/app/admin/modules src/app/p/page.tsx
git commit -m "feat: lampiran PDF di materi — upload streaming, viewer inline, tombol unduh"
```

---

### Task 3: Toggle review jawaban (tanpa bocor kunci)

**Files:**
- Modify: `prisma/schema.prisma` (Module)
- Modify: `src/lib/schemas.ts` (moduleSettingsSchema)
- Modify: `src/app/admin/modules/actions.ts` (updateModuleSettings parse)
- Modify: `src/app/admin/modules/[id]/page.tsx` (form settings: checkbox)
- Modify: `src/app/j/[activityId]/pretest/page.tsx` (PretestResult tampil AnswerReview)
- Modify: `src/app/t/[token]/page.tsx` (PosttestFailed/Passed gate review)

- [ ] **Step 1: Skema + migrasi**

`Module` tambah:

```prisma
  showAnswerReview Boolean @default(false)
```

Run: `npx prisma migrate dev --name module_answer_review`

- [ ] **Step 2: Schema + action**

`src/lib/schemas.ts` `moduleSettingsSchema` tambah:

```ts
  showAnswerReview: z.coerce.boolean().default(false),
```

`updateModuleSettings` di `src/app/admin/modules/actions.ts` tambah parse:

```ts
    showAnswerReview: formData.get("showAnswerReview") === "on",
```

- [ ] **Step 3: Checkbox admin**

Form pengaturan modul (bagian shuffle/duration/passing grade) di `src/app/admin/modules/[id]/page.tsx` tambah checkbox persis pola `shuffleQuestions`:

```tsx
<div>
  <label htmlFor="showAnswerReview" className="...">
    Izinkan peserta melihat review jawaban
  </label>
  <input
    id="showAnswerReview"
    name="showAnswerReview"
    type="checkbox"
    defaultChecked={module.showAnswerReview}
  />
</div>
```

(Samakan struktur markup dengan checkbox shuffle yang ada.)

- [ ] **Step 4: Gate review peserta**

`t/[token]/page.tsx` — komponen `PosttestFailed` dan `PosttestPassed` tambah prop `showReview: boolean`; render `<AnswerReview>` hanya kalau `showReview`. Pemanggil pass `activity.module.showAnswerReview`.

`j/[activityId]/pretest/page.tsx` — `PretestResult` tambah props `attemptId: string` dan `showReview: boolean`; kalau `showReview`, render `<AnswerReview attemptId={attemptId} />` di bawah kartu nilai (bungkus `<div className="mx-auto mt-8 w-full max-w-4xl">`). Pemanggil pass attempt terakhir yang submitted + `activity.module.showAnswerReview`.

- [ ] **Step 5: Test + commit**

Run: `npx vitest run` — PASS.

```bash
git add -A prisma/schema.prisma prisma/migrations src/lib/schemas.ts src/app/admin/modules src/app/j src/app/t
git commit -m "feat: toggle per modul untuk review jawaban pretest/posttest tanpa bocor kunci"
```

---

### Task 4: `activityPhase` + helper waktu Jakarta (TDD)

**Files:**
- Create: `src/lib/activity-phase.ts`
- Test: `src/lib/__tests__/activity-phase.test.ts`

- [ ] **Step 1: Test dulu (fail)**

```ts
import { describe, expect, it } from "vitest";
import { activityPhase, jakartaInputToDate, toJakartaInputValue } from "../activity-phase";

const NOW = new Date("2026-09-05T10:00:00Z");
const PAST = (min: number) => new Date(NOW.getTime() - min * 60_000);
const FUTURE = (min: number) => new Date(NOW.getTime() + min * 60_000);

describe("activityPhase", () => {
  it("semua null -> REGISTRATION", () => {
    expect(activityPhase({}, NOW)).toBe("REGISTRATION");
  });

  it("ada tanggal tapi belum mulai -> SCHEDULED", () => {
    expect(activityPhase({ registrationStart: FUTURE(60) }, NOW)).toBe("SCHEDULED");
  });

  it("registration lewat -> REGISTRATION", () => {
    expect(activityPhase({ registrationStart: PAST(60) }, NOW)).toBe("REGISTRATION");
  });

  it("pretest lewat -> PRETEST", () => {
    expect(
      activityPhase({ registrationStart: PAST(120), pretestStart: PAST(60) }, NOW)
    ).toBe("PRETEST");
  });

  it("start terakhir yang terlewat menang", () => {
    expect(
      activityPhase(
        {
          registrationStart: PAST(240),
          pretestStart: PAST(120),
          materialStart: PAST(60),
          posttestStart: FUTURE(60),
        },
        NOW
      )
    ).toBe("MATERIAL");
  });

  it("null di tengah = fase dilewati", () => {
    expect(
      activityPhase({ registrationStart: PAST(120), materialStart: PAST(60) }, NOW)
    ).toBe("MATERIAL");
  });

  it("closedAt terlewat menang atas semua", () => {
    expect(
      activityPhase(
        { registrationStart: PAST(240), posttestStart: PAST(60), closedAt: PAST(1) },
        NOW
      )
    ).toBe("CLOSED");
  });

  it("closedAt belum lewat tidak menutup", () => {
    expect(
      activityPhase({ posttestStart: PAST(60), closedAt: FUTURE(60) }, NOW)
    ).toBe("POSTTEST");
  });

  it("boundary: == now dianggap terlewat", () => {
    expect(activityPhase({ pretestStart: NOW }, NOW)).toBe("PRETEST");
  });
});

describe("helper waktu Jakarta", () => {
  it("jakartaInputToDate menghasilkan UTC yang benar", () => {
    // 05:00 WIB = 22:00 UTC hari sebelumnya
    expect(jakartaInputToDate("2026-09-05T05:00").toISOString()).toBe(
      "2026-09-04T22:00:00.000Z"
    );
  });

  it("toJakartaInputValue round-trip", () => {
    const d = jakartaInputToDate("2026-09-05T13:30");
    expect(toJakartaInputValue(d)).toBe("2026-09-05T13:30");
  });
});
```

Run: `npx vitest run src/lib/__tests__/activity-phase.test.ts`
Expected: FAIL — modul tidak ada.

- [ ] **Step 2: Implementasi**

`src/lib/activity-phase.ts`:

```ts
export type ActivityPhase =
  | "SCHEDULED"
  | "REGISTRATION"
  | "PRETEST"
  | "MATERIAL"
  | "POSTTEST"
  | "CLOSED";

export type ActivitySchedule = {
  registrationStart?: Date | null;
  pretestStart?: Date | null;
  materialStart?: Date | null;
  posttestStart?: Date | null;
  closedAt?: Date | null;
};

const PHASE_ORDER: {
  phase: Exclude<ActivityPhase, "SCHEDULED" | "CLOSED">;
  key: keyof ActivitySchedule;
}[] = [
  { phase: "REGISTRATION", key: "registrationStart" },
  { phase: "PRETEST", key: "pretestStart" },
  { phase: "MATERIAL", key: "materialStart" },
  { phase: "POSTTEST", key: "posttestStart" },
];

export function activityPhase(schedule: ActivitySchedule, now: Date): ActivityPhase {
  if (schedule.closedAt && schedule.closedAt.getTime() <= now.getTime()) {
    return "CLOSED";
  }
  let current: ActivityPhase | null = null;
  let anySet = false;
  for (const { phase, key } of PHASE_ORDER) {
    const d = schedule[key];
    if (!d) continue;
    anySet = true;
    if (d.getTime() <= now.getTime()) current = phase;
  }
  return current ?? (anySet ? "SCHEDULED" : "REGISTRATION");
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Date -> nilai input datetime-local dalam waktu Jakarta (WIB). */
export function toJakartaInputValue(date: Date): string {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS)
    .toISOString()
    .slice(0, 16);
}

/** Nilai input datetime-local (WIB) -> Date UTC. */
export function jakartaInputToDate(value: string): Date {
  return new Date(`${value}:00+07:00`);
}
```

- [ ] **Step 3: Test pass**

Run: `npx vitest run src/lib/__tests__/activity-phase.test.ts`
Expected: PASS semua.

- [ ] **Step 4: Commit**

```bash
git add src/lib/activity-phase.ts src/lib/__tests__/activity-phase.test.ts
git commit -m "feat: activityPhase derivasi fase kegiatan dari jadwal + helper waktu Jakarta"
```

---

### Task 5: Skema jadwal Activity + migrasi backfill

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migrasi via prisma CLI (edit SQL backfill)

- [ ] **Step 1: Skema**

`Activity` — hapus kolom `status`, hapus enum `ActivityStatus`, tambah:

```prisma
  registrationStart DateTime?
  pretestStart      DateTime?
  materialStart     DateTime?
  posttestStart     DateTime?
  closedAt          DateTime?
```

- [ ] **Step 2: Migrasi + backfill**

Run: `npx prisma migrate dev --name activity_schedule --create-only`

Edit file migrasi jadi (urutan penting — backfill SEBELUM drop):

```sql
ALTER TABLE `Activity` ADD COLUMN `registrationStart` DATETIME(3) NULL;
ALTER TABLE `Activity` ADD COLUMN `pretestStart` DATETIME(3) NULL;
ALTER TABLE `Activity` ADD COLUMN `materialStart` DATETIME(3) NULL;
ALTER TABLE `Activity` ADD COLUMN `posttestStart` DATETIME(3) NULL;
ALTER TABLE `Activity` ADD COLUMN `closedAt` DATETIME(3) NULL;

UPDATE `Activity` SET `pretestStart` = `createdAt` WHERE `status` = 'PRETEST_OPEN';
UPDATE `Activity` SET `posttestStart` = `createdAt` WHERE `status` = 'POSTTEST_OPEN';
UPDATE `Activity` SET `closedAt` = `createdAt` WHERE `status` = 'CLOSED';

ALTER TABLE `Activity` DROP COLUMN `status`;

DROP PROCEDURE IF EXISTS migrate_activity_status_enum;
```

(Cek dulu isi migration.sql hasil generate Prisma — sesuaikan nama kolom enum bila beda; hapus baris `DROP PROCEDURE` bila tidak ada.)

Run: `npx prisma migrate dev`
Expected: migrasi applied, `npx prisma generate` jalan otomatis.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: skema jadwal kegiatan, hapus enum status, backfill data lama"
```

---

### Task 6: Admin — editor jadwal + hapus tombol advance

**Files:**
- Modify: `src/app/admin/activities/actions.ts`
- Create: `src/app/admin/activities/[id]/ScheduleForm.tsx`
- Modify: `src/app/admin/activities/[id]/page.tsx`
- Modify: `src/app/admin/activities/page.tsx` (kolom status di list, kalau ada)

- [ ] **Step 1: Action `updateActivitySchedule`**

Di `src/app/admin/activities/actions.ts` — hapus `NEXT_STATUS` + `advanceActivityStatus`, tambah:

```ts
import { activityPhase, jakartaInputToDate } from "@/lib/activity-phase";

type ScheduleState = { ok?: boolean; error?: string };

const SCHEDULE_FIELDS = [
  "registrationStart",
  "pretestStart",
  "materialStart",
  "posttestStart",
  "closedAt",
] as const;

export async function updateActivitySchedule(
  _prev: ScheduleState,
  formData: FormData
): Promise<ScheduleState> {
  const activityId = String(formData.get("activityId"));

  const parsed: Record<string, Date | null> = {};
  for (const field of SCHEDULE_FIELDS) {
    const raw = String(formData.get(field) || "").trim();
    if (raw === "") {
      parsed[field] = null;
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
      return { error: "Format tanggal tidak valid" };
    }
    const d = jakartaInputToDate(raw);
    if (Number.isNaN(d.getTime())) {
      return { error: "Tanggal tidak valid" };
    }
    parsed[field] = d;
  }

  const order = SCHEDULE_FIELDS.map((f) => parsed[f]).filter(
    (d): d is Date => d !== null
  );
  for (let i = 1; i < order.length; i++) {
    if (order[i].getTime() < order[i - 1].getTime()) {
      return { error: "Urutan jadwal tidak boleh mundur" };
    }
  }

  await prisma.activity.update({ where: { id: activityId }, data: parsed });

  revalidatePath(`/admin/activities/${activityId}`);
  revalidatePath("/admin/activities");
  return { ok: true };
}
```

- [ ] **Step 2: `ScheduleForm` client component**

`src/app/admin/activities/[id]/ScheduleForm.tsx` — pola `useActionState` seperti form settings modul. 5 input `datetime-local` dengan label:

| Field | Label |
|---|---|
| registrationStart | Pendaftaran mulai |
| pretestStart | Pretest mulai |
| materialStart | Materi dibuka |
| posttestStart | Posttest mulai |
| closedAt | Kegiatan ditutup |

Helper text: "Kosongkan untuk melewati fase." `defaultValue` dari `toJakartaInputValue(date)` bila tidak null. Submit button "Simpan Jadwal", pesan sukses/error pola form lain. Props: `activityId`, `schedule` (5 Date | null).

- [ ] **Step 3: Halaman detail admin**

`src/app/admin/activities/[id]/page.tsx`:

- Hapus import + form `advanceActivityStatus`, hapus `STATUS_LABEL`, `NEXT_ACTION_LABEL`, `NEXT_ACTION_NOTE`, `nextAction`.
- Section "Status kegiatan" ganti: badge fase aktif via `activityPhase(activity, new Date())` dengan label map:

```ts
const PHASE_LABEL: Record<string, string> = {
  SCHEDULED: "Belum dimulai",
  REGISTRATION: "Pendaftaran dibuka",
  PRETEST: "Sesi pretest",
  MATERIAL: "Sesi materi",
  POSTTEST: "Sesi posttest",
  CLOSED: "Ditutup",
};
```

- Render `<ScheduleForm activityId={activity.id} schedule={{...5 tanggal}} />` di section itu. Form hapus kegiatan tetap.
- Semua `activity.status === "POSTTEST_OPEN"` (3 tempat: query posttestParticipants, CopyAllLinks, list link posttest) ganti `activityPhase(activity, new Date()) === "POSTTEST"`. Catatan: link posttest tampil saat fase POSTTEST.

- [ ] **Step 4: List kegiatan**

`src/app/admin/activities/page.tsx` — grep `status`. Kalau ada tampilan status, ganti label via `activityPhase` + `PHASE_LABEL`.

- [ ] **Step 5: Grep sisa `ActivityStatus` / `.status`**

Run: `grep -rn "activity.status\|ActivityStatus\|advanceActivityStatus" src/`
Expected: kosong (atau hanya komentar). Typecheck: `npx tsc --noEmit`.
Fix semua yang tersisa.

- [ ] **Step 6: Commit**

```bash
git add -A src/app/admin/activities
git commit -m "feat: editor jadwal kegiatan di admin, tombol advance dihapus, fase otomatis"
```

---

### Task 7: Gating halaman peserta per fase

**Files:**
- Modify: `src/app/j/[activityId]/page.tsx`
- Modify: `src/app/j/[activityId]/pretest/page.tsx`
- Modify: `src/app/p/page.tsx`
- Modify: `src/app/t/[token]/page.tsx`

Semua halaman hitung sekali di atas:

```ts
import { activityPhase } from "@/lib/activity-phase";
// ...
const phase = activityPhase(activity, new Date());
```

- [ ] **Step 1: `/j/[activityId]` — pendaftaran**

Ganti cek `activity.status === "CLOSED"` (baris 33) dengan:

```ts
if (phase !== "REGISTRATION") {
  // SCHEDULED: "Pendaftaran belum dibuka"
  // CLOSED: "Kegiatan sudah ditutup"
  // PRETEST/MATERIAL/POSTTEST: "Pendaftaran sudah berakhir"
}
```

Kartu pesan pola existing; tambah kalimat "Hubungi admin untuk info lebih lanjut." Kalau `phase === "SCHEDULED"` dan `registrationStart` ada, tampil "Pendaftaran dibuka {tanggal, format id-ID Asia/Jakarta}" (`toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "short" })`).

- [ ] **Step 2: `/j/[activityId]/pretest`**

Ganti dua cek `activity.status` (baris 106-123):

```ts
if (phase === "CLOSED") {
  return <ExamResult title="Kegiatan sudah ditutup" body="Hubungi admin untuk info lebih lanjut." />;
}
if (phase !== "PRETEST") {
  return (
    <ExamResult
      title="Pretest sudah selesai"
      body="Buka dashboard peserta untuk melihat nilai dan materi."
      href="/p"
      hrefLabel="Ke Dashboard"
    />
  );
}
```

(Sesuaikan copy: kalau `phase === "SCHEDULED"` → "Pretest belum dibuka".)

- [ ] **Step 3: `/p` — materi di-gate**

Dashboard tetap terlihat. Section materi:

```ts
const materiOpen = phase === "MATERIAL" || phase === "POSTTEST";
```

- `materiOpen` → render list materi (existing).
- `!materiOpen && activity.materialStart` → placeholder "Materi dibuka {tanggal WIB}".
- `!materiOpen && !activity.materialStart` → "Materi menunggu jadwal dari admin."

CTA dashboard (`cta`) dan menu — ganti logika `activity.status === "POSTTEST_OPEN"` jadi `phase === "POSTTEST"`, `CLOSED` → `phase === "CLOSED"`. Fase PRETEST + belum pretest → tombol Mulai Pretest (existing else-branch sudah benar). Fase MATERIAL/POSTTEST + belum pretest → pesan "Pretest sudah ditutup. Hubungi admin." (strict).

- [ ] **Step 4: `/t/[token]` — posttest**

Ganti dua cek `activity.status` (baris 134-149):

```ts
if (phase === "CLOSED") {
  return <ExamResult title="Kegiatan sudah ditutup" body="Hubungi admin untuk info lebih lanjut." />;
}
if (phase !== "POSTTEST") {
  return (
    <ExamResult
      title="Posttest belum dibuka"
      body="Tunggu sampai jadwal posttest dimulai, lalu buka link ini lagi."
    />
  );
}
```

- [ ] **Step 5: Test + typecheck + commit**

Run: `npx vitest run` — PASS. Run: `npx tsc --noEmit` — bersih.

```bash
git add -A src/app/j src/app/p src/app/t
git commit -m "feat: gating fase jadwal di semua halaman peserta (strict)"
```

---

## Verifikasi akhir (oleh user, BUKAN otomatis)

- Setup jadwal kegiatan di admin → fase badge berubah sesuai waktu.
- Peserta: daftar → pretest → materi kebuka sesuai jadwal → posttest nilai benar.
- `npx tsx scripts/rescore-attempts.ts` untuk data lama (jalankan SEKALI sebelum deploy, setelah semua perubahan jalan).
- Build hanya kalau user minta.
