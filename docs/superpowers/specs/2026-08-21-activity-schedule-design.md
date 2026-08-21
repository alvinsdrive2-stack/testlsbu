# Kalender Kegiatan + Fix Skor Posttest + PDF Materi + Review Jawaban — Design

Tanggal: 2026-08-21
Status: Disetujui

## Ringkasan

Empat perubahan dalam satu spec, dieksekusi berurutan:

1. **Fix bug skor posttest** — halaman posttest menampilkan soal PRETEST tapi dinilai terhadap soal POSTTEST.
2. **PDF materi** — lampiran PDF pada materi yang sudah ada.
3. **Opsi review jawaban** — toggle per modul, tanpa membocorkan kunci jawaban.
4. **Kalender kegiatan** — jadwal sekuensial 4 fase (pendaftaran, pretest, materi, posttest) + waktu tutup; fase aktif diturunkan dari waktu sekarang; gating strict.

Urutan eksekusi: 1 → 3 → 4 → 2 (bugfix paling urgent, kalender paling besar paling akhir).

## Bagian 1: Fix Bug Skor Posttest

### Akar masalah

`src/app/t/[token]/page.tsx` (halaman posttest) query soal dengan
`section: "PRETEST"`. Peserta menjawab soal pretest, tapi `finalizeAttempt`
di `src/app/exam/actions.ts` menilai jawaban terhadap soal
`section: attempt.section` (= POSTTEST). ID jawaban tidak pernah cocok
dengan kunci POSTTEST → skor salah.

`src/app/t/[token]/PosttestReview.tsx` juga hardcode `section: "PRETEST"`.

### Perubahan

- Query soal di `t/[token]/page.tsx` ganti ke `section: "POSTTEST"`.
- `PosttestReview.tsx` diubah jadi komponen `AnswerReview({ attemptId })`
  yang query soal pakai `attempt.section` — reusable untuk pretest dan
  posttest. Import di `t/[token]/page.tsx` ikut menyesuaikan.
- Script rescore sekali jalan (`scripts/rescore-attempts.ts`, dijalankan
  manual via tsx): untuk semua attempt `submittedAt != null`, hitung ulang
  skor + passed pakai logika yang sama dengan `finalizeAttempt`, update
  row. Stage participant ikut dikoreksi (PRETEST_DONE / POSTTEST_PASSED)
  sesuai hasil baru.

### Yang tidak berubah

- `computeScore`, `saveAnswer`, struktur Attempt/Answer.

## Bagian 2: Kalender Kegiatan

### Model skema

Enum `ActivityStatus` dihapus. `Activity` dapat kolom baru (semua nullable):

```prisma
registrationStart DateTime?
pretestStart      DateTime?
materialStart     DateTime?
posttestStart     DateTime?
closedAt          DateTime?
```

Semantik: **null = fase dilewati** (misal kegiatan tanpa pretest biarkan
`pretestStart` kosong). Semua tanggal kosong → fase REGISTRATION (kompatibel
aktivitas lama yang tanpa jadwal).

### Derivasi fase

Fungsi murni di `src/lib/activity-phase.ts`:

```ts
type ActivityPhase =
  | "SCHEDULED"     // ada tanggal tapi belum mulai
  | "REGISTRATION"
  | "PRETEST"
  | "MATERIAL"
  | "POSTTEST"
  | "CLOSED";

function activityPhase(
  starts: {
    registrationStart?: Date | null;
    pretestStart?: Date | null;
    materialStart?: Date | null;
    posttestStart?: Date | null;
    closedAt?: Date | null;
  },
  now: Date
): ActivityPhase
```

Aturan (urutan evaluasi):

1. `closedAt` terlewat (<= now) → `CLOSED`.
2. Ambil start terakhir yang sudah terlewat dari urutan
   [registration, pretest, material, posttest] → fase itu.
3. Tidak ada start yang terlewat:
   - Semua null → `REGISTRATION`.
   - Ada yang terisi → `SCHEDULED`.

Unit test penuh: semua fase, fase terlewat, null combinations, boundary
(== now dianggap terlewat), closedAt menang atas semuanya.

### Migrasi data lama

Backfill lalu hapus kolom `status` + enum:

- `PRETEST_OPEN` → `pretestStart = createdAt`
- `POSTTEST_OPEN` → `posttestStart = createdAt`
- `CLOSED` → `closedAt = createdAt`

### Gating strict

Pesan terkunci standar: judul + "Hubungi admin untuk info lebih lanjut."

