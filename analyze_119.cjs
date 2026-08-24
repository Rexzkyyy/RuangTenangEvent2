const fs = require('fs');
const xlsx = require('xlsx');

// 1. Baca Excel
const workbook = xlsx.readFile('new DATA PEMBAYARAN TIKET DR AISA DAHLAN (2).xlsx');
const sheet = workbook.Sheets['REKENING KORAN'];
const excelData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const excelRecords = [];
for (let i = 5; i < excelData.length; i++) {
    const row = excelData[i];
    if (!row || row.length === 0) continue;
    
    let originalNama = row[2] ? String(row[2]).trim() : '';
    let pendaftarNama = row[4] ? String(row[4]).trim() : '';
    let nominal = parseInt(row[3]) || 0;
    
    let namaToUse = pendaftarNama || originalNama;
    if (namaToUse && nominal > 0) {
        excelRecords.push({ nama: namaToUse, originalNama, pendaftarNama, nominal, rowNum: i + 1 });
    }
}

// 2. Baca SQL
const sqlContent = fs.readFileSync('reset_and_sync_120.sql', 'utf8');
const lines = sqlContent.split('\n');

const webRecords = [];
const prices = {
    'reguler': 110000,
    'silver': 150000,
    'gold': 200000
};

// Ekstrak VALUES dari script SQL
for (const line of lines) {
    if (line.includes("('") && line.includes("', '") && !line.startsWith("--")) {
        try {
            // Regex sederhana untuk parsing:
            // (id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, ...)
            const match = line.match(/\(.*?, .*?, '(.*?)', '.*?', '.*?', .*?, '.*?', '(.*?)', '.*?', (\d+),/);
            if (match) {
                const nama = match[1];
                const jenis = match[2];
                const jumlah = parseInt(match[3]);
                
                const harga = prices[jenis.toLowerCase()] || 0;
                const totalHarga = harga * jumlah;
                
                webRecords.push({
                    nama, jenis, jumlah, totalHarga
                });
            }
        } catch (e) {
            // Abaikan jika tidak cocok
        }
    }
}

// 3. Bandingkan
const report = [];
let totalWeb = 0;
let totalExcel = 0;

webRecords.forEach(web => {
    totalWeb += web.totalHarga;
});
excelRecords.forEach(ex => {
    totalExcel += ex.nominal;
});

report.push(`# Laporan Perbedaan Final (Web vs Excel)`);
report.push(`Total di Web berdasarkan Script: **Rp ${totalWeb.toLocaleString('id-ID')}**`);
report.push(`Total di Excel (Transfer Bank): **Rp ${totalExcel.toLocaleString('id-ID')}**`);
report.push(`Selisih: **Rp ${(totalExcel - totalWeb).toLocaleString('id-ID')}**\n`);

report.push(`| Nama di Web | Jenis (Web) | Jml (Web) | Harga di Web | Nominal di Excel | Selisih (Kurang di Web) |`);
report.push(`|---|---|---|---|---|---|`);

// Kita coba cocokkan nama Web dengan Excel
webRecords.forEach(web => {
    const webNameLower = web.nama.toLowerCase();
    
    // Cari kecocokan di Excel
    let match = excelRecords.find(ex => ex.nama.toLowerCase() === webNameLower || ex.originalNama.toLowerCase() === webNameLower);
    
    if (!match) {
        // Cari pakai includes jika gak nemu
        match = excelRecords.find(ex => ex.nama.toLowerCase().includes(webNameLower) || webNameLower.includes(ex.nama.toLowerCase()));
    }
    
    if (match) {
        if (web.totalHarga !== match.nominal) {
            const diff = match.nominal - web.totalHarga;
            report.push(`| ${web.nama} | ${web.jenis} | ${web.jumlah} | ${web.totalHarga} | ${match.nominal} | **${diff}** |`);
        }
    } else {
        // Gagal nyocokin
        // report.push(`| ${web.nama} | ${web.jenis} | ${web.jumlah} | ${web.totalHarga} | - | Tidak ketemu di excel |`);
    }
});

// Cek yang ada di excel tapi ga ada di web (karena gagal matching atau hilang)
report.push(`\n### Data di Excel yang mungkin tidak terpanggil / Gagal Masuk Web:`);
report.push(`| Nama Excel | Nominal Excel |`);
report.push(`|---|---|`);
excelRecords.forEach(ex => {
    const exNameLower = ex.nama.toLowerCase();
    let match = webRecords.find(web => web.nama.toLowerCase() === exNameLower || web.nama.toLowerCase().includes(exNameLower) || exNameLower.includes(web.nama.toLowerCase()));
    if (!match) {
        report.push(`| ${ex.nama} | ${ex.nominal} |`);
    }
});

fs.writeFileSync('Laporan_Web_119_vs_Excel.md', report.join('\n'));
console.log('Selesai menganalisis!');
