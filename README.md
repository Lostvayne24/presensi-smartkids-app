# Presensi Bimbel SmartKids Global

Aplikasi manajemen presensi dan pembayaran digital untuk bimbingan belajar, dibangun dengan React dan Firebase.

## Fitur Utama

### 📱 Absensi Digital
*   **Pencatatan Real-time**: Memungkinkan tutor mencatat kehadiran siswa dengan mudah.
*   **Geolokasi**: Validasi lokasi otomatis untuk memastikan kehadiran di tempat.
*   **Foto Bukti**: Upload foto kegiatan belajar sebagai bukti otentik.
*   **Tanda Tangan Digital**: Validasi kehadiran siswa melalui tanda tangan digital.

### 💰 Manajemen Pembayaran
*   **Monitoring Status**: Lacak status pembayaran siswa (Lunas, Belum, Telat).
*   **Statistik**: Dashboard ringkas untuk melihat total siswa dan status pembayaran bulanan.
*   **Multi-Bulan**: Dukungan untuk melihat riwayat pembayaran hingga 12 bulan.

### 👥 Manajemen User
*   **Role-based Access**: Akses terpisah untuk Admin dan Tutor.
*   **Data Siswa**: Manajemen data siswa lengkap dengan level pendidikan dan jadwal.

## Teknologi

*   **Frontend**: React.js
*   **Styling**: Modern CSS (Glassmorphism, Responsive Design)
*   **Database**: Firebase (Firestore)
*   **Storage**: Firebase Storage (untuk foto bukti)

## Instalasi

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/presensi-bimbel.git
    cd presensi-bimbel
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**
    Salin file `.env.example` menjadi `.env.local` dan sesuaikan isinya:
    ```bash
    cp .env.example .env.local
    ```
    Isi `.env.local` dengan kredensial yang sesuai.

4.  **Jalankan Aplikasi**
    ```bash
    npm start
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Project

*   `/src/components`: Komponen React reusable (Forms, Tables, Modals).
*   `/src/pages`: Halaman utama aplikasi (UserPage, AdminPage).
*   `/src/services`: Logika bisnis dan integrasi API (Database, Auth).
*   `/src/styles`: File CSS global dan modular.

## Lisensi

[MIT](LICENSE)
