# PRD — Upgrade Sistem Ruang Tenang
### (Clone Infrastruktur E-Tiket → Ruang-Tenang)

## Latar Belakang

Proyek **Ruang-Tenang** (`C:\laragon\www\Ruang-Tenang`) sudah berjalan dengan tiga halaman:
- `/` → Form Pendaftaran (akan **dihapus/dinonaktifkan**)
- `/admin` → Admin Dashboard (akan **di-upgrade**)
- `/scanner` → Scanner QR (sudah lengkap, **tidak berubah**)

Permintaan ini adalah **clone infrastruktur E-Tiket** ke dalam proyek Ruang-Tenang — artinya menambahkan fitur-fitur dari E-Tiket yang belum ada di Ruang-Tenang.

---

## Perbedaan: Sebelum vs Sesudah

| Aspek | Ruang-Tenang Saat Ini | Setelah Upgrade |
|---|---|---|
| Rute `/` | Form Pendaftaran (publik) | Redirect ke `/admin` |
| Pendaftaran | Via form di web | **Via Google Forms → Import Excel ke Admin** |
| Login Admin | ❌ Tidak ada (admin terbuka) | ✅ Login wajib (Supabase Auth) |
| Filter Admin | Hanya search nama & WA | ✅ Filter lengkap ala Supabase UI |
| Import Data | ❌ Tidak ada | ✅ Upload `.xlsx` / `.csv` dari Google Spreadsheet |
| Tiket Publik | ❌ Tidak ada | ✅ Halaman `/t/:id` (clone dari E-Tiket) |
| Scanner | ✅ Sudah ada | ✅ Tidak berubah |

---

## Alur Kerja Baru (User Journey)

```
📋 Pra-Event:
1. Peserta isi Google Forms (eksternal, bukan di web ini)
2. Data otomatis masuk ke Google Spreadsheet
3. Admin download Spreadsheet → simpan sebagai .xlsx
4. Admin login ke /admin (wajib, pakai email + password)
5. Admin klik "Import Excel" → upload file .xlsx
6. Sistem baca kolom, auto-generate barcode, simpan ke Supabase
7. Admin verifikasi bukti transfer → ubah Pending → Lunas

🎪 Hari-H:
8. Panitia buka /scanner → scan QR tiket peserta
9. Sistem check kuota → approve / reject

🎫 Peserta (opsional):
10. Peserta buka /t/:id → lihat tiket + QR code
```

---

## Perubahan yang Direncanakan

### 1. `App.tsx` — Routing Baru
#### [MODIFY] [App.tsx](file:///c:/laragon/www/Ruang-Tenang/src/App.tsx)
- Hapus route `/` → `<FormRegistration />`
- Tambah route `/` → redirect ke `/admin`
- Tambah route `/login` → `<Login />`
- Wrap route `/admin` dengan `<ProtectedRoute>`
- Wrap route `/scanner` dengan `<ProtectedRoute>`
- Tambah route `/t/:id` → `<PublicTicket />` (publik, tidak perlu login)

---

### 2. [NEW] `Login.tsx` — Clone dari E-Tiket
#### [NEW] `src/pages/Login.tsx`
- Form email + password dengan Supabase Auth (`supabase.auth.signInWithPassword`)
- Redirect otomatis ke `/admin` setelah login berhasil
- UI identik dengan E-Tiket: dark/gradient modern

---

### 3. [NEW] `ProtectedRoute.tsx` — Clone dari E-Tiket
#### [NEW] `src/components/ProtectedRoute.tsx`
- Cek session Supabase (`supabase.auth.getSession`)
- Jika belum login → redirect ke `/login`
- Jika sudah login → render children

---

### 4. `AdminDashboard.tsx` — Upgrade Besar
#### [MODIFY] [AdminDashboard.tsx](file:///c:/laragon/www/Ruang-Tenang/src/pages/AdminDashboard.tsx)

**A. Tambah Filter Bar (sesuai permintaan UI Supabase)**
```
Filter by: [id ▼] [created_at ▼] [nama_lengkap ▼] [status_pembayaran ▼]   + Add filter
Sort: [created_at ▼] [Ascending/Descending]
```

