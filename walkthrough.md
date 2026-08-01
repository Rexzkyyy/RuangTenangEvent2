# 🎉 Walkthrough: Sistem Registrasi Ruang Tenang

Proyek *clone* "Ruang Tenang" Anda telah selesai dibangun di folder baru: `C:\laragon\www\Ruang-Tenang`.

## Apa Saja yang Telah Dibuat?

### 1. Struktur Proyek Bersih
Proyek ini dibuat menggunakan React (Vite) dan Tailwind CSS yang terpisah sepenuhnya dari E-Tiket, sehingga tidak mengganggu kode lama Anda.

### 2. Form Pendaftaran (Halaman Utama)
- Tampilan form didesain sangat mirip dengan **Google Forms** (menggunakan sistem *Card*).
- Otomatis memvalidasi nomor HP (harus diawali `+62`).
- Fitur upload foto **Bukti Transfer** & **Follow IG** langsung terkoneksi ke Supabase Storage.
- Mengirimkan jumlah tiket secara fleksibel sesuai pesanan.

### 3. Dashboard Admin (`/admin`)
- Tabel pendaftar lengkap dengan tombol ubah status pembayaran (Pending/Lunas).
- Anda bisa melihat/mendownload gambar bukti secara langsung.
- **Fitur Andalan:** Tombol **Export Excel** yang akan menghasilkan file Excel dengan format *persis* seperti hasil download Google Form.

### 4. Scanner Cerdas (`/scanner`)
- Menggunakan kamera device untuk membaca barcode/QR.
- **Logika Kuota:** Menghitung jumlah check-in berdasarkan jumlah tiket.
  - Scan 1: Check-in 1/3 (Berhasil)
  - Scan 4: Akses Ditolak (Kuota Habis)

---

## 🚀 Langkah Selanjutnya (Tugas Anda)

Karena kodenya sudah selesai, sekarang giliran Anda untuk mengaktifkan databasenya:

> [!IMPORTANT]
> **Jalankan Script Database**
> 1. Buka folder `C:\laragon\www\Ruang-Tenang`.
> 2. Buka file bernama `rt_schema.sql` (bisa dibuka dengan Notepad/VSCode).
> 3. *Copy* seluruh isi teks di file tersebut.
> 4. Buka **Supabase Dashboard** proyek E-Tiket Anda.
> 5. Masuk ke menu **SQL Editor**, paste kodenya di sana, lalu klik **Run**.

Setelah itu, Anda tinggal menjalankan proyeknya di terminal/CMD dengan perintah:
```bash
cd C:\laragon\www\Ruang-Tenang
npm run dev
```

Selamat menikmati sistem baru Anda! Jika ada yang error atau ingin disesuaikan (misal: warna tema, teks pertanyaan), beri tahu saya.
