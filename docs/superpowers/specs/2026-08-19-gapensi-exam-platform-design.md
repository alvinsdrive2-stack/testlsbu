# PRD — Platform Ujian Pelatihan Gapensi (Pre/Post Test)

Tanggal: 2026-08-19
Status: Draft — menunggu review

## 1. Latar Belakang

Gapensi membutuhkan platform ujian online untuk kegiatan pelatihan/bimtek bagi Badan Usaha Jasa Konstruksi (BUJK). Pengalaman yang ditiru adalah Microsoft Forms: admin menyusun soal dan pengaturan ujian lewat builder, peserta mengerjakan lewat link tanpa perlu membuat akun.

Alur inti: peserta mendaftar → pretest → belajar materi → posttest (boleh mengulang sampai lulus passing grade).

## 2. Tujuan dan Success Criteria

- Admin dapat menyusun modul ujian (soal, jawaban, pengaturan) yang reusable antar kegiatan.
- Admin dapat membuka kegiatan (pretest lalu posttest) dan memantau progres peserta.
- Peserta dapat mendaftar, mengerjakan pretest, membaca materi, dan mengulang posttest sampai lulus.
- Skor pretest dan posttest tersimpan dan terlihat di dashboard masing-masing pihak.

Success criteria: satu kegiatan end-to-end (daftar → pretest → materi → posttest lulus dengan retry) berjalan tanpa intervensi manual.

## 3. Keputusan Desain (hasil klarifikasi)

| Keputusan | Pilihan |
|---|---|
| Auth admin | Password tunggal dari environment variable (`ADMIN_PASSWORD`), session signed cookie |
| Tipe soal | Pilihan ganda, satu jawaban benar, autoscore |
| Akses peserta | Link tanpa login; identitas diisi sekali di awal; session via cookie + token |
| Database | MySQL + Prisma |
| Sertifikat | Tidak masuk v1 |
| Acak soal/opsi | Toggle per modul, diatur admin |
| Pengulangan posttest | Unlimited sampai lulus passing grade |
| Durasi & passing grade | Diatur admin per modul, terpisah untuk pretest dan posttest |

## 4. Stack Teknologi

- Next.js 15, App Router, TypeScript
- Tailwind CSS
- Prisma ORM + MySQL
- Server Actions untuk mutasi data
- Signed cookie (JWT via `jose`) untuk session admin dan peserta

## 5. Arsitektur

Monolith Next.js tunggal. Tidak ada API publik, tidak ada service terpisah. Server-side rendering untuk semua halaman peserta dan admin.

### 5.1 Struktur rute

```
/admin/login              — form password admin
/admin                    — dashboard admin (daftar modul + kegiatan)
/admin/modules            — daftar & pembuatan modul
/admin/modules/[id]       — modul builder (soal, opsi, materi, settings)
/admin/activities         — daftar kegiatan
/admin/activities/[id]    — detail kegiatan: kontrol status, link join,
                            link posttest per peserta, monitoring nilai
/j/[activityId]           — halaman pendaftaran peserta (form identitas)
/p                        — dashboard peserta (nilai pretest, materi, status)
/t/[token]                — link posttest unik per peserta
```

### 5.2 Data Model (Prisma)

```prisma
model Module {
  id                  String   @id @default(cuid())
  title               String
  description         String?
  shuffleQuestions    Boolean  @default(false)
  shuffleOptions      Boolean  @default(false)
  pretestDurationMin  Int      @default(30)
  posttestDurationMin Int      @default(30)
  pretestPassingGrade Int      @default(0)   // 0 = pretest tanpa syarat lulus
  posttestPassingGrade Int     @default(70)
  questions           Question[]
  materials           Material[]
  activities          Activity[]
  createdAt           DateTime @default(now())
}

model Question {
  id        String  @id @default(cuid())
  moduleId  String
  module    Module  @relation(...)
  section   Section // PRETEST | POSTTEST
  text      String
  order     Int
  options   Option[]
}

model Option {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(...)
  text       String
  isCorrect  Boolean
}

model Material {
  id        String  @id @default(cuid())
  moduleId  String
  module    Module  @relation(...)
  title     String
  content   String  // rich text / markdown
  videoUrl  String? // opsional, diatur admin
  order     Int
}

model Activity {
  id        String     @id @default(cuid())
  moduleId  String
  module    Module     @relation(...)
  title     String
  status    ActivityStatus // PRETEST_OPEN | POSTTEST_OPEN | CLOSED
  participants Participant[]
  createdAt DateTime   @default(now())
}

model Participant {
  id             String   @id @default(cuid())
  activityId     String
  activity       Activity @relation(...)
  token          String   @unique @default(uuid())
  nama           String
  badanUsaha     String   // nama BUJK
  npwp           String
  wa             String
  email          String
  isGapensiMember Boolean
  stage          ParticipantStage // REGISTERED | PRETEST_DONE | POSTTEST_PASSED
  attempts       Attempt[]
  createdAt      DateTime @default(now())
}

model Attempt {
  id            String    @id @default(cuid())
  participantId String
  participant   Participant @relation(...)
  section       Section
  seed          Int       // seed shuffle untuk reproducibility
  score         Int?      // 0-100, null = belum submit
  passed        Boolean?
  startedAt     DateTime  @default(now())
  submittedAt   DateTime?
  answers       Answer[]
}

model Answer {
  id         String  @id @default(cuid())
  attemptId  String
  attempt    Attempt @relation(...)
  questionId String
  question   Question @relation(...)
  optionId   String?
}
```

