# Audit UX & Performa — Gapensi Exam Platform

Tanggal: 2026-08-28
Cakupan: semua halaman (`src/app/**`), komponen (`src/components/**`), query Prisma, `prisma/schema.prisma`.
DB: **MySQL** (bukan PostgreSQL). Next.js App Router, Server Actions, sonner untuk toast.

Ringkasan skala:
- **14 HIGH** — halangan nyata bagi pengguna / risiko data / bottleneck jalur utama
- **~20 MED** — friction jelas, inkonsistensi pola
- **~15 LOW** — polish

---

## Ringkasan Prioritas

| # | Masalah | Area | Severity |
|---|---------|------|----------|
| 1 | Halaman depan `/` bertuliskan "404" tanpa CTA apa pun | UX | HIGH |
| 2 | 0 file `loading.tsx` di seluruh app — tidak ada skeleton/loading state global | UX | HIGH |
| 3 | Missing index `Participant.email` / `wa` — login, daftar, check-email full table scan | Prisma | HIGH |
| 4 | Dashboard peserta selalu fetch `Material.content` (MediumText) meski tidak ditampilkan | Prisma | HIGH |
| 5 | N+1 reorder/hapus soal — update N row sequential, tanpa transaksi | Prisma | HIGH |
| 6 | Hapus kegiatan (cascade data peserta) hanya dua-klik, tanpa modal konsekuensi | UX | HIGH |
| 7 | `/admin/certificate-preview` tanpa AdminShell (yamatim) + drag tanpa touch support | UX | HIGH |
| 8 | Double-submit: banyak tombol tanpa pending/disabled (`/login`, `/admin/login`, Coba Lagi posttest, Beri Sertifikat) | UX | HIGH |
| 9 | `finalizeAttempt` dipanggil saat render server component (mutasi di GET) | Prisma/UX | HIGH |
| 10 | Validasi urutan 5 datetime jadwal tidak ada (client & server) | UX | HIGH |
| 11 | Token design system meleset: radius card 12px, canvas `#eef1f6`, tanpa token merah bata/amber | UI | HIGH |
| 12 | ~~Search admin case-sensitive~~ **NON-ISSUE** — collation DB `utf8mb4_unicode_ci` (case-insensitive), `contains` MySQL sudah case-insensitive | UX | resolved || 13 | Nav kiri `/p` hidden di mobile tanpa pengganti (AdminShell punya MobileNav, `/p` tidak) | UX | HIGH |
| 14 | Nav kiri `/p`: link `#` mati tanpa penjelasan saat fase belum terbuka | UX | HIGH |

---

# BAGIAN 1 — AUDIT UX PER HALAMAN

## 1. `/` — Landing (publik)

Struktur: kartu tunggal terpusat, Backdrop + PageTransition.

- **HIGH** `src/app/page.tsx:19-24` — Halaman DEPAN bertuliskan "404 — Halaman tidak ditemukan". Pengguna salah ketik domain melihat 404 dua kali (di sini dan `not-found.tsx`). Peserta yang kehilangan link tidak diberi tombol "Masuk" / link pendaftaran. Tidak ada CTA apa pun.
- **MED** `page.tsx:23` — Copy "silahkan" (baku: "silakan"); halaman lain pakai "silakan".

## 2. `/login` — Login peserta

Struktur: kartu max-w-sm, 2 field (email, WA).

- **MED** `login/page.tsx:41-83` — Submit pakai `Button` polos tanpa pending/disabled. Klik ganda saat server lambat = double submit. (Kontras: JoinForm/StartPretestForm sudah benar.)
- **MED** `login/page.tsx:49-56` — Tanpa `autoComplete="email"` / `autoComplete="tel"`; format nomor WA tidak divalidasi sama sekali.
- **LOW** `login/page.tsx:17` — Error tampil dobel: QueryToast + inline `role="alert"`.
- **LOW** — Tidak ada link ke pendaftaran untuk user yang ternyata belum terdaftar.

## 3. `/j/[activityId]` — Pendaftaran

Struktur: 2 kolom (narasi kiri, form kanan), TopBar.

