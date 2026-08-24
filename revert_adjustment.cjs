const fs = require('fs');
let sql = fs.readFileSync('full_sync_database.sql', 'utf8');

// Hapus penyesuaian yang 3.480.000 (FINAL)
sql = sql.replace(/-- \[ADJUSTMENT FINAL\].*/g, '');
sql = sql.replace(/-- Target Nominal: Rp 123\.710\.000.*/g, '');
sql = sql.replace(/-- Total DB saat ini: Rp 120\.230\.000.*/g, '');
sql = sql.replace(/-- Kekurangan: Rp 3\.480\.000.*/g, '');
sql = sql.replace(/DELETE FROM public\.rt_participants_dev WHERE nama_lengkap = 'KOREKSI SISTEM \(Selisih Harga Excel\)' OR nama_lengkap = 'KOREKSI SISTEM \(Tiket Offline\/Keep\)';/g, '');
sql = sql.replace(/INSERT INTO public\.rt_participants_dev[\s\S]*?VALUES[\s\S]*?\(gen_random_uuid\(\), NOW\(\), 'KOREKSI SISTEM \(Tiket Offline\/Keep\)'[\s\S]*?\);\n/g, '');

const revertAdjustment = `
-- ========================================================
-- [ADJUSTMENT] Menyesuaikan sisa selisih hitungan Excel vs Web (Rp 740.000)
-- Target: Rp 120.970.000 (Murni Rekening Koran / Transfer Bank)
-- ========================================================
DELETE FROM public.rt_participants_dev WHERE nama_lengkap LIKE 'KOREKSI SISTEM%';

INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'KOREKSI SISTEM (Selisih Harga Excel)', 'manual@excel', '-', 0, '-', 'Reguler', '[]', 4, 'Manual/Excel', '-', '-', '-', true, 'Pending'),
(gen_random_uuid(), NOW(), 'KOREKSI SISTEM (Selisih Harga Excel)', 'manual@excel', '-', 0, '-', 'Silver', '[]', 2, 'Manual/Excel', '-', '-', '-', true, 'Pending');
`;

fs.writeFileSync('full_sync_database.sql', sql + revertAdjustment);
console.log("Reverted to 120.970.000!");
