# Analisis Kecocokan Data Rekening Koran vs Website

## Ringkasan
- Total data di Excel (Rekening Koran): 405
- Total data di Website (SQL): 407

## Hasil Pencocokan
- **Cocok (Berdasarkan Nama)**: 378
- **Ada di Excel, Tidak ada di Website**: 27
- **Ada di Website, Tidak ada di Excel**: 29

### 1. Perbedaan Tiket/Nominal (Pada data yang cocok)
| Nama Excel | Jenis (Excel) | Jml (Excel) | Nominal (Excel) | Nama Web | Jenis (Web) | Jml (Web) | Expected Nominal |
|---|---|---|---|---|---|---|---|
| Intan Dwi Putri | GOLD | 0 | 200000 | Intan Dwi Putri | Gold | 1 | 200000 |
| Nur fadila syukri | SILVER | 2 | 300000 | Nur fadila syukri | Silver | 1 | 150000 |
| Retno wulandari | SILVER | 1 | 150000 | Retno Wulandari | Silver 150K | 1 | 150000 |
| Indri Asrul | GOLD | 1 | 200000 | Indri Asrul | Gold 200K | 1 | 200000 |
| SRI IRMAYANI | SILVER | 2 | 300000 | irma | Silver | 1 | 150000 |
| Delvys | SILVER | 1 | 150000 | Delvys | Gold | 1 | 200000 |
| TRI NOVIANTI | reguler | 1 | 110000 | Tri Novianti | Reguler 110K | 1 | 110000 |
| BASRI HAMISI | GOLD | 1 | 200000 | Basri Hamisi | Gold 200K | 1 | 200000 |
| Hasniran | GOLD | 1 | 200000 | Hasniran | Gold 200K | 1 | 200000 |
| Noviana | GOLD | 1 | 200000 | Noviana | Gold | 2 | 400000 |
| Lena Rahmawati | GOLD | 2 | 370000 | Lena Rahmawati | Gold | 2 | 400000 |
| Siti Sarina | GOLD | 1 | 200000 | Siti Sarina | Gold 200K | 1 | 200000 |
| Ariyati Ekakumala sari | SILVER | 1 | 150000 | Ariyati Ekakumala sari | Silver 150K | 1 | 150000 |
| Ratnasari | GOLD | 2 | 400000 | Sisca Ratnasari | Reguler | 1 | 110000 |
| Hasna | SILVER | 2 | 300000 | Hasna | Reguler | 1 | 110000 |
| Dwi yani | SILVER | 1 | 150000 | Fitri Suryani | Reguler 110K | 2 | 220000 |
| HIKMA | SILVER | 0 | 150000 | Hikma | Silver | 1 | 150000 |
| Riska | GOLD | 4 | 200000 | Riska | Gold - SOLD OUT | 1 | 200000 |
| Niswatul Hasanah | GOLD | 1 | 200000 | Niswatul Hasanah | Gold - SOLD OUT | 1 | 200000 |
| Putry Diyah Ulhaq | GOLD | 1 | 200000 | Putri Diya Ulhaq | Gold - SOLD OUT | 1 | 200000 |
| RISKI AYU DWI LESTARI | GOLD | 2 | 400000 | Riski Ayu Dwi Lestari | Gold - SOLD OUT | 2 | 400000 |
| Intsyana damayanti turusi | GOLD | 1 | 200000 | Alfina damayanti Rahman | Silver 150K | 2 | 300000 |
| Wa Ode Sari Amalia | GOLD | 1 | 200000 | Wa Ode Sari Amalia | Gold - SOLD OUT | 1 | 200000 |
| Neny Andriyani dan Sunarty kiki | GOLD | 2 | 400000 | Neny Andriyani dan Sunarty kiki | Gold - SOLD OUT | 2 | 400000 |
| Sevtimas | GOLD | 3 | 600000 | Sevtimas | Gold - SOLD OUT | 3 | 600000 |
| Rahma Nastir | GOLD | 4 | 800000 | Rahmatul Munawwarah | Silver | 1 | 150000 |
| Yuli Damayanti | SILVER | 1 | 150000 | Yuliana Mansyur | Reguler | 1 | 110000 |
| Nur Fitria | SILVER | 2 | 150000 | Nur Fitria A | Silver | 1 | 150000 |
| mustika siska sagita | SILVER | 0 | 150000 | Mustika Siska Sagita | Silver | 1 | 150000 |
| HASRIANI | GOLD | 3 | 600000 | Hasriani | Gold (SOLD OUT) | 3 | 600000 |
| Iin Sri Rahayu | SILVER | 2 | 300000 | Iin sri rahayu | Gold 200K | 2 | 400000 |
| Riska Mariadi | SILVER | 1 | 110000 | Riska mariadi | Silver 150K | 1 | 150000 |
| Iin Sri Rahayu | Unknown | 0 | 100000 | Adelfin Rahayu | Silver 150K | 1 | 150000 |
| HARMILA WATI | GOLD | 3 | 600000 | Harmila wati | Silver | 4 | 600000 |
| RESKY WAHYU NINGSIH | SILVER | 2 | 300000 | Sri Wahyuni Basoka | Reguler | 1 | 110000 |
| Neny Andryani | SILVER | 1 | 150000 | Neny susanti | Silver | 2 | 300000 |
| Siti Fatimah Syarif | REGULER | 2 | 220000 | Risnawati Syarif | Silver | 1 | 150000 |
| Hasna | REGULER | 1 | 110000 | Hasna | Silver | 2 | 300000 |
| siti Aminah | GOLD | 1 | 200000 | St aminah | Gold 200K | 1 | 200000 |
| Dewi Shanita | reguler | 1 | 110000 | Wadan Dewi Sari | Reguler 110K | 1 | 110000 |
| Asrida Aryani Asahir | reguler | 4 | 440000 | Asrida Aryani Asahir | Reguler 110K | 4 | 440000 |
| sri yeni | SILVER | 2 | 220000 | Sri yeni | Reguler | 2 | 220000 |
| KARTINI | GOLD | 1 | 200000 | Kartini | Gold 200K | 1 | 200000 |
| Nurjannah Hamid | SILVER | 1 | 150000 | Nurjannah hamid | Silver 150K | 1 | 150000 |
| Nina Desty | SILVER | 1 | 160000 | Nina Desty aspipariana Aksa | Silver | 2 | 300000 |
| iin nurnaningsih | GOLD | 4 | 1000000 | Lin Nurnaningsih | Gold | 4 | 800000 |
| Yunitri wita | GOLD | 2 | 500000 | Yunitri wita | Gold | 2 | 400000 |
| sutriani | REGULER | 1 | 110000 | Sutriani | Silver | 1 | 150000 |
| Sutriani | SILVER | 1 | 150000 | Sutriani aswa | Reguler | 1 | 110000 |
| Nur Afni Liambo | REGULER | 2 | 220000 | Nur Afni Liambo | Reguler 110K | 2 | 220000 |
| wd ratna sartika dewi | SILVER | 2 | 300000 | NANA RATNASARI | Gold | 2 | 400000 |
| Alfina Damayanti | SILVER | 2 | 300000 | Alfina damayanti | Silver 150K | 1 | 150000 |
| titi Haryani ST | SILVER | 5 | 750000 | Titi Haryani | Silver 150K | 5 | 750000 |
| misnawati | SILVER | 1 | 150000 | Misnawati | Silver 150K | 1 | 150000 |
| elma prasetyaningsih | REGULER | 3 | 330000 | Elma Prasetyaningsih, SKM | Reguler 110K | 3 | 330000 |
| hawaera | GOLD | 2 | 200000 | Hawaera | Gold | 1 | 200000 |
| Erni Yatin | REGULER | 1 | 110000 | Erni Yatin | Reguler 110K | 1 | 110000 |
| nur fitri rasidah | REGULER | 1 | 110000 | FITRI (ASIA BARU) | Gold 200K | 2 | 400000 |
| Eryn Sasmita | SILVER | 3 | 450000 | Eryn Sasmita | Silver 150K | 3 | 450000 |
| wadan dewi sari | SILVER | 1 | 150000 | Nurita Sari | Silver | 2 | 300000 |
| HASLIAN NOVIYANTI | SILVER | 2 | 300000 | Haslian Noviyanti | Silver 150K | 2 | 300000 |
| MIHAJAR | REGULER | 2 | 220000 | Mihajar | Reguler | 4 | 440000 |
| ALFIANTI KUSUMA | SILVER | 1 | 150000 | Alfianti Kusuma Ningrum | Silver 150K | 1 | 150000 |
| NISMAYANTI | SILVER | 1 | 150000 | Nismayanti | Silver | 2 | 300000 |
| MUH. NAZAR EKA SETIAWAN | SILVER | 2 | 300000 | Muh. Nazar Eka Setiawan | Silver 150K | 2 | 300000 |
| RIKA YANI | GOLD | 2 | 400000 | Rika Yani | Gold 200K | 2 | 400000 |
| NURITA SARI | SILVER | 2 | 300000 | Nirmalasari | Reguler | 2 | 220000 |
| IRMAWATI | SILVER | 1 | 150000 | Dirmawati .A | Reguler 110K | 3 | 330000 |
| WIDYA PURNAMA | SILVER | 1 | 300000 | Widyawati Purnama ramli | Silver | 2 | 300000 |
| FITRI SURYANI | REGULER | 2 | 220000 | nur fitri rasyidah | Reguler | 1 | 110000 |
| NURASFIDAR | REGULER | 1 | 110000 | Nurasfidar | Reguler 110K | 1 | 110000 |
| SHELVI T | REGULER | 8 | 800000 | Shelvi T | Reguler | 8 | 880000 |
| HALIJAH | GOLD | 3 | 600000 | Halijah | Gold | 1 | 200000 |
| susiana | GOLD | 1 | 200000 | Susianah | Gold 200K | 1 | 200000 |
| RAMLIANI | GOLD | 1 | 200000 | Ramliani | Gold 200K | 1 | 200000 |

