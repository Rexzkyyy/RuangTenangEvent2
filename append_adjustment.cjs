const fs = require('fs');
let sql = fs.readFileSync('full_sync_database.sql', 'utf8');

// Hapus baris penyesuaian sebelumnya (jika ada)
sql = sql.replace(/-- \[ADJUSTMENT\] Menyesuaikan sisa selisih hitungan Excel vs Web \(Rp 740\.000\)[\s\S]*?(?=(-- ========================================================|$))/gi, '');
sql = sql.replace(/-- \[ADJUSTMENT FINAL\].*/g, '');

const newAdjustment = `
-- ========================================================
-- [ADJUSTMENT FINAL] Menyesuaikan selisih dari Sheet Offline/Keep
-- Target Nominal: Rp 123.710.000
-- Total DB saat ini: Rp 120.230.000
-- Kekurangan: Rp 3.480.000 (15 Gold, 1 Silver, 3 Reguler)
-- ========================================================
DELETE FROM public.rt_participants_dev WHERE nama_lengkap = 'KOREKSI SISTEM (Selisih Harga Excel)' OR nama_lengkap = 'KOREKSI SISTEM (Tiket Offline/Keep)';

INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'KOREKSI SISTEM (Tiket Offline/Keep)', 'manual@excel', '-', 0, '-', 'Gold', '[]', 15, 'Manual/Excel', '-', '-', '-', true, 'Pending'),
(gen_random_uuid(), NOW(), 'KOREKSI SISTEM (Tiket Offline/Keep)', 'manual@excel', '-', 0, '-', 'Silver', '[]', 1, 'Manual/Excel', '-', '-', '-', true, 'Pending'),
(gen_random_uuid(), NOW(), 'KOREKSI SISTEM (Tiket Offline/Keep)', 'manual@excel', '-', 0, '-', 'Reguler', '[]', 3, 'Manual/Excel', '-', '-', '-', true, 'Pending');
`;

fs.writeFileSync('full_sync_database.sql', sql + newAdjustment);
console.log("Updated!");
