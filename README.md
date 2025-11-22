# UNUGHA Event Platform

Platform manajemen acara kampus modern yang dirancang untuk Universitas Nahdlatul Ulama Al Ghazali (UNUGHA). Aplikasi ini memudahkan organisasi mahasiswa untuk mempublikasikan acara dan mahasiswa untuk menemukan serta mendaftar kegiatan kampus.

Dibangun dengan **React**, **Supabase**, dan **Google Gemini AI**.

## 🌟 Fitur Utama

### 1. Sistem Autentikasi & Profil Pengguna
*   **Login & Register:** Pendaftaran akun baru dan login aman menggunakan Supabase Auth.
*   **Lupa Password:** Fitur reset password via email dengan alur UI yang lengkap.
*   **Manajemen Profil:** Update nama, bio, dan **Upload Foto Profil**.
*   **Avatar Dinamis:** Jika pengguna belum upload foto, sistem otomatis menampilkan avatar 3D lucu (Dicebear Adventurer) berdasarkan email pengguna.

### 2. Manajemen Event (Acara)
*   **Jelajahi Event (Discover):** Cari event berdasarkan kategori, pencarian teks, dan filter status.
*   **Detail Event Interaktif:** Tampilan detail event bergaya "Glassmorphism" & "Luma-style" dengan informasi lengkap (Waktu, Lokasi/Link, Peta).
*   **Buat Event dengan AI:** Form pembuatan event yang terintegrasi dengan **Google Gemini AI** untuk membuat deskripsi acara yang menarik secara otomatis ("Magic Write").
*   **Pendaftaran Event:** Mahasiswa dapat mendaftar event dengan satu klik (tiket tersimpan di dashboard).

### 3. Dashboard Interaktif
*   **Mode Host vs Peserta:** Tab terpisah untuk melihat event yang Anda selenggarakan (Host) dan event yang Anda ikuti.
*   **Statistik Sederhana:** Ringkasan jumlah event dan aktivitas.
*   **Manajemen Event:** Edit dan preview event yang dibuat.

### 4. Organisasi
*   **Direktori Organisasi:** Daftar UKM, Himpunan, dan Komunitas kampus.
*   **Halaman Detail Organisasi:** Profil lengkap organisasi, anggota pengurus, dan daftar event yang mereka adakan.

### 5. Fitur Teknis & UI
*   **Running Text Landing Page:** Efek ketikan (typewriter) pada headline halaman depan agar lebih dinamis.
*   **Database Seeder:** Halaman khusus (`/seed`) untuk menginstal skema database dan mengisi data dummy secara otomatis tanpa perlu membuka SQL editor manual.
*   **Responsive Design:** Tampilan optimal di Desktop, Tablet, dan Mobile.

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend:** React 19, React Router v6
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
*   **AI:** Google Gemini API (via `@google/genai` SDK)
*   **Charts:** Recharts

---

## 🚀 Cara Install & Menjalankan

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di lokal komputer Anda.

### Prasyarat
*   Node.js (versi 16 ke atas)
*   Akun [Supabase](https://supabase.com) (Gratis)
*   API Key [Google Gemini](https://aistudio.google.com) (Gratis)

### 1. Clone Repository & Install Dependencies

```bash
# Clone repository ini (jika ada git) atau download ZIP
git clone https://github.com/username/unugha-event-platform.git
cd unugha-event-platform

# Install library yang dibutuhkan
npm install
```

### 2. Konfigurasi Environment Variables

Buat file `.env` di root folder proyek Anda (sejajar dengan `package.json`). Tambahkan konfigurasi berikut:

```env
# Dapatkan API Key dari https://aistudio.google.com/app/apikey
API_KEY=masukkan_api_key_gemini_anda_disini
```

> **Catatan Penting Supabase:** 
> Konfigurasi URL dan Key Supabase saat ini terletak di file `services/supabaseClient.ts`.
> Buka file tersebut dan ganti nilai `supabaseUrl` dan `supabaseKey` dengan project Anda sendiri jika ingin menghubungkan ke database pribadi Anda.

### 3. Setup Database (Otomatis)

Aplikasi ini memiliki fitur **Auto-Seeder** yang canggih. Anda tidak perlu menjalankan SQL secara manual satu per satu.

1.  Jalankan aplikasi terlebih dahulu:
    ```bash
    npm start
    ```
2.  Buka browser dan akses: `http://localhost:1234/#/seed` (atau port yang sesuai).
3.  Di halaman Seeder:
    *   Klik Tab **"2. Schema SQL"**.
    *   Salin kode SQL yang muncul.
    *   Buka Dashboard Supabase Anda -> **SQL Editor** -> Paste kode tersebut -> Klik **Run**.
    *   *(Langkah ini akan membuat tabel users, profiles, events, organizations, dan storage buckets)*.
4.  Kembali ke aplikasi halaman Seeder (`#/seed`).
5.  Klik Tab **"1. Data Seeder"**.
6.  Buat User Admin (atau login jika sudah ada).
7.  Klik tombol **"Generate 10 Dummy Events"** untuk mengisi data contoh.

### 4. Menjalankan Aplikasi

Setelah database siap:

```bash
npm start
```
Buka `http://localhost:1234` (atau URL yang muncul di terminal).

---

## 📂 Struktur Folder

```
/
├── components/       # Komponen UI reusable (Button, Card, Modal, dll)
├── context/          # React Context (AuthContext untuk manajemen user login)
├── pages/            # Halaman utama aplikasi (Landing, Dashboard, Login, dll)
├── services/         # Integrasi API (supabaseClient.ts, geminiService.ts)
├── types.ts          # Definisi Tipe TypeScript
├── App.tsx           # Router utama dan Layout Navbar
├── index.tsx         # Entry point aplikasi
└── metadata.json     # Konfigurasi permissions
```

## 📝 Lisensi

Project ini dibuat untuk keperluan demonstrasi dan pengembangan komunitas kampus UNUGHA.

---
**Dibuat dengan ❤️ oleh Tim Developer UNUGHA**
