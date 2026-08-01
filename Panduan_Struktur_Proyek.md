# Panduan Struktur & Fitur Proyek Ruang-Tenang

Dokumen ini menjelaskan secara mendetail struktur direktori, serta rincian fitur-fitur yang ada di dalam masing-masing komponen, halaman (pages), utilitas (utils), dan file-file penting di dalam proyek **Ruang-Tenang**. 

Gunakan panduan ini sebagai contekan (referensi) saat Anda melakukan *prompting* kepada AI agar AI dapat langsung menargetkan file dan fitur yang tepat tanpa mengubah logika yang tidak perlu.

---

## 📂 1. Struktur Utama & Konfigurasi (`src/`)

Direktori `src/` adalah tempat semua logika aplikasi React (Vite) berjalan.

- **`main.tsx`**
  - **Fitur:** *Entry point* (titik awal) aplikasi. Tempat di mana React melakukan *render* komponen utama `<App />` ke dalam DOM HTML (`index.html`).
- **`App.tsx`**
  - **Fitur:** Pusat pengaturan Rute (Routing) menggunakan `react-router-dom`. Mendefinisikan URL publik (seperti `/t/:id` dan `/login`) dan URL terproteksi (seperti `/admin`, `/penjualan`, `/scanner`) yang dibungkus dengan `<ProtectedRoute>` dan `<AppLayout>`. Menggunakan fitur *Lazy Loading* (`React.lazy`) agar aplikasi memuat halaman lebih cepat.
- **`types.ts`**
  - **Fitur:** File tipe data (TypeScript Interfaces). Menyimpan definisi struktur `RTParticipant` yang merepresentasikan struktur tabel database (seperti tipe data untuk `id`, `nama_lengkap`, `status_pembayaran`, `bukti_transfer_url`, dll).
- **`utils.ts`**
  - **Fitur:** Kumpulan fungsi bantuan (*helper*).
    - `formatTicketCode`: Mengubah ID acak atau nomor urut menjadi format kode unik seperti `JSMH001` atau `JSMH123`.
    - `normalizeJenisTiket`: Menyeragamkan/merapikan penulisan nama kategori tiket (contoh: mengubah "PROMO" menjadi "Silver Diskon 100k").
- **`supabaseClient.ts`**
  - **Fitur:** Inisialisasi koneksi ke *database* Supabase. Digunakan oleh seluruh halaman untuk melakukan aksi CRUD (Create, Read, Update, Delete) ke *database*.
- **`index.css` & `App.css`**
  - **Fitur:** Global CSS. `index.css` digunakan untuk memuat sistem utilitas dari *Tailwind CSS*.
- **`ticket.css`**
  - **Fitur:** CSS kustom dan animasi spesifik yang didedikasikan 100% hanya untuk mempercantik tampilan visual dari E-Tiket fisik di halaman `PublicTicket`.

---

## 🧩 2. Komponen Pendukung (`src/components/`)

- **`AppLayout.tsx`**
  - **Fitur Utama:** 
    - Kerangka dasar tata letak Admin.
    - Menampilkan *Sidebar Navigasi* (Dashboard, Tambah Manual, Penjualan, Scanner) di sebelah kiri.
    - Menangani responsivitas (memiliki *Hamburger Menu* untuk tampilan layar HP).
    - Menangani fungsi Logout dari sistem.
- **`ProtectedRoute.tsx`**
  - **Fitur Utama:** 
    - Penjaga keamanan berbasis rute (*Route Guard*). 
    - Mengecek apakah ada *Session* aktif dari Supabase. Jika *user* (Admin) belum login, secara otomatis menendang (*redirect*) pengguna kembali ke halaman `/login`.

---

## 📄 3. Halaman Lengkap (`src/pages/`)

### A. `AdminDashboard.tsx`
File ini adalah *Controller* utama paling besar dan paling kompleks untuk manajemen data panitia.
- **Fitur-Fitur Detail:**
  - **Tabel Data Real-Time:** Menampilkan data seluruh peserta pendaftar event dari Supabase.
  - **Pencarian Cerdas (Search):** Mencari peserta berdasarkan Nama, Email, Nomor WA, atau ID Tiket dengan fitur *Debounce* (menunggu selesai mengetik sebelum mencari).
  - **Filter Ganda:** Menyaring data berdasarkan *Status Pembayaran* (Semua, Lunas, Pending) dan *Kategori Tiket* (Silver, VIP, Mahasiswa).
  - **Pengurutan (Sort):** Mengurutkan data (Naik/Turun) berdasarkan Tanggal Daftar, Nama, atau Kategori.
  - **Modal Detail Lengkap:** Ketika tombol detail (ikon mata) ditekan, akan muncul *Pop-up Modal* yang berisi info lengkap pendaftar (termasuk foto bukti transfer, usia, jawaban kuesioner dari database).
  - **Tombol Kirim WhatsApp:** Mengisi otomatis pesan *template* ke aplikasi WhatsApp peserta yang berisi pemberitahuan nomor tiket dan link E-Tiket mereka.
  - **Toggle Status Bayar:** Tombol cepat (satu klik) untuk mengubah status "Pending" menjadi "Lunas" (dan sebaliknya).
  - **Ekspor PDF & Data:** Fitur mencetak dan mengunduh data daftar peserta atau analisis penjualan ke format tabel PDF (menggunakan `jspdf`).
  - **Fungsi Import (Jika ada):** Memasukkan data peserta secara massal.