- **MED** `j/[activityId]/page.tsx:36-73` — Pendaftaran ditutup → tidak ada tombol "Ke Dashboard" untuk peserta yang sudah terdaftar.
- **MED** `EmailField.tsx:69-75` — Email "taken": pesan menyuruh login tapi TIDAK ada link ke `/login`.
- **LOW** `JoinForm.tsx:38-48` — NPWP/WA tanpa pattern/format hint.
- **LOW** `JoinForm.tsx:59-79` — Radio "Anggota Gapensi" required tanpa default; block-nya diam-diam.
- Bagus: JoinForm validasi client + pending + error inline; EmailField debounce check + status inline.

## 4. `/j/[activityId]/pretest` — Pretest

State machine server-side lengkap (closed / hasil / start gate / exam).

- **HIGH** `pretest/page.tsx:232-234` — `finalizeAttempt` (mutasi DB) dipanggil saat render server component. Error di sini jatuh ke error.tsx generik.
- **MED** `pretest/page.tsx:109-120` — Review jawaban: pretest & posttest-failed pakai `<details>`, posttest-passed render langsung. Pola beda untuk hal serupa.
- **MED** `StartPretestForm` — Mulai ujian = timer jalan satu arah, tapi satu klik langsung start tanpa konfirmasi.
- **LOW** — Stepper grid-cols-4 sempit di mobile.

## 5. `/t/[token]` — Posttest via token

- **HIGH** `t/[token]/page.tsx:127-130` — Token invalid → kartu "Link tidak valid" TANPA tombol jalan keluar apa pun.
- **HIGH** `t/[token]/page.tsx:127-130` — Peserta di-fetch `include` penuh tanpa `select` (lihat Bagian 2, L1).
- **MED** `t/[token]/page.tsx:248-250` — `finalizeAttempt` saat render (sama dengan pretest).
- **MED** `PosttestFailed` `t/[token]/page.tsx:54-56` — "Coba Lagi" langsung buat attempt baru, tanpa konfirmasi, tanpa pending/disabled → dobel attempt.
- **LOW** — `attempt` = jumlah gagal, label bisa membingungkan ("Percobaan ke-2").

## 6. `/p` — Dashboard peserta

Struktur: TopBar + 2 kolom (aside sticky: nav, progres, nilai; tengah: status + materi/sertifikat). AutoRefresh di boundary fase.

- **HIGH** `p/page.tsx:226` — Nav kiri `hidden md:block`, TIDAK ada nav pengganti di mobile. Menu tak bisa diakses dari HP.
- **HIGH** `p/page.tsx:187-199` — Nav "Posttest" href `#` saat fase belum POSTTEST — klik tidak terjadi apa-apa, tanpa tooltip/alasan.
- **MED** `p/page.tsx:433-438` — Iframe sertifikat `h-[800px]` fixed: di mobile butuh scroll horizontal di dalam iframe; tidak ada aspect-ratio wrapper / tautan buka PDF langsung.
- **LOW** `p/page.tsx:113` — `stages[doneCount-1]`; `doneCount=0` → `stages[-1]` → undefined. Fragile.
- **LOW** `p/page.tsx:92-95` — `pretestScore = max` tanpa catatan percobaan terakhir.
- **LOW** `p/page.tsx:502-565` — Padding `p-6` tanpa `sm:` variant, beda dari section header `p-6 sm:p-8`.
- Bagus: progressbar aria, Countdown, QueryToast `joined`, empty state materi & kegiatan terhapus.

## 7. `/admin/login`

- **MED** `admin/login/page.tsx:34-59` — Submit tanpa pending/disabled (double submit).
- **LOW** `admin/login/page.tsx:20-25` — `<img>` (eslint-disabled) padahal `/login` pakai `next/image` — inkonsisten.
- **LOW** — Tanpa indikator Caps Lock / toggle show-password.

## 8. `/admin` — Dashboard admin

- **MED** `admin/page.tsx:53-56` — Fetch SEMUA participant hanya untuk hitung growth mingguan (lihat Bagian 2, M4); render tanpa loading state.
- **LOW** `admin/page.tsx:105-115` — Kartu stat "Peserta" link ke `/admin/activities`, bukan `/admin/participants` — mengejutkan.
- **LOW** — `PHASE_CHIP` diduplikasi `admin/page.tsx:14-21` vs `admin/activities/page.tsx:21-28`.
- Bagus: empty state upcoming dengan arahan.

## 9. `/admin/modules` — Daftar modul