**B. Tambah tombol "Import Excel"**
- Buka modal upload
- User drag-and-drop atau pilih file `.xlsx` / `.csv`
- Sistem baca kolom dan mapping ke `rt_participants`:

| Kolom Google Spreadsheet | Kolom Supabase |
|---|---|
| Timestamp | `created_at` |
| Nama Lengkap | `nama_lengkap` |
| Email | `email` |
| No. WhatsApp | `no_whatsapp` |
| Usia | `usia` |
| Jenis Kelamin | `jenis_kelamin` |
| Jenis Tiket | `jenis_tiket` |
| Dari mana... | `sumber_info` |
| Jumlah Tiket | `jumlah_tiket` |
| Metode Pembayaran | `metode_pembayaran` |
| Upload Bukti Transfer | `bukti_transfer_url` |
| Apa yang ingin... | `tujuan_event` |
| Bukti Follow IG | `bukti_follow_ig_url` |
| Saya menyatakan... | `pernyataan_benar` |

- Auto-generate `barcode` = `uuid()` untuk setiap baris
- Set `status_pembayaran` = `'Pending'`, `jumlah_checkin` = `0` untuk data baru
- Tampil preview jumlah baris sebelum konfirmasi import
- Setelah import berhasil → reload tabel

**C. Tambah tombol Logout**
- `supabase.auth.signOut()` → redirect ke `/login`

**D. Upgrade Search/Filter**
- Filter multi-kolom (id, nama, created_at range, status_pembayaran, jenis_tiket)
- Semua filter berjalan real-time (client-side) dari data yang sudah di-fetch

---

### 5. [NEW] `PublicTicket.tsx` — Clone dari E-Tiket
#### [NEW] `src/pages/PublicTicket.tsx`
- Route: `/t/:id`
- Fetch data peserta berdasarkan `id` dari URL
- Tampil: nama, jenis tiket, jumlah tiket, status pembayaran
- Tampil QR Code berisi `id` peserta (pakai library `qrcode.react`)
- UI card bergaya tiket konser

---

### 6. `types.ts` — Tambah field `barcode`
#### [MODIFY] [types.ts](file:///c:/laragon/www/Ruang-Tenang/src/types.ts)
- Tambah field `barcode?: string` ke interface `RTParticipant`

---

## Dependencies Baru yang Perlu Diinstall

```bash
# QR Code generator (untuk halaman tiket publik)
npm install qrcode.react
npm install @types/qrcode.react

# (xlsx sudah ada di package.json)
```

---

## Schema Database — Tidak Ada Perubahan

Tabel `rt_participants` sudah lengkap dengan semua kolom yang dibutuhkan.
Yang perlu ditambahkan hanya kolom `barcode` jika belum ada:

```sql
ALTER TABLE rt_participants ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;
```

---

## File yang Tersentuh

| File | Status | Keterangan |
|---|---|---|
| `src/App.tsx` | MODIFY | Routing baru + ProtectedRoute |
| `src/pages/AdminDashboard.tsx` | MODIFY | Import Excel, Filter, Logout |
| `src/pages/Login.tsx` | NEW | Halaman login admin |
| `src/pages/PublicTicket.tsx` | NEW | Tiket publik dengan QR |
| `src/components/ProtectedRoute.tsx` | NEW | Auth guard |
| `src/types.ts` | MODIFY | Tambah field `barcode` |
| `src/pages/FormRegistration.tsx` | TIDAK DISENTUH | Tetap ada tapi tidak di-route lagi |
| `src/pages/Scanner.tsx` | TIDAK DISENTUH | Sudah sempurna |

---

## Verification Plan

### Build & Type Check
```bash
cd C:\laragon\www\Ruang-Tenang
npm run build
```

### Manual Testing
1. Buka `/login` → login dengan akun Supabase
2. Redirect ke `/admin` → coba akses tanpa login → harus redirect ke `/login`
3. Upload file `.xlsx` dari Google Forms → cek data masuk ke Supabase
4. Filter by status_pembayaran → ubah Pending → Lunas
5. Export Excel → cek kolom sesuai format Google Forms
6. Buka `/t/:id` → cek QR code muncul
7. Scan QR di `/scanner` → cek check-in berhasil