### 2. Data di Rekening Koran (Excel) tapi BELUM ada/Tidak Cocok di Website
(Kemungkinan pendaftar sudah transfer tapi belum isi form, atau nama berbeda jauh)
| Nama | Jenis | Jml | Nominal |
|---|---|---|---|
| NURFITASARI | SILVER | 1 | 150000 |
| Arnila w rahmi | GOLD | 4 | 800000 |
| Visionet Internasional | SILVER | 1 | 150000 |
| Niarni | SILVER | 1 | 150000 |
| MAHARDIA | SILVER | 3 | 450000 |
| Sri Rahmayanti | GOLD | 2 | 600000 |
| Rachmad Muqtadir | SILVER | 2 | 300000 |
| Nur Ramadani | GOLD | 3 | 600000 |
| jusrastiwi | SILVER | 1 | 150000 |
| Nina Desty aspipariana Aksa | SILVER | 1 | 150000 |
| IRA PURNAMASARI | REGULER | 1 | 110000 |
| Rahmatul Munawaroh | SILVER | 1 | 150000 |
| adelfin rahayu | SILVER | 1 | 150000 |
| SRI WAHYUNI BASOKA | REGULER | 1 | 110000 |
| MIHAJAR | REGULER | 2 | 220000 |
| Alfina damayanti | GOLD | 1 | 200000 |
| LILI KOMARIA | GOLD | 20 | 4000000 |
| SUTRISNA ASWA | reguler | 1 | 110000 |
| NENY SUSANTI | SILVER | 2 | 300000 |
| Alfina Damayanti | SILVER | 1 | 150000 |
| WINDA AYU YULIANA | REGULER | 1 | 110000 |
| MAWAR RUSELIA | GOLD | 30 | 6000000 |
| LILI KOMARIA | GOLD | 10 | 2750000 |
| MARTHA SAMBIRA | SILVER | 1 | 150000 |
| LILI KOMARIA | SILVER | 10 | 750000 |
| NAROTE | GOLD | 1 | 200000 |
| Bu Yuliana Al Khansa | SILVER | 45 | 7410000 |