- **HIGH → NON-ISSUE** `admin/modules/page.tsx:17` — awalnya dicurigai case-sensitive; terverifikasi collation tabel `utf8mb4_unicode_ci` (MySQL default case-insensitive), jadi `contains` sudah case-insensitive. Tidak perlu `mode: "insensitive"` (itu fitur PostgreSQL saja).
- **MED** `admin/modules/page.tsx:37-45` — Search form enter-only tanpa tombol, tanpa reset.
- **LOW** `admin/modules/page.tsx:75-79` — "Belum ada soal" pakai `text-flag` (merah = alarm) untuk kondisi info.
- Bagus: empty state 2 varian (no-match & kosong total).

## 10. `/admin/modules/[id]` — Module builder

- **HIGH** `MaterialSection.tsx:82-96` — SEMUA materi dirender sebagai form edit penuh (RichTextEditor per item) tanpa collapse. 10 materi = 10 editor berat sekaligus. QuestionSection sudah collapsible — pola kontras.
- **MED** `MaterialSection.tsx:25-47` — Tanpa indikasi unsaved changes / `beforeunload` — pindah halaman = pekerjaan hilang.
- **MED** `QuestionSection.tsx:145-164` — Hapus opsi dua-klik dengan tombol kecil di antara banyak tombol — mudah salah klik (soal/materi sudah oke pakai ConfirmButton).
- **MED** `QuestionSection.tsx:286-313` — Tombol ↑↓ tanpa optimistic update / indikator pindah; re-render penuh.
- **LOW** `SettingsForm.tsx:52-85` — `grid-cols-2` tanpa `sm:` — 4 input sempit di mobile.
- **LOW** `SettingsForm.tsx:93,103,110` — `accent-[#002b66]` hardcoded, bukan token.

## 11. `/admin/activities` — Daftar kegiatan

- **MED** `admin/activities/page.tsx:84-106` — Fetch semua kegiatan tanpa pagination (beda dari participants yang 10/hal).
- **LOW** `ActivityRow.tsx:46-72` — Baris tidak clickable (hanya tombol "Lihat Detail"); dashboard admin seluruh kartu Link. Pola beda.

## 12. `/admin/activities/new` — Buat kegiatan

- **HIGH** `CreateActivityForm.tsx:8-28, 73-91` — 5 datetime wajib tanpa validasi urutan. `closedAt` bisa sebelum `posttestStart` → fase kacau. Tidak ada hint urutan menaik.
- **MED** `CreateActivityForm.tsx:100-105` — Error inline `text-flag` tanpa `role="alert"` (kontras form lain).
- **MED** — Duplikasi penuh halaman `/new` vs AddActivityFab modal (quick variant) — dua pintu, kemampuan beda, quick variant tidak menyebut jadwal.

## 13. `/admin/activities/[id]` — Detail kegiatan

- **HIGH** `admin/activities/[id]/page.tsx:140-146` — Hapus kegiatan = cascade data peserta & hasil ujian, hanya dua-klik. Tidak ada modal yang menyebut konsekuensi ("semua peserta & hasil ujian ikut terhapus"). Double-click kebiasaan bisa melewati guard.
- **MED** `page.tsx:271-283` — "Beri Sertifikat" per baris tanpa pending/disabled → dobel request.
- **MED** `page.tsx:232-310` — Tabel 6 kolom mobile: scroll horizontal tanpa indikator; kolom "Aksi" paling kiri.
- **MED** `page.tsx:166-175` — "Export Excel" styling raw inline, bukan komponen Button; tanpa indikasi proses.
- **LOW** — Generate sertifikat sukses tidak memicu toast di halaman ini.
- **LOW** `ScheduleForm.tsx:114` — `rounded-lg` (> 8px, pelanggaran token).

## 14. `/admin/participants` — Semua peserta

- **MED** `participants/page.tsx:133-197` — Tabel 5 kolom + `overflow-x-auto`; tidak ada filter kegiatan; tidak ada link detail peserta.
- **MED** `participants/page.tsx:124-127` — Empty state `<p>` polos; modules/activities pakai kartu + link reset. Inkonsisten.
- **LOW** `participants/page.tsx:64-74` — Sort header tanpa `aria-sort`.

## 15. `/admin/certificate-preview` — Editor sertifikat