### B. `PublicTicket.tsx`
Halaman yang bisa diakses publik (tanpa login) melalui URL `.../t/[ID-Peserta]`. 
- **Fitur-Fitur Detail:**
  - **Pengambilan Data (Fetch):** Otomatis mencari data dari Supabase berdasarkan ID atau Barcode di URL.
  - **Desain Hybrid E-Tiket:** Membangun antarmuka visual tiket yang indah, mirip seperti cetakan tiket acara profesional dengan gaya potret/landscape.
  - **Generator Barcode:** Memanfaatkan library `react-barcode` untuk mencetak kode batang (*barcode*) unik yang bisa di-scan oleh kamera panitia.
  - **Unduh Sebagai Gambar (PNG):** Memotong/Mencetak (screenshot) elemen kode tiket (*div*) menjadi file gambar menggunakan `html2canvas` agar peserta bisa menyimpannya ke Galeri HP.
  - **Unduh Sebagai PDF:** Mengkonversi gambar tiket tersebut menjadi dokumen PDF via `jspdf`.
  - **Badge Status Keamanan:** Menampilkan tanda silang/tunggu merah jika "Belum Lunas", dan lencana "Terverifikasi" warna hijau jika pembayaran sudah diverifikasi panitia.

### C. `Scanner.tsx`
Alat utama panitia di lokasi (on-the-spot) untuk mencatat absensi/kehadiran.
- **Fitur-Fitur Detail:**
  - **Akses Kamera Perangkat:** Menggunakan library `html5-qrcode` untuk membaca kode QR atau Barcode dari layar HP peserta secara otomatis (bisa berganti antara kamera depan dan belakang).
  - **Check-In Otomatis:** Setelah barcode terbaca, sistem mencari datanya di tabel `rt_participants`. Jika data ada dan status lunas, sistem akan memberikan tanda 'Hadir' (mengupdate kolom `jumlah_checkin`).
  - **Suara Konfirmasi:** Membunyikan suara *beep* atau notifikasi saat pemindaian berhasil atau gagal.
  - **Log Kehadiran:** Menampilkan daftar riwayat orang-orang yang baru saja berhasil di-*scan* di bawah layar.

### D. `DataPenjualan.tsx`
Halaman visualisasi data dan laporan finansial khusus panitia acara.
- **Fitur-Fitur Detail:**
  - **Perhitungan Total Pendapatan (Revenue):** Menjumlahkan otomatis seluruh transaksi peserta yang berstatus "Lunas".
  - **Perhitungan Tiket Terjual:** Memisahkan perhitungan antara peserta yang berstatus Lunas vs Pending.
  - **Grafik/Progress Bar Kategori:** Memecah statistik penjualan berdasarkan jenis tiket (Berapa persen VIP, berapa persen Silver, dll).

### E. `TambahManual.tsx`
Halaman Input data alternatif jika pendaftaran tidak dari Form Publik.
- **Fitur-Fitur Detail:**
  - **Formulir Input Peserta:** Field seperti Nama Lengkap, Email, Usia, No HP, Asal Institusi/Kota.
  - **Pemilihan Tiket:** Dropdown menu untuk memilih tipe Tiket dan harganya.
  - **Upload Berkas (File):** Fitur (jika diaktifkan) untuk mengunggah Bukti Transfer atau Bukti Follow Instagram ke *Supabase Storage*, kemudian mengambil URL filenya.
  - **Simpan ke DB:** Setelah klik 'Simpan', data dikirim (*Insert*) langsung ke tabel `rt_participants` dan Admin dapat melihatnya di `AdminDashboard.tsx`.

### F. `Login.tsx`
- **Fitur-Fitur Detail:**
  - **Supabase Auth:** Menghubungkan email dan kata sandi admin ke layanan autentikasi bawaan Supabase. Menampilkan pesan error jika sandi salah atau akun tidak ditemukan.

---

## 💡 Contoh Efektif Cara Prompting ke AI Menggunakan Detail Ini

Dengan memahami fitur-fitur di atas, *prompt* (perintah) yang Anda ketik ke AI bisa menjadi jauh lebih spesifik dan akurat:

**Contoh 1: Mengubah logika di AdminDashboard**
> *"AI, saya ingin menambahkan tombol baru bernama 'Salin Link Tiket' di samping tombol 'Kirim WA'. Tombol ini fungsinya menyalin URL (`ticketUrl`) ke dalam clipboard komputer. File yang harus diubah adalah `src/pages/AdminDashboard.tsx`."*

**Contoh 2: Menambah fitur di Scanner**
> *"AI, tolong modifikasi fungsi `onScanSuccess` di file `src/pages/Scanner.tsx`. Saya mau agar jika `status_pembayaran` peserta masih 'Pending', layar akan memunculkan peringatan warna merah besar bahwa 'PESERTA BELUM BAYAR' dan tidak mencatat absensinya."*

**Contoh 3: Mengedit tampilan Publik Tiket**
> *"AI, coba buka file `src/pages/PublicTicket.tsx` dan `src/ticket.css`. Saya ingin membesarkan ukuran Font pada bagian nama peserta (Nama Lengkap) di tiket, dan menambahkan logo sponsor di pojok kanan bawah tiket."*
