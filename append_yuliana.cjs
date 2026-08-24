const fs = require('fs');
let sql = fs.readFileSync('reset_and_sync_120.sql', 'utf8');

// Cek apakah sudah pernah ditambah supaya tidak double
if (!sql.includes("Menambahkan tiket Reguler Yuliana Al Khansa")) {
    const tambahan = `
-- ========================================================
-- [ADJUSTMENT FINAL] Menambahkan tiket Reguler Yuliana Al Khansa
-- ========================================================
INSERT INTO public.rt_participants_dev 
(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)
VALUES 
(gen_random_uuid(), NOW(), 'Yuliana Al Khansa', 'manual@excel', '-', 0, '-', 'Reguler', '[]', 6, 'Manual/Excel', '-', '-', '-', true, 'Pending');
`;
    fs.writeFileSync('reset_and_sync_120.sql', sql + tambahan);
    console.log('Tiket Reguler Yuliana berhasil ditambahkan ke script!');
} else {
    console.log('Sudah ditambahkan sebelumnya.');
}