- **HIGH** — TIDAK memakai AdminShell — satu-satunya halaman admin tanpa navigasi; keluar hanya lewat back browser.
- **HIGH** `certificate-preview/page.tsx:124-149, 276-318` — Drag & drop hanya mouse events. Tanpa touch support → tak bisa dipakai di tablet/HP. X/Y tidak bisa diinput angka (read-only display).
- **MED** `page.tsx:230-271` — Toolbar `<button>` raw styling; tidak ada `beforeunload` guard untuk perubahan belum disimpan.
- **LOW** `page.tsx:340` — `parseInt(...) || 24` — input kosong jadi 24 diam-diam.
- **LOW** — Color input bebas tanpa validasi hex; font family tidak bisa diganti.

---

# BAGIAN 2 — AUDIT QUERY PRISMA

> Semua provider: **MySQL**. Index ada: `Question(moduleId, section)`, `Option(questionId)`, `Material(moduleId)`, `Activity(moduleId)`, `Participant(activityId)`, `Attempt(participantId, section)`, unique token/certificateNumber.

## HIGH

### H1 — N+1 reorder/hapus soal, non-transaksional
`src/app/admin/modules/actions.ts:193-197` (`deleteQuestion`) & `:236-240` (`moveQuestion`)
```ts
for (const q of remaining) {
  await prisma.question.update({ where: { id: q.id }, data: { order } });
}
```
Setiap klik ↑↓/hapus = N round-trip sequential. `moveQuestion` hanya butuh tukar 2 baris tapi update SEMUA. Gagal di tengah = urutan korup.
Perbaikan:
```ts
await prisma.$transaction([
  prisma.question.update({ where: { id: a.id }, data: { order: newA } }),
  prisma.question.update({ where: { id: b.id }, data: { order: newB } }),
]);
// deleteQuestion:
await prisma.question.updateMany({
  where: { moduleId, section, order: { gt: deleted.order } },
  data: { order: { decrement: 1 } },
});
```

### H2 — Dashboard peserta selalu fetch `Material.content` (MediumText)
`src/app/p/page.tsx:50-59`
`materials: { select: { id, order, title, content, videoUrl, pdfUrl } }` jalan di SEMUA fase — termasuk SCHEDULED/REGISTRATION/PRETEST (materi belum dibuka, hanya tampil countdown), POSTTEST/CLOSED, dan saat sertifikat sudah terbit. MediumText bisa ratusan KB–MB per baris → RSC payload bengkak + sanitasi HTML tiap load.
Perbaikan: ambil metadata dulu; `content` hanya di cabang `materiOpen && !certificateNumber`:
```ts
if (materiOpen && !participant.certificateNumber) {
  materials = await prisma.material.findMany({
    where: { moduleId: activity.module.id },
    orderBy: { order: "asc" },
  });
}
```
Sekalian hilangkan `.sort()` manual (line 504) — pakai `orderBy`.

### H3 — Missing index `Participant.email` / `wa`
- `src/app/login/actions.ts:15-18` — `findFirst({ where: { email, wa }, ... })`
- `src/app/j/[activityId]/actions.ts:47-50` — `findFirst({ where: { email }, ... })`
- `src/app/api/check-email/route.ts:13-16` — dipanggil **per keystroke** di form daftar!

Semua full table scan. Satu baris migrasi, efek terbesar di jalur publik:
```prisma
model Participant {
  ...
  @@index([email])
  @@index([wa])
}
```

### H4 — `finalizeAttempt`: write non-transaksional + overfetch
`src/app/exam/actions.ts:30-81`
- `attempt.update` + `participant.update` sequential tanpa `$transaction` → submit ganda/concurrent bisa double-update stage.
- Include `module: true` penuh padahal hanya butuh passing grade + moduleId.
- Mengambil `text` soal + semua opsi padahal hanya butuh `id` + `isCorrect` (100 soal × 5 opsi = transfer teks penuh sia-sia).

Perbaikan: `select` eksplisit + key jawaban via query terpisah (`Promise.all`) + wrap kedua update dalam `$transaction`.

## MED

### M1 — Re-read attempt tiap render
`t/[token]/page.tsx:194-239` & `j/[activityId]/pretest/page.tsx:178-239`
`refreshed = findUniqueOrThrow(...)` selalu dijalankan meski `finalizeAttempt` sering tidak mengubah apa-apa. Return hasil dari `finalizeAttempt`, re-query hanya saat finalize benar-benar terjadi.