## 6. Fitur

### 6.1 Admin

1. **Login.** Form password, divalidasi terhadap `ADMIN_PASSWORD`. Berhasil → signed cookie httpOnly. Middleware melindungi semua rute `/admin`.
2. **Modul builder** (reusable):
   - CRUD soal terpisah untuk section PRETEST dan POSTTEST.
   - Setiap soal: teks, minimal 2 opsi, tandai satu opsi benar, urutan drag.
   - Materi: daftar item (judul, konten, videoUrl opsional), urutan drag.
   - Settings: durasi pretest/posttest (menit), passing grade pretest/posttest (0-100), toggle acak soal, toggle acak opsi.
3. **Kegiatan (Activity):**
   - Buat kegiatan dari modul (modul tidak berubah saat dipakai — snapshot lewat relasi; edit modul hanya berlaku untuk kegiatan baru).
   - Kontrol status: Mulai Pretest → Buka Posttest → Tutup.
   - Halaman detail menampilkan link join untuk pretest dan, saat status POSTTEST_OPEN, link posttest unik per peserta (`/t/[token]`) yang bisa disalin satu per satu.
   - Monitoring: tabel peserta dengan stage, nilai pretest, nilai posttest terbaik, jumlah attempt.

### 6.2 Peserta

1. **Pendaftaran** (`/j/[activityId]`): form dengan field — nama peserta, nama badan usaha jasa konstruksi, NPWP badan usaha, no WA, email aktif, anggota Gapensi (boolean). Submit → Participant dibuat (stage REGISTERED), cookie token peserta diset. Jika cookie sudah ada dan peserta terdaftar di kegiatan ini, langsung redirect ke `/p`.
2. **Pretest:** satu soal per halaman atau satu halaman scroll (satu halaman, MS Forms style). Timer countdown per detik. Jawaban tersimpan di server saat dipilih (autosave). Submit → skor dihitung (jawaban benar / total soal × 100) dan ditampilkan.
3. **Dashboard peserta** (`/p`): nilai pretest, status kegiatan, daftar materi (konten + video opsional). Materi posttest-draft tidak ada — semua materi terbuka setelah pretest submit.
4. **Posttest** (`/t/[token]`): peserta membuka link unik dari admin. Validasi: token cocok, kegiatan status POSTTEST_OPEN. Saat dibuka, stage peserta berubah mengikuti alur posttest. Timer, autosave, submit sama seperti pretest. Skor < passing grade → tampil skor + tombol "Coba Lagi" (attempt baru). Skor ≥ passing grade → stage POSTTEST_PASSED, dashboard menampilkan status lulus.

### 6.3 Aturan penilaian dan pengulangan

- Skor = jumlah benar / total soal × 100, dibulatkan ke bawah.
- Pretest: nilai informatif, tidak memblokir lanjut ke materi.
- Posttest: unlimited retry sampai lulus. Nilai yang ditampilkan admin = attempt terbaik (tertinggi) yang lulus, atau attempt terakhir jika belum pernah lulus.
- Timer habis → auto-submit dengan jawaban yang sudah tersimpan; soal tanpa jawaban dinilai salah.

## 7. Edge Case dan Error Handling

| Kasus | Perilaku |
|---|---|
| Akses `/p` tanpa cookie | Redirect ke halaman join kegiatan terakhir, atau halaman "sesi habis" |
| Peserta buka link posttest sebelum admin buka | Halaman tunggu dengan status kegiatan |
| Token invalid/kadaluarsa | Halaman error jelas dengan kontak admin |
| Submit ganda (double click / tab ganda) | Idempotent: attempt hanya dinilai sekali (guard status submittedAt) |
| Tab ditutup saat mengerjakan | Jawaban autosaved; buka kembali link melanjutkan attempt yang sama selama timer belum habis |
| Timer habis saat tab tidak fokus | Auto-submit oleh server saat berikutnya diakses (server-side deadline check) |
| Kegiatan ditutup saat ada attempt berjalan | Attempt di-freeze, peserta lihat halaman kegiatan berakhir |
| Modul diedit saat kegiatan berjalan | Tidak berpengaruh pada attempt yang sudah dibuat; pertanyaan diambil per-attempt saat mulai |

## 8. Keamanan

- Cookie httpOnly, sameSite lax, signed.
- Opsi benar (`isCorrect`) tidak pernah dikirim ke klien selama pengerjaan — validasi dan scoring hanya di server.
- Rate limit sederhana pada submit login admin.
- Semua input peserta divalidasi (zod) di server.

## 9. Testing

- Unit: fungsi scoring, shuffle seeded, transisi status.
- Integrasi: server actions (daftar peserta, start attempt, submit attempt, retry posttest).
- E2E happy path: daftar → pretest → dashboard materi → admin buka posttest → posttest gagal → retry → lulus.

## 10. Luar Scope v1

- Sertifikat kelulusan
- Tipe soal selain pilihan ganda
- Akun/autentikasi peserta
- Ekspor nilai ke Excel/PDF
- Notifikasi WhatsApp/email otomatis

## 11. Rencana Milestone

1. Scaffold Next.js + Prisma schema + auth admin
2. Modul builder admin (soal, opsi, materi, settings)
3. Kegiatan + monitoring admin
4. Alur peserta: pendaftaran → pretest → dashboard materi
5. Posttest + retry + passing grade
6. Polish + E2E test
