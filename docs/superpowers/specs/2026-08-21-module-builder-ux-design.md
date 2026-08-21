# Module Builder UX + Navigation Loading — Design

Tanggal: 2026-08-21
Halaman terdampak: `/admin/modules/[id]`, `/p` (participant), root layout (semua route)

## 1. Materi: Rich Text (TipTap) + Video

### Editor rich text

- TextArea pada `MaterialSection.tsx` diganti komponen `RichTextEditor` (client) berbasis TipTap.
- Toolbar: bold, italic, strike, H2, H3, bullet list, ordered list, link, gambar (via URL).
- Deps: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`.
- Output HTML disimpan di kolom `Material.content` (String, sudah ada — tanpa migrasi schema).
- Form tetap pakai server action `createMaterial`/`updateMaterial`; editor menyinkronkan HTML ke `<input type="hidden" name="content">`.

### Video materi

Dua mode input dalam satu UI per materi:

1. **Embed**: field URL. URL YouTube/Vimeo dideteksi via helper `videoEmbedUrl(url)` (extend dari `youtubeEmbed` yang ada, tambah pola Vimeo). Return embed URL untuk iframe, atau `null`.
2. **Upload file**: tombol upload → `POST /api/admin/upload-video` (route handler, FormData `file`) → simpan ke `public/uploads/videos/<cuid>.<ext>` → return path → disimpan di kolom `Material.videoUrl` (String, tanpa migrasi).
   - Validasi: MIME `video/*`, max 200 MB, ekstensi dari MIME (bukan dari nama file).
   - Upload UI menampilkan progress (fetch tanpa progress event → pakai indikator "mengunggah…" sederhana; XHR hanya jika terasa perlu).

### Rendering participant (`/p`)

- `Material.content` dirender sebagai HTML: sanitasi server-side dengan `sanitize-html` (whitelist: p, h2, h3, strong, em, s, u, ul, ol, li, a[href], img[src|alt], br), lalu `dangerouslySetInnerHTML`.
- Styling: class `prose-gapensi` custom CSS memakai design tokens existing (tanpa plugin @tailwindcss/typography).
- Video: `videoEmbedUrl` → iframe (YouTube/Vimeo); selain itu jika `videoUrl` terisi → `<video controls className="w-full">`.

## 2. Soal: FAB + Penjelasan di Jawaban Benar

### FAB tambah soal

- Form "Tambah soal baru" statis di bawah daftar soal dihapus.
- Tombol floating bulat `+` fixed kanan-bawah, selalu terlihat (tidak perlu scroll-trigger).
- Klik → modal (overlay + dialog) berisi form soal baru: hanya field teks soal (field penjelasan dihapus dari form create).
- Submit sukses → modal tutup → card soal baru muncul dalam keadaan expanded agar langsung isi opsi. Implementasi: `createQuestion` mengembalikan `ok` + state `justAddedId` di client, dipakai untuk auto-expand.

### Penjelasan di jawaban benar

- Field `explanation` dihapus dari `EditQuestionForm` dan form create.
- Di daftar opsi, opsi dengan `isCorrect: true` menampilkan field "Penjelasan jawaban benar" + tombol simpan di bawahnya.
- Data tetap di `Question.explanation` (satu soal tepat satu jawaban benar — cukup, tanpa migrasi).
- Action baru `updateExplanation(prev, formData)`: update `Question.explanation` by `questionId`.

## 3. Navigation Loading Indicator (global)

- Komponen `NavigationProgress` (client) dipasang di root layout.
- Deteksi navigasi: listener `click` capture pada `document`; jika target (atau ancestor) adalah `<a>` dengan href internal (mulai `/`, bukan `#`, bukan `mailto/tel`, target bukan `_blank`, origin sama) → tampilkan overlay.
- Overlay: full-screen backdrop semi-transparan, logo (default `/favicon.png`, ganti `/logo.png` jika tersedia) di tengah dengan ring spinner melingkar berputar di sekelilingnya.
- Hide: saat `usePathname()` berubah setelah overlay aktif, atau safety timeout 10 detik.
- Animasi masuk/keluar fade singkat, ring spinner CSS keyframes (animate-spin pada setengah-ring border).

## Deps baru

- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`
- `sanitize-html` + `@types/sanitize-html`

## Error handling

- Upload video: respons 413/400 dengan pesan; UI upload menampilkan error inline, tidak menutup form.
- Sanitasi gagal/konten kosong → fallback render teks polos.
- Semua server action existing sudah mengembalikan `{ error }` — pola dipertahankan.

## Testing

- `videoEmbedUrl`: unit test (YouTube watch/short, Vimeo, URL biasa, null).
- Sanitizer: unit test whitelist (script/style stripped).
- Manual: buat materi richtext + upload video, cek render participant; buat soal via FAB, set jawaban benar, isi penjelasan.