### M2 — Query sequential yang bisa paralel
`t/[token]/page.tsx:127-211` — participant → failedPosttest → passedAttempt → getExamQuestions → activeAttempt → lastSubmitted, semua sequential. Setelah `participant`, sisanya independen → `Promise.all`. `failedPosttest` juga dieksekusi sebelum gate phase (percuma saat bukan fase POSTTEST).

### M3 — `groupBy` seluruh tabel participant tanpa filter
`admin/activities/page.tsx:98-101` & `admin/page.tsx:45-48` — scan seluruh tabel, agregat semua kegiatan yang pernah ada. Tambah `where: { activityId: { in: activities.map(a => a.id) } }`.

### M4 — Growth chart: fetch semua row hanya untuk di-count
`admin/page.tsx:49-56` & `api/admin/growth/route.ts:31-40` — `findMany({ select: { createdAt } })` lalu bucket di JS. Range "year" = ribuan Date di memori. Agregasi di SQL:
```ts
prisma.$queryRaw`SELECT DATE(createdAt) d, COUNT(*) c FROM participant
  WHERE createdAt >= ${since} GROUP BY DATE(createdAt)`
```

### M5 — Export Excel tanpa `select`
`admin/activities/[id]/export/route.ts:19-22` — ambil SEMUA kolom participant (token, stage, dll) padahal hanya butuh nama/badanUsaha/npwp/wa/email. Tambah `select`; ribuan baris → cursor batching.

### M6 — Nomor sertifikat: scan + race condition
`admin/activities/[id]/certificate-actions.ts:28-36` — `contains` + `endsWith` (tak bisa pakai index) + dua admin klik bersamaan = nomor duplikat. Perbaikan: counter atomik di tabel `CertificateConfig` (`UPDATE ... SET seq = seq + 1`) atau unique-check + retry.

### M7 — Register ambil row penuh untuk cek duplikat
`j/[activityId]/actions.ts:47-50` — `findFirst` tanpa `select`; hanya butuh `wa` + `token`.
Catatan bisnis: pencarian duplikat lintas kegiatan — email lama di kegiatan lain menghalangi daftar kegiatan baru.

### M8 — Module builder ambil semua `content` + soal + opsi
`admin/modules/[id]/page.tsx:16-27` — justified (form edit), tapi 100 materi × 500 KB = puluhan MB per load. Minimal: paginate materi / ambil `content` hanya untuk item yang dibuka editornya.

## LOW

- **L1** Overfetch include penuh: `t/[token]/page.tsx:129`, `j/[activityId]/pretest/page.tsx:138`, `AnswerReview.tsx:5-11`, `api/certificate/[token]/route.ts:12-17` — ganti `select` eksplisit.
- **L2** `t/[token]/actions.ts:18` — `include: { attempts: true }` penuh; cukup `select { section, passed, submittedAt }`.
- **L3** `j/[activityId]/page.tsx:16-32` — sequential kecil, opsional digabung.
- **L4** `GrowthChart.tsx` — fetch API per ganti range; bisa server component + `searchParams` (data awal di-fetch dua kali: page + API).
- **L5** `admin/modules/page.tsx:27-30` — `counts.find()` O(n) dalam map; ganti `Map` keyed `${moduleId}:${section}`.
- **L6** Missing index minor: `Participant.createdAt`, `Activity.createdAt` (untuk orderBy default). Tambahkan saat tabel > 100k row.

## Sudah baik
- `admin/activities/[id]/page.tsx:62-85` — Promise.all count + paginated + groupBy + select eksplisit. Pattern contoh.
- `admin/participants/page.tsx:48-57` — pagination + count paralel + include minimal.
- `_count: { select }` subquery di list activities/dashboard — bukan N+1.
- `getExamQuestions` terpusat, index tepat sasaran.
- `saveAnswer` upsert pada composite unique — efisien.
- `setCorrectOption` pakai `$transaction`.

---

# BAGIAN 3 — AUDIT KONSISTENSI UI (DESIGN SYSTEM)

> Referensi: DESIGN.md + arah aktual (LMS solid, navy, 3 kolom, flat, border > shadow, radius maks 8px, amber hanya di atas navy).