### 3. Data di Website tapi TIDAK ditemukan/Tidak Cocok di Rekening Koran (Excel)
(Kemungkinan belum transfer, atau nama berbeda jauh)
| Nama | Jenis | Jml |
|---|---|---|
| Cantika Putri | Gold 200K | 1 |
| Rizky amalia | Reguler | 1 |
| ida mira | Gold | 1 |
| IBU FARHAH 1 | Gold 200K | 5 |
| Intsyana Damayanati Turusi | Gold - SOLD OUT | 1 |
| KIKI (HOTEL ZAHRAH) | Gold 200K | 2 |
| Anastasya lesse | Silver | 2 |
| Andi Liya | Silver | 1 |
| IBU DEA (ATHIFA OLE-OLE) | Gold 200K | 3 |
| IBU MUTI | Gold 200K | 2 |
| Yesi surya Ningsih | Gold | 1 |
| IBU ISRA (BERAS POKEA) | Gold 200K | 2 |
| Ifah | Reguler | 1 |
| Ika septiani suwito | Gold | 4 |
| Anisa amelia saputri | Silver | 1 |
| MARHADIA | Silver | 3 |
| NIA EDWIN | Gold 200K | 12 |
| SITTI FATIMAH SYARIFUDDIN | Reguler | 2 |
| Silpia ningsi dan suami | Reguler 110K | 2 |
| CICI KAWAI | Gold 200K | 5 |
| Resky Wahyungsih | Silver | 2 |
| Hildayanti | Silver | 1 |
| Suriani | Silver | 1 |
| Jurastiwi | Silver | 1 |
| Vitaria juprida |  | 1 |
| FITRIA | Gold 200K | 1 |
| IBU FARHAH 2 | Gold 200K | 5 |
| Andi Eka | Silver | 1 |
| CELINE | Gold 200K | 7 |
