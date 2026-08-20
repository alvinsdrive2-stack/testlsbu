# Flow Peserta (Pretest → Materi → Posttest) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Peserta daftar via link, kerjakan pretest (timer, autosave), lihat nilai + materi di dashboard, kerjakan posttest via link unik, retry unlimited sampai lulus passing grade.

**Architecture:** Session peserta = signed cookie berisi participant token (sudah ada di `src/lib/session.ts`: `createParticipantSession`, `getParticipantToken`). Engine ujian server-side: attempt punya `seed` (shuffle reproducible) + `startedAt`; deadline = startedAt + durasi; server auto-submit kalau lewat deadline saat halaman diakses. Scoring & shuffle di `src/lib/exam.ts` (pure, unit test). `isCorrect` tidak pernah dikirim ke klien.

**Tech Stack:** sama Plan 1-2. Tambahan: vitest untuk unit test `src/lib/exam.ts`.

**Rute:**
- `/j/[activityId]` — form pendaftaran (6 field). Cookie peserta + terdaftar → redirect `/p`.
- `/j/[activityId]/pretest` — mulai/lanjut pretest (butuh cookie peserta).
- `/p` — dashboard peserta: nilai pretest, materi (+video embed), status kegiatan.
- `/t/[token]` — posttest via link unik: mulai/lanjut/retry; tampil skor & status lulus.

---

### Task 1: `src/lib/exam.ts` + unit test

Pure functions:

```ts
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function computeScore(totalQuestions: number, correctCount: number): number {
  if (totalQuestions === 0) return 0;
  return Math.floor((correctCount / totalQuestions) * 100);
}

export function deadlineFor(startedAt: Date, durationMin: number): Date {
  return new Date(startedAt.getTime() + durationMin * 60_000);
}
```

Test `src/lib/__tests__/exam.test.ts` (vitest): shuffleWithSeed deterministic (seed sama → hasil sama, isi sama walau urutan beda), computeScore pembulatan ke bawah (2/3 → 66), computeScore 0 soal → 0, deadlineFor benar.

Jalankan: `npx vitest run` — semua PASS. Commit `feat: lib exam shuffle seeded scoring dan deadline`.

### Task 2: Server actions ujian — `src/app/exam/actions.ts`

```ts
"use server";

saveAnswer(attemptId, questionId, optionId):
  - attempt harus belum submittedAt
  - validasi option milik question
  - upsert Answer (unique attemptId+questionId)

submitAttempt(attemptId):
  - attempt + answers, questions + options
  - hitung correct = answers yang optionId = option.isCorrect
  - score = computeScore(total, correct)
  - passed: PRETEST → score >= module.pretestPassingGrade (informatif), POSTTEST → score >= module.posttestPassingGrade
  - update attempt {score, passed, submittedAt: now}
  - update stage participant: PRETEST → PRETEST_DONE; POSTTEST && passed → POSTTEST_PASSED
  - revalidatePath /p
```

Commit `feat: aksi simpan jawaban dan submit attempt`.

### Task 3: Pendaftaran `/j/[activityId]`

- `src/app/j/[activityId]/actions.ts`: registerParticipant — zod (nama min 3, badanUsaha min 3, npwp min 5, wa min 8, email valid, isGapensiMember "on"), cek activity ada & status != CLOSED, create participant, createParticipantSession, redirect `/j/[activityId]/pretest`.
- `src/app/j/[activityId]/page.tsx`: form 6 field (public layout tanpa sidebar — satu kolom max-w-md, judul kegiatan). Kalau cookie peserta valid & sudah terdaftar di kegiatan ini → redirect `/p`.

Commit `feat: halaman pendaftaran peserta`.

### Task 4: Halaman pretest `/j/[activityId]/pretest` + ExamRunner (client)

Server page:
- participant dari cookie (harus terdaftar di kegiatan ini, else redirect `/j/[activityId]`)
- activity PRETEST_OPEN
- cari attempt PRETEST yang belum submitted; kalau nggak ada → buat (seed = random int, startedAt now)
- kalau ada & lewat deadline → auto-submit server-side, tampil hasil
- load questions PRETEST + options, shuffle pakai seed + setting modul (shuffleQuestions/shuffleOptions), TANPA isCorrect → render ExamRunner

`src/app/exam/ExamRunner.tsx` (client):
- props: attemptId, deadlineISO, questions [{id, text, options:[{id, text}]}], initialAnswers, submitLabel
- state answers; klik opsi → optimistic set + void saveAnswer
- timer countdown per detik (useEffect + setInterval), tampil mm:ss; timeLeft <= 0 → auto submitAttempt + router.refresh()
- tombol submit → submitAttempt + router.refresh()
- disabled saat submitting

Commit `feat: engine ujian pretest dengan timer dan autosave`.

### Task 5: Dashboard peserta `/p`

- participant dari cookie; nggak ada → tampil halaman "sesi habis" + link
- nilai pretest (max attempt PRETEST yang ada score), status kegiatan, stage
- materi: daftar judul + konten + video embed (`<iframe>` youtube bila videoUrl)
- kalau POSTTEST_OPEN → info "hubungi admin untuk link posttest"

Commit `feat: dashboard peserta nilai dan materi`.

### Task 6: Posttest `/t/[token]`

- participant by token; nggak ada → halaman invalid
- activity harus POSTTEST_OPEN → else halaman tunggu/status
- kalau ada attempt POSTTEST passed → tampil "Lulus, skor X"
- kalau ada attempt POSTTEST submitted tapi belum lulus → tampil skor + tombol "Coba Lagi" (mulai attempt baru)
- attempt aktif (belum submitted) → auto-submit kalau deadline lewat, else render ExamRunner
- cookie diset saat akses link (biar /p juga jalan)

Commit `feat: halaman posttest dengan retry unlimited`.

### Task 7: Verifikasi akhir + quality review

- `npx tsc --noEmit` + `npx vitest run` + `npm run build`
- Smoke e2e via script prisma + curl: register → pretest submit → /p → posttest retry
- Dispatch code quality reviewer untuk seluruh branch