| Route | Fase yang boleh | Selain itu |
|---|---|---|
| `/j/[activityId]` (form daftar) | REGISTRATION | "Pendaftaran ditutup" + info kapan buka/tutup kalau ada tanggal |
| `/j/[activityId]/pretest` | PRETEST | Terkunci (tombol start disembunyikan) |
| `/p` materi section | MATERIAL, POSTTEST, CLOSED? tidak — CLOSED tetap sembunyi | Placeholder "Materi dibuka [tanggal]" atau "Menunggu jadwal" |
| `/t/[token]` (posttest) | POSTTEST | "Posttest belum dibuka" / "Kegiatan sudah ditutup" |

Catatan:

- Dashboard `/p` tetap bisa dilihat di semua fase; hanya section materi
  yang di-gate.
- Fase pretest terlewat (null/skip) → peserta boleh langsung lihat materi
  dan posttest sesuai fase aktif; `stage` participant tetap REGISTERED,
  logika stage yang ada sudah menangani.
- `saveAnswer` tetap hanya cek `submittedAt` (existing). Gate di level
  halaman cukup; attempt aktif yang kepotong pergantian fase ter-finalisasi
  otomatis oleh cek deadline yang sudah ada saat page load.

### UI Admin

Halaman detail kegiatan (`/admin/activities/[id]`):

- Tombol "advance status" + `advanceActivityStatus` dihapus.
- Editor jadwal: 5 input `datetime-local` (Pendaftaran, Pretest, Materi,
  Posttest, Tutup). Kosong = dilewati.
- Input ditafsirkan sebagai waktu Jakarta (WIB, UTC+7) → disimpan UTC.
  Konversi via helper kecil `jakartaToUtc` / `utcToJakartaInputValue`
  (offset fixed +7, tanpa lib zona waktu).
- Badge fase aktif + daftar jadwal.
- Server action `updateActivitySchedule` dengan validasi zod: tanggal
  tidak boleh mundur urutannya (registration <= pretest <= material <=
  posttest <= closedAt, nilai null diabaikan).

## Bagian 3: PDF Materi

### Skema

`Material.pdfUrl String?`.

### Upload

`src/app/api/admin/upload-pdf/route.ts` — pola sama `upload-video`:

- Auth cookie admin JWT (401 kalau tidak valid).
- Validasi: `File`, MIME `application/pdf`, max 25MB.
- Streaming `Readable.fromWeb` → `public/uploads/pdfs/<uuid>.pdf`,
  hapus file parsial kalau gagal.
- Response `{ url }`.

### Form admin

Field "Lampiran PDF" di form materi (`[id]/page.tsx` area materi): upload
file, tampil nama file + tombol hapus kalau sudah ada. Disimpan ke
`pdfUrl`. Zod schema materi: `pdfUrl` optional, `""` atau string
`/uploads/pdfs/...`.

### Tampilan peserta

Di `/p` section materi, kalau `pdfUrl` ada: `<iframe src={pdfUrl}>`
(viewer native browser, tinggi ~aspect portrait 800px, responsive) di
bawah konten/video + link "Unduh PDF" (`download` attribute).

## Bagian 4: Opsi Review Jawaban

### Skema

`Module.showAnswerReview Boolean @default(false)`.

### Admin

Toggle "Izinkan peserta melihat review jawaban" di pengaturan modul
(bersama shuffle/duration/passing grade).

### Peserta

- Kalau ON: halaman hasil pretest (`/j/[activityId]/pretest` hasil) dan
  halaman hasil posttest (`/t/[token]` passed/failed) menampilkan
  `AnswerReview` (komponen dari Bagian 1).
- Isi: status benar/salah/tidak dijawab, jawaban peserta, penjelasan
  hanya kalau benar. **Kunci jawaban tidak pernah ditampilkan.**
- Kalau OFF: tidak ada section review.

## Pertanyaan Terjawab (keputusan user)

- Jadwal sekuensial (start per fase + tutup), tanpa tombol manual.
- Gating strict: fase pindah → fase sebelumnya terkunci.
- PDF = lampiran di materi yang sudah ada, bukan tipe terpisah.
- Review = tanpa bocor kunci, toggle per modul.

## Testing

- Unit: `activityPhase` (penuh), `jakartaToUtc`/`utcToJakartaInputValue`,
  schema zod jadwal & materi pdfUrl.
- Existing test suite tetap hijau.
- Verifikasi manual di dev server oleh user (tidak auto-build).