## Token (prioritas #1 — semua halaman mengikuti token)

`src/app/globals.css`:
- `--radius-card: 12px` → spec 8px.
- `--color-accent-hover: #0a3f8f` → spec `#003a85`.
- `--color-canvas: #eef1f6` → spec `#faf9f7`.
- Token **merah bata `#c8102e` dan amber `#ffc107` tidak ada sama sekali**; warning yang ada `#b45309`/`fdf3e3` (coklat). Perlu keputusan: selaraskan token ke DESIGN.md atau revisi spec.

## Pelanggaran

- `src/components/ui/Card.tsx:10` — radius 12px + shadow diam `0 1px 3px`. Set 8px, hapus shadow (flat).
- `src/components/admin/AdminShell.tsx:25,26,68` — paling parah: `shadow-2xl` sidebar & main, `rounded-2xl` + `shadow-xl` logo, `bg-white` literal. Ganti shadow → border.
- FAB pill + glow: `AddActivityFab.tsx:38`, `AddModuleFab.tsx:37`, `QuestionSection.tsx:414` — `rounded-full` + `shadow-lg shadow-accent/30`. Ubah `rounded-lg` flat.
- Modal scrim `backdrop-blur-[2px]` — glassmorphism di luar sticky header (satu-satunya blur yang diizinkan).
- Amber di atas putih / token coklat sebagai warning — belum selaras spec.
- `src/lib/certificate-fields.ts:18-22` — `#108af4`, `#012A4D`, font Poppins di luar palet (konteks render sertifikat).
- `SettingsForm.tsx:93,103,113` — `accent-[#002b66]` literal.
- Pill badge di 5+ file (`activities/page.tsx:60,62`, `admin/page.tsx:166,168`, `AnswerReview.tsx:43-52`, `p/page.tsx:353`) — spec: `rounded-sm/md`. (Dot & progress bar `rounded-full` boleh.)
- `ScheduleForm.tsx:114` — `rounded-lg`.
- `Button.tsx:31` — branch `href` me-render `<Link>` tanpa `{...props}` — atribut disabled/aria hilang.
- `MaterialSection.tsx:80-98` — daftar materi = deretan `Card p-5`; spec: divide-y rows.

## Duplikasi komponen

- `src/app/p/ProfileMenu.tsx` vs `src/components/admin/ProfileMenu.tsx` — hampir identik. Satukan ke `ui/ProfileMenu.tsx`.
- 3 modal FAB copy-paste: `AddActivityFab`, `AddModuleFab`, `QuestionSection:194`. Ekstrak `ui/Modal.tsx`.
- Styling kartu list copy-paste manual (`modules/page.tsx:88,97`, `activities/page.tsx`) alih-alih `<Card>`. Ekstrak `ListCard`.
- Button tersebar: `Button`, `SubmitButton`, `ConfirmButton` + raw `<button>` di `certificate-preview:251-263`, `PdfField:121`, `VideoField:195`, `error.tsx:27`, `RichTextEditor:21`. Konsolidasikan; `ConfirmButton` jadi `Button variant="danger" confirm`.

## Komponen yang ada
ActionForm, Backdrop, Button, Card, ConfirmButton, Countdown, Field, NavigationProgress, PageTransition, QueryToast, Reveal, RichTextEditor, StartGate, SubmitButton, ToasterHost, TopBar, useActionToast. Toast system (sonner) sudah ada dan dipakai.

## Komponen yang perlu dibuat
- `Skeleton` — sekarang 0 loading.tsx, loading ad-hoc (spinner, "Memuat video…" polos).
- `EmptyState` — satukan ±10 copy-paste.
- `Modal` — satukan 3 modal FAB.
- `Badge`/`Chip` — status chip ad-hoc 5+ file.
- `ProfileMenu` tunggal.
- `ListRow` — baris divide-y standar.
- `BigStat` — angka besar tabular-nums (sekarang inline di dashboard).

## Sudah sesuai spec
- `ConfirmButton` dua-klik (armed merah, reset 3 detik, sr-only status) — konsisten di semua aksi destruktif kecil.
- Global `:focus-visible` di globals.css — semua interaktif kebagian.
- `label-eyebrow` util ada.
- List modules/activities/dashboard pakai divide-y.
- Stat-card dashboard pakai angka besar + tabular-nums.

---

