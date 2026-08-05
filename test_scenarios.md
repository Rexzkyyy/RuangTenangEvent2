# Skenario Pengujian: Fitur Import Excel (Opsi B)

Gunakan tabel di bawah ini sebagai panduan untuk menguji ketangguhan sistem Anda. Anda bisa mencoba membuat satu file Excel (`.xlsx` atau `.csv`) yang berisi skenario-skenario ini, lalu import ke dalam aplikasi.

Silakan catat hasilnya (Sukses / Gagal) beserta catatan tambahan jika ada yang tidak sesuai ekspektasi.

| No | Skenario Pengujian (Kondisi Data Excel) | Ekspektasi Hasil (Yang Seharusnya Terjadi) | Status Pengujian | Catatan Anda |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Data Normal:** Memasukkan pendaftar baru dengan WA 10-15 digit, Nama, Email, dan Tiket yang valid. | Data masuk sebagai **baris baru** di tabel. | `[ ]` | |
| **2** | **WA Terlalu Pendek:** Memasukkan pendaftar dengan nomor WA kurang dari 10 digit (Misal: `08123`). | Sistem **menolak/mengabaikan** baris ini secara diam-diam. Tidak masuk database. | `[ ]` | |
| **3** | **WA Terlalu Panjang:** Memasukkan pendaftar dengan nomor WA lebih dari 15 digit (Misal: `08123456789012345`). | Sistem **menolak/mengabaikan** baris ini secara diam-diam. Tidak masuk database. | `[ ]` | |
| **4** | **Update Data (Duplikat Persis):** Memasukkan data dengan WA, Nama, dan Tiket yang **sama persis** dengan yang sudah ada di database, tapi mengganti usia-nya di Excel. | Sistem **TIDAK** membuat baris baru. Sistem akan **menimpa (update)** data usia orang tersebut dengan data usia yang baru. | `[ ]` | |
| **5** | **Beda Orang (WA Sama, Nama Beda):** Memasukkan pendaftar dengan nomor WA dan Tiket sama, tapi **Namanya** sangat berbeda (Misal ayah & anak daftar pakai WA sama). | Sistem menganggapnya sebagai orang yang berbeda dan memasukkannya sebagai **baris baru**. | `[ ]` | |
| **6** | **Tiket Toleransi (WA Sama, Tiket Beda):** Memasukkan pendaftar dengan WA & Nama yang sama, tapi **Jenis Tiketnya berbeda** (Misal: Beli VIP, lalu beli lagi Reguler). | Sistem mengizinkan dan memasukkannya sebagai **baris baru**. | `[ ]` | |
| **7** | **Filter Dalam 1 File (Duplikat Persis):** Di dalam 1 file Excel yang sama, Anda sengaja menaruh 2 baris data yang **sama persis** (WA, Nama, Tiket). | Di layar *Preview* sebelum klik simpan, sistem hanya akan menampilkan **1 baris** saja (otomatis dibuang satu). | `[ ]` | |
| **8** | **Filter Dalam 1 File (Beda Tiket):** Di dalam 1 file Excel yang sama, ditaruh 2 baris data dengan WA sama tapi **Tiket beda**. | Di layar *Preview*, **keduanya muncul** dan siap disimpan. | `[ ]` | |

---

### Cara Melaporkan Hasil Uji Coba:
Anda cukup membalas pesan di *chat* dengan format seperti ini:
> "Skenario 1 Sukses. Skenario 2 Gagal, datanya tetap masuk."
> "Skenario 4 sukses tapi status pembayarannya malah ikut keriset."

Saya akan langsung menganalisis dan memperbaiki kodenya jika ada skenario yang Gagal. Selamat mencoba!
