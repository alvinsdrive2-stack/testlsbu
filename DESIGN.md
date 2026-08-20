---
name: Gapensi Exam Platform
description: Platform ujian bimtek BUJK dengan bahasa visual institusi nasional Indonesia
colors:
  gapensi-navy: "#002b66"
  navy-hover: "#003a85"
  merah-bata: "#c8102e"
  amber-panitia: "#ffc107"
  amber-hover: "#d99b00"
  putih-institusi: "#faf9f7"
  surface-putih: "#ffffff"
  tinta: "#212529"
  tinta-sekunder: "#5f6368"
  garis-rambut: "#e4e1dc"
  garis-rambut-tebal: "#c9c5be"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(36px, 4.5vw, 60px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(24px, 2.5vw, 32px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(18px, 1.8vw, 24px)"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  sm: "6px"
  md: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.gapensi-navy}"
    textColor: "{colors.surface-putih}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.navy-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-putih}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-ghost:
    textColor: "{colors.gapensi-navy}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  confirm-button-armed:
    backgroundColor: "{colors.merah-bata}"
    textColor: "{colors.surface-putih}"
    rounded: "{rounded.sm}"
  input-field:
    backgroundColor: "{colors.surface-putih}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  input-field-focus:
    backgroundColor: "{colors.surface-putih}"
  card:
    backgroundColor: "{colors.surface-putih}"
    rounded: "{rounded.md}"
    padding: "24px"
  nav-link-active:
    textColor: "{colors.tinta}"
  exam-option-selected:
    backgroundColor: "{colors.gapensi-navy}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
  eyebrow-label:
    textColor: "{colors.merah-bata}"
    typography: "{typography.label}"
---

# Design System: Gapensi Exam Platform

## 1. Overview

**Creative North Star: "The National Ledger"**

Sistem ini berperilaku seperti dokumen resmi negara: garis-garis tegas membagi bidang, hierarki tipografi seperti pasal undang-undang, angka besar seperti data statistik nasional, dan label kecil kapital seperti kop surat kementerian. Setiap layar adalah satu halaman ledger: satu pernyataan, satu angka penting, satu tindakan.

Kepadatan rendah, ritme vertikal lega (section 64px, halaman bernapas di 96px ke atas), dan hampir tanpa bayangan. Kedalaman dibangun lewat garis rambut (`#e4e1dc`) dan bidang warna solid — navy institusional untuk bidang struktural, putih hangat untuk kanvas. Identitas Indonesia muncul lewat satu benang merah bata yang jarang, bukan perayaan merah-putih.

Sistem ini secara eksplisit menolak: SaaS gradient dashboard, glassmorphism, tombol pill, kartu radius 24–32px, icon-card overload, floating blobs, portal pemerintah generik, dan estetika template konstruksi — seluruh anti-reference dari PRODUCT.md dan taste.md.

**Key Characteristics:**
- Flat dan fisik: border > shadow, selalu
- Satu benang merah per layar, tidak lebih
- Label kapital kecil (12px, tracking 0.18em) sebagai penanda bagian
- Angka besar tabular sebagai fakta institusional
- Dark section navy dipakai strategis: status, skor, stepper
- Amber hanya hidup di atas navy (CTA di bidang gelap, badge lulus)

## 2. Colors

Palet tertahan: satu navy struktural, satu merah sinyal, satu amber untuk bidang gelap, dan netral hangat untuk sisanya.

### Primary
- **Gapensi Navy** (#002b66): Warna struktural sistem. Header admin, bidang status peserta, tombol aksi utama, tautan aktif, opsi ujian terpilih. Navy bukan dekorasi — navy adalah struktur.
- **Navy Hover** (#003a85): Satu-satunya variasi navy untuk state hover tombol.

### Secondary
- **Merah Bata** (#c8102e): Benang merah Indonesia. Eyebrow label, nav aktif (garis bawah), nomor soal, angka posttest terbaik, tombol konfirmasi destruktif ter-armed, teks peringatan waktu. Tidak pernah jadi bidang besar.

### Tertiary
- **Amber Panitia** (#ffc107): Hanya hidup di atas navy: CTA di bidang gelap, badge "Lulus posttest", aksen login admin. Di atas putih, amber dilarang sebagai teks (kontras gagal AA).
- **Amber Hover** (#d99b00): State hover CTA amber.

### Neutral
- **Putih Institusional** (#faf9f7): Kanvas halaman. Putih hangat, bukan putih murni.
- **Surface Putih** (#ffffff): Bidang konten, kartu, input.
- **Tinta** (#212529): Teks utama.
- **Tinta Sekunder** (#5f6368): Teks pendukung, metadata, deskripsi.
- **Garis Rambut** (#e4e1dc): Pembagi baris, border kartu, divider section.
- **Garis Rambut Tebal** (#c9c5be): Border input dan tombol sekunder — elemen yang menuntut affordance lebih kuat.

### Named Rules
**The One Red Thread Rule.** Merah Bata muncul maksimal satu benang per view: eyebrow, ATAU nav aktif, ATAU nomor soal. Kalau dua elemen besar sama-sama merah dalam satu layar, satu salah.

**The Amber-On-Navy Rule.** Amber hanya boleh sebagai teks/border/CTA di atas bidang navy. Amber di atas putih institusional dilarang keras (kontras AA gagal).

## 3. Typography

**Display Font:** system-ui stack (Segoe UI di Windows, SF Pro di Apple)
**Body Font:** system-ui stack (satu keluarga, tanpa pasangan display)
**Label/Mono Font:** system-ui stack; angka timer pakai `font-mono` / `tabular-nums`

**Character:** Satu keluarga sans yang carried by weight dan scale, bukan oleh dekorasi jenis huruf. Berat 700 untuk pernyataan, 600 untuk penanda, 400 untuk isi. Kontras skala ≥1.25 antar tingkat.

### Hierarchy
- **Display** (700, clamp(36px, 4.5vw, 60px), 1.1): Judul halaman utama — nama peserta, judul kegiatan admin. Muncul sekali per halaman.
- **Headline** (700, clamp(24px, 2.5vw, 32px), 1.2): Status besar, nilai besar di bidang navy, judul section admin.
- **Title** (600, clamp(18px, 1.8vw, 24px), 1.3): Judul materi, judul kartu form.
- **Body** (400, 16px, 1.6): Isi materi, deskripsi. Panjang baris 65–75ch; konten form max-w-2xl.
- **Label** (600, 12px, tracking 0.18em, UPPERCASE): Eyebrow merah, label form, header tabel. Kapital selalu; jangan dipakai untuk kalimat.

### Named Rules
**The Small Caps Ledger Rule.** Setiap section dibuka label kapital kecil, bukan ikon, bukan dekorasi. Kalau sebuah area butuh penanda, label kapital adalah jawaban pertama dan biasanya satu-satunya.

**The Big Number Rule.** Angka yang penting (nilai, jumlah peserta, timer) tampil besar, `tabular-nums`, tanpa dekorasi. Angka institusional tidak butuh kartu.

## 4. Elevation

Sistem ini flat dan fisik seperti arsitektur editorial: tidak ada kosakata shadow. Kedalaman disampaikan lewat tiga lapis tonal — Putih Institusional (kanvas), Surface Putih (bidang), Gapensi Navy (bidang struktural) — dan garis rambut sebagai pemisah. Sticky header memakai `bg-canvas/95` + `backdrop-blur`, satu-satunya efek kaca yang diizinkan, karena fungsional (konten menggulir di bawahnya), bukan dekoratif.

### Named Rules
**The Ledger Line Rule.** Pembagian antar area memakai garis 1px Garis Rambut (`#e4e1dc`), penuh, bukan bayangan, bukan stripe samping. Daftar item = `divide-y` dengan border-y, bukan kartu berulang.

## 5. Components

Karakter komponen: **presisi birokrat**. Solid, tegas, state-nya jelas seperti stempel institusi.

### Buttons
- **Shape:** sudut hampir siku (6px), compact
- **Primary:** Gapensi Navy solid, teks putih, padding 8px 16px, font 600
- **Hover / Focus:** hover → Navy Hover; focus-visible wajib terlihat (outline navy)
- **Secondary:** Surface Putih + border Garis Rambut Tebal, teks Tinta
- **Ghost:** teks navy tanpa border, hover latar kanvas
- **Amber CTA (bidang gelap):** amber solid + teks navy, hanya di atas navy

### Confirm Button (dua langkah)
Tombol destruktif (hapus) menuntut dua klik: klik pertama mengubah tombol jadi Merah Bata solid berlabel "Yakin? Klik lagi", auto-reset 3 detik. Klik kedua mengeksekusi. Tidak pernah langsung hapus sekali klik.

### Cards / Containers
- **Corner Style:** 8px
- **Background:** Surface Putih
- **Shadow Strategy:** tidak ada — border Garis Rambut 1px
- **Internal Padding:** 24px (form), 20px (item)
- Kartu hanya untuk pengelompokan bermakna (form, editor); daftar memakai baris divide-y, bukan kartu berulang

### Inputs / Fields
- **Style:** border Garis Rambut Tebal, Surface Putih, 6px, teks 15px
- **Label:** kapital kecil (12px, 600, tracking 0.12em) Tinta Sekunder di atas field
- **Focus:** border navy + ring 1px navy. Bukan glow lembut.

### Exam Option Row
Baris opsi jawaban: border penuh 1px, 6px. Terpilih = border Gapensi Navy penuh + latar `accent/5%` + font 600. Tidak ada stripe kiri. Radio native `accent` navy, seluruh baris adalah label klik.

### Phase Stepper
Di bidang navy: titik terisi Amber untuk fase selesai, titik outline putih 40% untuk tersisa, teks putih/putih-60, penghubung garis 1px putih/25.

### Navigation (Admin)
Header horizontal satu baris, border bawah Garis Rambut. Wordmark "GAPENSI" navy + eyebrow "Panel Admin". Tautan aktif = border-bawah 2px Merah Bata; hover = teks menggelap. Mobile: nav tetap horizontal, label pendek.

## 6. Do's and Don'ts

### Do:
- **Do** pakai garis rambut 1px (`#e4e1dc`) untuk semua pembagian area — daftar, tabel, section.
- **Do** buka setiap area dengan label kapital kecil merah bata atau tinta sekunder.
- **Do** tampilkan angka penting besar dengan `tabular-nums`, tanpa kartu pembungkus.
- **Do** pakai bidang navy penuh untuk status/skor peserta, dengan CTA amber di dalamnya.
- **Do** pastikan setiap state layar menyebut langkah berikutnya.
- **Do** pertahankan kontras AA: teks di navy hanya putih atau amber; amber tidak pernah di atas putih.
- **Do** sediakan state lengkap untuk komponen interaktif: default, hover, focus-visible, disabled, error.

### Don't:
- **Don't** pakai SaaS gradient dashboard, glassmorphism, neumorphism, floating blobs, atau 3D abstract shapes (anti-reference PRODUCT.md & taste.md).
- **Don't** bikin tombol pill atau kartu radius 24–32px — radius maksimum sistem 8px.
- **Don't** pakai stripe samping berwarna (border-left/right >1px) sebagai aksen; larangan absolut.
- **Don't** bungkus daftar dalam grid kartu seragam berulang — pakai baris divide-y.
- **Don't** jadikan merah bata warna dominan; satu benang merah per layar.
- **Don't** pakai ikon dekoratif atau icon-card overload; tipografi dan fotografi yang bekerja.
- **Don't** tambahkan bayangan pada elemen diam; sistem ini flat.
- **Don't** andalkan warna saja untuk menyampaikan state (timer kritis juga harus ada teks "Waktu hampir habis").
- **Don't** pakai gradien pada teks (`background-clip: text`) — selalu warna solid.
- **Don't** modal sebagai jawaban pertama; konfirmasi inline lebih dulu (pola dua-klik, panel konfirmasi submit).
