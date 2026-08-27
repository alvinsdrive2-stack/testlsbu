# Design: Toast Feedback untuk Semua Action

Tanggal: 2026-08-27

## Latar Belakang

Saat ini semua action (CRUD aktivitas/modul/soal/materi/sertifikat, upload, ujian, login/logout) tidak memiliki feedback sukses — hanya revalidatePath/redirect. Error sudah tampil inline (`ErrorNote` / `role="alert"`), tetapi tidak konsisten dan tidak muncul di semua titik. User meminta feedback yang jelas untuk setiap action: sukses, error, warning.

Keputusan desain:

- Library: **Sonner**.
- Cakupan: **sukses + error + warning** (bukan toast-sukses-saja).
- Feedback inline error yang sudah ada **tetap dipertahankan**; toast adalah lapisan konfirmasi singkat di atasnya.

## Infrastruktur

1. Install dependency `sonner`.
2. Mount `<Toaster />` satu kali di `src/app/layout.tsx`:
   - Posisi `bottom-right`.
   - `richColors` on (hijau/merah/kuning otomatis).
   - Styling via Tailwind/CSS agar senada tema UI solid navy yang dipakai aplikasi.
3. Helper tipis `src/lib/toast.ts` yang mengekspos `toastSuccess`, `toastError`, `toastWarning`, `toastLoading` — pembungkus `sonner/toast`. Semua pemanggilan lewat helper ini agar styling dan swap library berlaku dari satu tempat.

## Pola Integrasi

### A. Form server action via `useActionState` (pola dominan)

Dua jalur:

1. **Otomatis lewat komponen bersama** — `ActionForm` ditambah efek client: jika `state` berubah dan mengandung pesan → sukses = `toastSuccess`, error = `toastError`. Ini menutup banyak form sekaligus dengan satu perubahan.
2. **Manual** untuk form legacy yang tidak melewati `ActionForm`: `CreateActivityForm`, `AddModuleFab`, form login peserta/admin, `JoinForm`, `StartPretestForm`, retry posttest, `ScheduleForm`, `SettingsForm`. Pola sama: `useEffect` pada state `useActionState` → panggil helper toast.

Sukses tetap redirect/revalidate seperti sekarang — tidak ada perubahan alur navigasi.

### B. Tombol tanpa form

- `ConfirmButton` (delete aktivitas, materi, soal, opsi): hasil serangan server action → sukses = toast success ("X dihapus"), gagal = toast error.
- CRUD soal/opsi di `QuestionSection`, materi di `MaterialSection` adalah server action biasa; tiap action sukses muncul toast spesifik ("Soal dibuat", "Opsi dihapus", dst.) menggunakan jalur A.2 atau efek lokal sesuai struktur komponen.

### C. Action berbasis fetch

Panggilan eksplisit via helper:

| Titik | Sukses | Warning | Error |
|---|---|---|---|
| Upload PDF/video (`PdfField`, `VideoField`) | "File terunggah" | saat upload lambat/proses > ambang | gagal upload |
| Simpan layout sertifikat (`certificate-preview`) | tersimpan | — | gagal simpan |
| Exam runner `saveAnswer` | jawaban tersimpan (halus) | — | gagal simpan |
| Exam runner `submitAttempt` | submitted | — | gagal submit, mencolok |

Progress bar upload tetap ada — toast bukan pengganti progres.

## Kategori & Teks

- Hijau = sukses, merah = error, kuning/oranye = warning.
- Bahasa teks: Indonesia kasual-formil ala app lainnya — "Berhasil disimpan", "Modul dibuat", "Soal dihapus", "Upload gagal", dst.
- Logout: toast ringan setelah redirect ke halaman login. Login gagal: inline error sudah ada + toast error.

## Yang Tidak Diubah

- Alur redirect, struktur form, validasi zod, endpoint API.
- Error inline tetap dirender (persisten); toast bersifat sementara.

## Kriteria Selesai

1. Setiap titik mutasi pada peta riset menghasilkan toast minimal salah satu kategori.
2. Toast tampil senada tema (navy/interfere minimal) dan tidak menggandakan redirect.
3. Build dan lint lolos.
