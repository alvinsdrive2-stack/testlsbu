# Design Palette — Gapensi

Sumber: brand guidelines Gapensi. Berlaku untuk seluruh UI aplikasi ujian.

## Palette Utama (Brand & Logo)

### Biru Tua / Navy Blue (Primary Accent)

- HEX: `#002B66` (alternatif: `#003366`)
- RGB: rgb(0, 43, 102)
- Fungsi: warna utama identitas GAPENSI (kesetiaan, profesionalisme, keteguhan). Dipakai di header/navigation bar, tombol utama, dan elemen penegas.
- Token: `--color-accent` (hover: `--color-accent-hover` = `#003366`)

### Putih / Off-White (Base Background & Text)

- HEX: `#FFFFFF` / `#F8F9FA`
- RGB: rgb(255, 255, 255)
- Fungsi: latar belakang halaman, area teks utama, lambang GAPENSI (ketulusan dan integritas).
- Token: `--color-surface` = `#FFFFFF`, `--color-canvas` = `#F8F9FA`

## Palette Sekunder & Aksesibilitas

### Abu-Abu Gelap / Dark Slate (Body Text)

- HEX: `#212529` (alternatif: `#333333`)
- RGB: rgb(33, 37, 41)
- Fungsi: teks utama, kontras tinggi di atas latar putih.
- Token: `--color-ink`

### Abu-Abu Muda / Light Gray (Card Background & Border)

- HEX: `#E9ECEF` (alternatif: `#F1F3F5`)
- RGB: rgb(233, 236, 239)
- Fungsi: warna pembatas, latar modul berita/informasi, divider.
- Token: `--color-hairline` (border/divider); latar card memakai `--color-surface`

### Kuning Emas / Amber Accent (Highlight / Hover State)

- HEX: `#FFC107` (alternatif: `#D99B00`)
- RGB: rgb(255, 193, 7)
- Fungsi: aksen pembeda untuk tombol sekunder, status aktif, atau sorotan (highlight).
- Token: `--color-highlight` = `#FFC107`, `--color-highlight-hover` = `#D99B00`

## Aturan Pakai

1. Navy untuk aksi utama (CTA, link aktif, header). Bukan dekorasi.
2. Amber hanya untuk highlight/status aktif/sorotan. Hindari amber untuk teks di atas putih — kontras rendah; pakai `#D99B00` untuk teks kecil bila perlu.
3. Netral (putih/abu) jadi kanvas; hierarki lewat ukuran tipografi dan whitespace, bukan warna.
4. Sidebar/header boleh navy solid dengan teks putih; konten tetap latar terang.
