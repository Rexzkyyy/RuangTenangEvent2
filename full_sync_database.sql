-- ========================================================
-- SQL SYNC EXCEL -> WEB UNTUK MENYAMAKAN NOMINAL
-- Total Nominal Excel Asli : Rp 120970000
-- Total Nominal Web Asli   : Rp 107130000
-- Selisih                  : Rp 13840000
-- ========================================================

-- ========================================================
-- CLEAR PREVIOUS MANUAL INSERTS TO PREVENT DUPLICATES
-- ========================================================
DELETE FROM public.rt_participants_dev WHERE email = 'manual@excel';

-- [INSERT] Missing in Web: NURFITASARI
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'NURFITASARI', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Arnila w rahmi
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Arnila w rahmi', 'manual@excel', '-', 0, '-', 'Gold', '[]', 4, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Visionet Internasional
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Visionet Internasional', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Niarni
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Niarni', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: MAHARDIA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'MAHARDIA', 'manual@excel', '-', 0, '-', 'Silver', '[]', 3, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Sri Rahmayanti
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Sri Rahmayanti', 'manual@excel', '-', 0, '-', 'Gold', '[]', 2, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Rachmad Muqtadir
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Rachmad Muqtadir', 'manual@excel', '-', 0, '-', 'Silver', '[]', 2, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Nur Ramadani
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Nur Ramadani', 'manual@excel', '-', 0, '-', 'Gold', '[]', 3, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: jusrastiwi
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'jusrastiwi', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Nina Desty aspipariana Aksa
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Nina Desty aspipariana Aksa', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: IRA PURNAMASARI
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'IRA PURNAMASARI', 'manual@excel', '-', 0, '-', 'Reguler', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Rahmatul Munawaroh
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Rahmatul Munawaroh', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: adelfin rahayu
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'adelfin rahayu', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: SRI WAHYUNI BASOKA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'SRI WAHYUNI BASOKA', 'manual@excel', '-', 0, '-', 'Reguler', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: MIHAJAR
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'MIHAJAR', 'manual@excel', '-', 0, '-', 'Reguler', '[]', 2, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Alfina damayanti
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Alfina damayanti', 'manual@excel', '-', 0, '-', 'Gold', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: LILI KOMARIA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'LILI KOMARIA', 'manual@excel', '-', 0, '-', 'Gold', '[]', 20, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: SUTRISNA ASWA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'SUTRISNA ASWA', 'manual@excel', '-', 0, '-', 'Reguler', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: NENY SUSANTI
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'NENY SUSANTI', 'manual@excel', '-', 0, '-', 'Silver', '[]', 2, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Alfina Damayanti
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Alfina Damayanti', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: WINDA AYU YULIANA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'WINDA AYU YULIANA', 'manual@excel', '-', 0, '-', 'Reguler', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: MAWAR RUSELIA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'MAWAR RUSELIA', 'manual@excel', '-', 0, '-', 'Gold', '[]', 30, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: LILI KOMARIA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'LILI KOMARIA', 'manual@excel', '-', 0, '-', 'Gold', '[]', 10, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: MARTHA SAMBIRA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'MARTHA SAMBIRA', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: LILI KOMARIA
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'LILI KOMARIA', 'manual@excel', '-', 0, '-', 'Silver', '[]', 10, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: NAROTE
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'NAROTE', 'manual@excel', '-', 0, '-', 'Gold', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [INSERT] Missing in Web: Bu Yuliana Al Khansa
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Bu Yuliana Al Khansa', 'manual@excel', '-', 0, '-', 'Silver', '[]', 45, 'Manual/Excel', '-', '-', '-', true, 'Pending');

-- [DELETE] In Web but not in Excel: Cantika Putri (Expected Rp 200000)
DELETE FROM public.rt_participants_dev WHERE id = '05fb950a-f8f4-4f43-b15e-3854ba888c79';

-- [DELETE] In Web but not in Excel: Rizky amalia (Expected Rp 110000)
DELETE FROM public.rt_participants_dev WHERE id = '0ddc16aa-c62c-4c68-80f7-d4b1b79c15ec';

-- [DELETE] In Web but not in Excel: ida mira (Expected Rp 200000)
DELETE FROM public.rt_participants_dev WHERE id = '1f871439-b96d-4056-bd03-f0042c905b4f';

-- [DELETE] In Web but not in Excel: IBU FARHAH 1 (Expected Rp 1000000)
DELETE FROM public.rt_participants_dev WHERE id = '30027dfa-3ec1-448e-98c9-031eccc4e1d6';

-- [DELETE] In Web but not in Excel: Intsyana Damayanati Turusi (Expected Rp 200000)
DELETE FROM public.rt_participants_dev WHERE id = '3719fd7a-72c8-4b8d-b31a-21cb48d5a398';

-- [DELETE] In Web but not in Excel: KIKI (HOTEL ZAHRAH) (Expected Rp 400000)
DELETE FROM public.rt_participants_dev WHERE id = '40cdebda-077d-4057-a640-01455d638075';

-- [DELETE] In Web but not in Excel: Anastasya lesse (Expected Rp 300000)
DELETE FROM public.rt_participants_dev WHERE id = '4c912e1d-da2d-4d03-9235-e2d95a9fdb3b';

