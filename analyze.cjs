const fs = require('fs');
const xlsx = require('xlsx');

// 1. Read Excel
const workbook = xlsx.readFile('new DATA PEMBAYARAN TIKET DR AISA DAHLAN (2).xlsx');
const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('rekening koran'));
const sheet = workbook.Sheets[sheetName];
const excelData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const excelParticipants = [];
for (let i = 5; i < excelData.length; i++) {
    const row = excelData[i];
    if (!row || row.length === 0) continue;
    
    // index 3 is nominal, index 4 is nama_pendaftar (or index 2 nama), index 5 jenis_tiket, index 6 jumlah
    const nominal = row[3];
    let nama = row[4];
    if (!nama) nama = row[2]; // fallback to nama pengirim
    const jenis = row[5];
    const jumlah = row[6];
    
    if (nama && nominal) {
        excelParticipants.push({
            nama: String(nama).trim().toLowerCase(),
            original_nama: String(nama).trim(),
            nominal: Number(nominal) || 0,
            jenis: jenis ? String(jenis).trim() : 'Unknown',
            jumlah: Number(jumlah) || 0
        });
    }
}

// 2. Read SQL
const sqlContent = fs.readFileSync('data15082026.sql', 'utf8');
const insertRegex = /INSERT INTO ["`]?public["`]?\.["`]?rt_participants["`]? .*? VALUES\s*([\s\S]+?);/i;
const match = sqlContent.match(insertRegex);

const sqlParticipants = [];
if (match) {
    let valuesString = match[1];
    
    // This is a naive split that might fail on strings with `), (`, but for now let's do a simple parse
    // Split by `), (`
    const rows = valuesString.split(/\),\s*\(/);
    for (let i = 0; i < rows.length; i++) {
        let rowStr = rows[i];
        if (i === 0) rowStr = rowStr.replace(/^\(/, '');
        if (i === rows.length - 1) rowStr = rowStr.replace(/\)$/, '');
        
        // Split by comma outside quotes. This is tricky, so let's use a small state machine
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < rowStr.length; j++) {
            const char = rowStr[j];
            if (char === "'") {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        fields.push(current.trim());
        
        if (fields.length >= 10) {
            // id=0, created_at=1, nama_lengkap=2, email=3, no_wa=4, usia=5, jk=6, jenis_tiket=7, sumber=8, jumlah_tiket=9
            let nama = fields[2].replace(/^'|'$/g, '');
            let jenis = fields[7].replace(/^'|'$/g, '');
            let jumlah = parseInt(fields[9], 10);
            
            sqlParticipants.push({
                nama: nama.toLowerCase(),
                original_nama: nama,
                jenis: jenis,
                jumlah: jumlah
            });
        }
    }
}

// 3. Match
let report = `# Analisis Kecocokan Data Rekening Koran vs Website\n\n`;

report += `## Ringkasan\n`;
report += `- Total data di Excel (Rekening Koran): ${excelParticipants.length}\n`;
report += `- Total data di Website (SQL): ${sqlParticipants.length}\n\n`;

const matched = [];
const notInSql = [];
const notInExcel = [];

const sqlCopy = [...sqlParticipants];

excelParticipants.forEach(ep => {
    let foundIdx = -1;
    // Extract first word or try better matching
    // Some names have titles like "Dr.", "Hj.", etc. Or they only input first name.
    
    // 1. Exact match
    foundIdx = sqlCopy.findIndex(sp => sp.nama === ep.nama);
    
    // 2. Contains match
    if (foundIdx === -1) {
        foundIdx = sqlCopy.findIndex(sp => {
            const spName = sp.nama.replace(/[^a-z0-9]/g, '');
            const epName = ep.nama.replace(/[^a-z0-9]/g, '');
            return spName.includes(epName) || epName.includes(spName);
        });
    }
    
    // 3. Word matching
    if (foundIdx === -1) {
        const epWords = ep.nama.split(' ').filter(w => w.length > 3);
        if (epWords.length > 0) {
            foundIdx = sqlCopy.findIndex(sp => {
                return epWords.some(w => sp.nama.includes(w));
            });
        }
    }
    
    if (foundIdx !== -1) {
        const sp = sqlCopy[foundIdx];
        matched.push({ excel: ep, sql: sp });
        sqlCopy.splice(foundIdx, 1);
    } else {
        notInSql.push(ep);
    }
});

notInExcel.push(...sqlCopy);

report += `## Hasil Pencocokan\n`;
report += `- **Cocok (Berdasarkan Nama)**: ${matched.length}\n`;
report += `- **Ada di Excel, Tidak ada di Website**: ${notInSql.length}\n`;
report += `- **Ada di Website, Tidak ada di Excel**: ${notInExcel.length}\n\n`;

report += `### 1. Perbedaan Tiket/Nominal (Pada data yang cocok)\n`;
report += `| Nama Excel | Jenis (Excel) | Jml (Excel) | Nominal (Excel) | Nama Web | Jenis (Web) | Jml (Web) | Expected Nominal |\n`;
report += `|---|---|---|---|---|---|---|---|\n`;
let diffCount = 0;
matched.forEach(m => {
    let priceMatch = true;
    let expectedPrice = 0;
    if (m.sql.jenis === 'Reguler') expectedPrice = 110000 * m.sql.jumlah;
    if (m.sql.jenis === 'Silver') expectedPrice = 150000 * m.sql.jumlah;
    if (m.sql.jenis === 'Gold') expectedPrice = 200000 * m.sql.jumlah;
    if (m.sql.jenis === 'Gold 200K') expectedPrice = 200000 * m.sql.jumlah; // example
    if (m.sql.jenis.toLowerCase().includes('gold')) expectedPrice = 200000 * m.sql.jumlah;
    if (m.sql.jenis.toLowerCase().includes('silver')) expectedPrice = 150000 * m.sql.jumlah;
    if (m.sql.jenis.toLowerCase().includes('reguler')) expectedPrice = 110000 * m.sql.jumlah;
    
    if (m.excel.jenis.toLowerCase().replace(/[^a-z]/g, '') !== m.sql.jenis.toLowerCase().replace(/[^a-z]/g, '') || 
        m.excel.jumlah !== m.sql.jumlah || 
        m.excel.nominal !== expectedPrice) {
        
        report += `| ${m.excel.original_nama} | ${m.excel.jenis} | ${m.excel.jumlah} | ${m.excel.nominal} | ${m.sql.original_nama} | ${m.sql.jenis} | ${m.sql.jumlah} | ${expectedPrice} |\n`;
        diffCount++;
    }
});
if (diffCount === 0) report += `| (Semua cocok) | - | - | - | - | - | - | - |\n`;
report += `\n`;

report += `### 2. Data di Rekening Koran (Excel) tapi BELUM ada/Tidak Cocok di Website\n`;
report += `(Kemungkinan pendaftar sudah transfer tapi belum isi form, atau nama berbeda jauh)\n`;
report += `| Nama | Jenis | Jml | Nominal |\n`;
report += `|---|---|---|---|\n`;
notInSql.slice(0, 50).forEach(ep => {
    report += `| ${ep.original_nama} | ${ep.jenis} | ${ep.jumlah} | ${ep.nominal} |\n`;
});
if (notInSql.length > 50) report += `| ...dan ${notInSql.length - 50} lainnya | | | |\n`;
report += `\n`;

report += `### 3. Data di Website tapi TIDAK ditemukan/Tidak Cocok di Rekening Koran (Excel)\n`;
report += `(Kemungkinan belum transfer, atau nama berbeda jauh)\n`;
report += `| Nama | Jenis | Jml |\n`;
report += `|---|---|---|\n`;
notInExcel.slice(0, 50).forEach(sp => {
    report += `| ${sp.original_nama} | ${sp.jenis} | ${sp.jumlah} |\n`;
});
if (notInExcel.length > 50) report += `| ...dan ${notInExcel.length - 50} lainnya | | |\n`;

fs.writeFileSync('analisis_rekening.md', report);
console.log('Analysis written to analisis_rekening.md');