# BAGIAN 4 — INKONSISTENSI LINTAS HALAMAN

1. **Empty state 3 pola**: kartu + CTA (modules/activities) vs `<p>` polos (participants, activity-detail) vs kartu tanpa CTA (dashboard).
2. **Pending submit 2 pola**: SubmitButton ("Menyimpan…") vs Button polos tanpa pending (`/login`, `/admin/login`, Coba Lagi, Beri Sertifikat, Export).
3. **Search 2 pola**: enter-only tanpa tombol (modules/activities) vs tombol Cari/Filter (participants). Semua case-sensitive.
4. **Logo**: `next/image` vs `<img>` (admin/login).
5. **Review jawaban**: `<details>` (pretest, posttest-failed) vs langsung (posttest-passed).
6. **Mobile nav**: admin ada MobileNav; `/p` nav hidden tanpa pengganti.
7. **Error inline**: dengan `role="alert"` vs span `text-flag` polos.
8. **Baris list**: dashboard = seluruh kartu Link; activities = tombol saja.
9. **Radius & shadow**: `rounded-md` mayoritas, tapi ada `rounded-lg/2xl` + shadow di AdminShell/FAB/Card.
10. **Hardcoded color**: `accent-[#002b66]` vs token.

---

# BAGIAN 5 — RENCANA EKSEKUSI (URUTAN SARAN)

**Gelombang 1 — korek & murah:**
1. ✅ Index `Participant.email`/`wa` (H3) — di-push via `prisma db push`. Catatan: `migrate dev` keblokir karena history migrasi drift (kolom sertifikat pernah masuk via `db push`, dan migrasi lama `lowercase_table_names` punya bug urutan FK/index yang sudah diperbaiki filenya). Perlu baseline migrasi ulang nanti.
2. ✅ Token globals.css (radius 8, canvas `#faf9f7`, hover `#003a85`, tambah `bata`/`amber`).
3. ✅ CTA di halaman depan `/` + link login di "Link tidak valid" + link login di EmailField.
4. ✅ Search case-sensitive → **non-issue** (collation `_ci`).
5. ✅ Submit pending: `/login`, `/admin/login`, Coba Lagi posttest, Beri Sertifikat → `SubmitButton`.

**Gelombang 2 — performa:**
6. ✅ Lazy-load `Material.content` dashboard peserta (H2).
7. ✅ Refactor reorder/hapus soal → transaction (H1).
8. ✅ `finalizeAttempt` → transaction + select eksplisit; return hasil; hilangkan re-read (H4, M1).
9. ✅ Paralelisasi halaman ujian (M2); filter groupBy (M3); growth SQL aggregate (M4); export select (M5).

**Gelombang 3 — UX struktural:**
10. ✅ Loading skeleton global (`loading.tsx` di `/admin`, `/p`, `/j/[activityId]`, `/t/[token]` + `ui/Skeleton.tsx`).
11. ✅ Nav mobile `/p` + link `#` jadi disabled dengan alasan.
12. ✅ Peringatan cascade hapus kegiatan; validasi urutan jadwal.
13. ✅ `certificate-preview`: top bar, drag mouse+touch, input X/Y numerik, indikator "belum disimpan" + guard beforeunload.
14. ✅ Konsolidasi komponen: Modal + AddFab, EmptyState, ProfileMenu (varian labeled/compact), Skeleton. Badge/chip status sengaja tetap ad-hoc per halaman (konteks beda-beda).

**Gelombang 4 — scale & polish:**
15. ✅ Sertifikat counter atomik (M6, `ON DUPLICATE KEY UPDATE` per tahun); pagination `/admin/activities` (25/halaman, count ringkasan global pakai select kolom tanggal saja); M7 (select `{wa, token}`); M8 (module builder tanpa `content`, lazy via `getMaterialContent`).
16. ✅ ProfileMenu terpadu; MaterialSection jadi `<details>` divide-style; shadow dibuang (Card, AdminShell, AddFab); `accent-[#002b66]` → `accent-accent`.

**Verifikasi:** `npx tsc --noEmit` bersih per 2026-08-28.

**Catatan deploy server:** skema berubah sejak baseline `20260828000000_baseline` (indeks `Participant.email`/`wa`). DB lokal sudah di-push; kalau DB server belum, jalankan `npx prisma migrate deploy` di server.