-- [DELETE] In Web but not in Excel: Andi Liya (Expected Rp 150000)
DELETE FROM public.rt_participants_dev WHERE id = '6550b0f1-0740-45bd-b058-5220a498a4f8';

-- [DELETE] In Web but not in Excel: IBU DEA (ATHIFA OLE-OLE) (Expected Rp 600000)
DELETE FROM public.rt_participants_dev WHERE id = '6d5935c1-6348-4e80-93ca-e665b050b657';

-- [DELETE] In Web but not in Excel: IBU MUTI (Expected Rp 400000)
DELETE FROM public.rt_participants_dev WHERE id = '858f47db-3633-40db-9f89-518705d3d2a5';

-- [DELETE] In Web but not in Excel: Yesi surya Ningsih (Expected Rp 200000)
DELETE FROM public.rt_participants_dev WHERE id = '8b1c3ac6-16ed-4505-bdc0-fcb145fcf649';

-- [DELETE] In Web but not in Excel: IBU ISRA (BERAS POKEA) (Expected Rp 400000)
DELETE FROM public.rt_participants_dev WHERE id = '8e86f031-223f-4e25-9169-4868187a6f30';

-- [DELETE] In Web but not in Excel: Ifah (Expected Rp 110000)
DELETE FROM public.rt_participants_dev WHERE id = '91aef07f-cfee-427e-a220-7969d7a663f2';

-- [DELETE] In Web but not in Excel: Ika septiani suwito (Expected Rp 800000)
DELETE FROM public.rt_participants_dev WHERE id = '9b81c760-6917-40a3-bc8b-0599e34838f2';

-- [DELETE] In Web but not in Excel: Anisa amelia saputri (Expected Rp 150000)
DELETE FROM public.rt_participants_dev WHERE id = 'a19bc8c0-c61b-43d3-8113-5d7091e7766d';

-- [DELETE] In Web but not in Excel: MARHADIA (Expected Rp 450000)
DELETE FROM public.rt_participants_dev WHERE id = 'a5cea843-a001-4909-a5f1-e3e4f8cc11c5';

-- [DELETE] In Web but not in Excel: NIA EDWIN (Expected Rp 2400000)
DELETE FROM public.rt_participants_dev WHERE id = 'b079f872-403a-4b67-b5ad-735fc6e2af26';

-- [DELETE] In Web but not in Excel: SITTI FATIMAH SYARIFUDDIN (Expected Rp 220000)
DELETE FROM public.rt_participants_dev WHERE id = 'b0f5684f-978d-4c4c-ab25-bb57c5599fa6';

-- [DELETE] In Web but not in Excel: Silpia ningsi dan suami (Expected Rp 220000)
DELETE FROM public.rt_participants_dev WHERE id = 'b4f036d2-d91a-440b-96d1-8b76c3557463';

-- [DELETE] In Web but not in Excel: CICI KAWAI (Expected Rp 1000000)
DELETE FROM public.rt_participants_dev WHERE id = 'be36e4f2-f735-41b8-888f-9f78ff7cb06f';

-- [DELETE] In Web but not in Excel: Resky Wahyungsih (Expected Rp 300000)
DELETE FROM public.rt_participants_dev WHERE id = 'bea28f49-7fc8-4633-b2fb-09ec07476651';

-- [DELETE] In Web but not in Excel: Hildayanti (Expected Rp 150000)
DELETE FROM public.rt_participants_dev WHERE id = 'c6b2ba99-172d-4968-b2e2-7be0df368c6f';

-- [DELETE] In Web but not in Excel: Suriani (Expected Rp 150000)
DELETE FROM public.rt_participants_dev WHERE id = 'd2d3d9b7-04b0-421a-aaed-151273659055';

-- [DELETE] In Web but not in Excel: Jurastiwi (Expected Rp 150000)
DELETE FROM public.rt_participants_dev WHERE id = 'deb5a425-b05e-437b-b69a-69c1bc19b76b';

-- [DELETE] In Web but not in Excel: Vitaria juprida (Expected Rp 0)
DELETE FROM public.rt_participants_dev WHERE id = 'e6f0f974-57a8-4570-87e3-d7ff43411abd';

-- [DELETE] In Web but not in Excel: FITRIA (Expected Rp 200000)
DELETE FROM public.rt_participants_dev WHERE id = 'ec98afb8-ee87-4258-9747-e0f8ecd47547';

-- [DELETE] In Web but not in Excel: IBU FARHAH 2 (Expected Rp 1000000)
DELETE FROM public.rt_participants_dev WHERE id = 'f6199763-5229-40c1-9a6f-85b096afaa04';

-- [DELETE] In Web but not in Excel: Andi Eka (Expected Rp 150000)
DELETE FROM public.rt_participants_dev WHERE id = 'fc0b27ce-83bb-4482-b2fa-632cb6c74700';

-- [DELETE] In Web but not in Excel: CELINE (Expected Rp 1400000)
DELETE FROM public.rt_participants_dev WHERE id = 'fd9ac803-0793-41b5-90c7-dd156e77677c';

-- Total UPDATE (Data Kuning/Hijau yg disesuaikan): 0
-- Total INSERT (Data Merah yg ditambahkan): 27
-- Total DELETE (Data yg hanya ada di Web tapi ga bayar): 29
-- Setelah skrip ini dijalankan, total tiket di Web akan persis dengan Excel.
