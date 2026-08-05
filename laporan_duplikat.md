# Laporan Analisis Data Duplikat 
> [!NOTE]
> Laporan ini dibuat berdasarkan analisis otomatis dari file `data_02082026.sql` untuk membantu panitia merapikan database peserta.

## 1. Data *Double* (Nama & No. WA Sama Persis)
> [!WARNING]
> Data di bawah ini terindikasi mendaftar atau terinput dua kali. Disarankan untuk menghapus salah satu datanya agar jumlah peserta akurat.

| Nama Lengkap | No. WhatsApp | Jumlah Data | Keterangan |
| :--- | :--- | :---: | :--- |
| **Siti Sarina** | `6281240154496` | 2 | Perlu dihapus salah satunya |
| **Diyan Mabil** | `6285227390765` | 2 | Perlu dihapus salah satunya |
| **Basri Hamisi** | `6285394171159` | 2 | Perlu dihapus salah satunya |
| **Retno Wulandari** | `6282345156747` | 2 | Perlu dihapus salah satunya |
| **Fatma dan H. Ashar** | `6285372667043` | 2 | Perlu dihapus salah satunya |
| **Nening Suarni Hatmi** | `6285241575836` | 2 | Perlu dihapus salah satunya |

---

## 2. Nama Sama, Tetapi No. WA Berbeda
> [!TIP]
> Kemungkinan orang yang sama menggunakan dua nomor berbeda, atau terjadi *typo* / nomor terpotong pada saat pengisian form. Silakan diverifikasi langsung ke peserta.

| Nama Lengkap | No. WA ke-1 | No. WA ke-2 | Catatan / Indikasi |
| :--- | :--- | :--- | :--- |
| **Tri Novianti** | `62813612` | `6281355561256` | WA ke-1 kemungkinan terpotong / *typo* |
| **Wa Ode Nasrawati** | `6281617801330` | `6282280486032` | Memakai dua nomor yang berbeda |
| **Indri Asrul** | `62822912` | `6282291697226` | WA ke-1 kemungkinan terpotong |
| **Mulkiah** | `62822912` | `6282293143463` | WA ke-1 kemungkinan terpotong |
| **Desiyanti.Z** | `685396220277` | `62539611` | Salah ketik nomor / *typo* |

---

## 3. No. WA Sama, Tetapi Nama Berbeda
> [!TIP]
> Biasanya terjadi jika satu orang mendaftarkan beberapa temannya atau keluarganya sekaligus menggunakan nomor kontak yang sama.

| No. WhatsApp | Pendaftar ke-1 | Pendaftar ke-2 | Catatan / Indikasi |
| :--- | :--- | :--- | :--- |
| `6285217774012` | **Cantika Putri** | **Helma jaya** | Mendaftarkan 2 orang dengan 1 WA |
| `6281222272520` | **Andi Liya** | **Mutmainna** | Mendaftarkan 2 orang dengan 1 WA |
| `62822912` | **Mulkiah** | **Indri Asrul** | Nomor terpotong di form (*Error* Input) |
