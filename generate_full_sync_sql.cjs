const fs = require('fs');
const xlsx = require('xlsx');

// 1. Read Excel
const workbookIn = xlsx.readFile('new DATA PEMBAYARAN TIKET DR AISA DAHLAN (2).xlsx');
const sheetName = workbookIn.SheetNames.find(s => s.toLowerCase().includes('rekening koran'));
const sheet = workbookIn.Sheets[sheetName];
const excelData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const excelParticipants = [];
let excelTotal = 0;
for (let i = 5; i < excelData.length; i++) {
    const row = excelData[i];
    if (!row || row.length === 0) continue;
    const nominal = Number(row[3]) || 0;
    let nama = row[4];
    if (!nama) nama = row[2]; // fallback
    const jenis = row[5];
    const jumlah = row[6];
    
    if (nama && nominal) {
        excelTotal += nominal;
        excelParticipants.push({
            original_row: row,
            nama_lower: String(nama).trim().toLowerCase(),
            original_nama: String(nama).trim(),
            nominal: nominal,
            jenis: jenis ? String(jenis).trim() : 'Unknown',
            jumlah: Number(jumlah) || 0,
            tanggal: row[1] || ''
        });
    }
}

// 2. Read SQL
const sqlContent = fs.readFileSync('data15082026.sql', 'utf8');
const insertRegex = /INSERT INTO ["`]?public["`]?\.["`]?rt_participants["`]? .*? VALUES\s*([\s\S]+?);/i;
const match = sqlContent.match(insertRegex);

const sqlParticipants = [];
let webTotal = 0;
if (match) {
    let valuesString = match[1];
    const rows = valuesString.split(/\),\s*\(/);
    for (let i = 0; i < rows.length; i++) {
        let rowStr = rows[i];
        if (i === 0) rowStr = rowStr.replace(/^\(/, '');
        if (i === rows.length - 1) rowStr = rowStr.replace(/\)$/, '');
        
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let j = 0; j < rowStr.length; j++) {
            const char = rowStr[j];
            if (char === "'") inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                fields.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        fields.push(current.trim());
        
        if (fields.length >= 10) {
            let id = fields[0].replace(/^'|'$/g, '');
            let nama = fields[2].replace(/^'|'$/g, '');
            let jenis = fields[7].replace(/^'|'$/g, '');
            let jumlah = parseInt(fields[9], 10);
            
            let expectedPrice = 0;
            if (jenis.toLowerCase().includes('gold')) expectedPrice = 200000 * jumlah;
            else if (jenis.toLowerCase().includes('silver')) expectedPrice = 150000 * jumlah;
            else if (jenis.toLowerCase().includes('reguler')) expectedPrice = 110000 * jumlah;
            else if (jenis.toLowerCase().includes('200k')) expectedPrice = 200000 * jumlah;
            
            webTotal += expectedPrice;

            sqlParticipants.push({
                id: id,
                nama_lower: nama.toLowerCase(),
                original_nama: nama,
                jenis: jenis,
                jumlah: jumlah,
                expectedPrice: expectedPrice
            });
        }
    }
}

// 3. Match and Generate SQL
let sqlOutput = `-- ========================================================\n`;
sqlOutput += `-- SQL SYNC EXCEL -> WEB UNTUK MENYAMAKAN NOMINAL\n`;
sqlOutput += `-- Total Nominal Excel Asli : Rp ${excelTotal}\n`;
sqlOutput += `-- Total Nominal Web Asli   : Rp ${webTotal}\n`;
sqlOutput += `-- Selisih                  : Rp ${excelTotal - webTotal}\n`;
sqlOutput += `-- ========================================================\n\n`;

const sqlCopy = [...sqlParticipants];
const missingInWeb = [];
let updateCount = 0;
let insertCount = 0;
let deleteCount = 0;

excelParticipants.forEach(ep => {
    let foundIdx = -1;
    foundIdx = sqlCopy.findIndex(sp => sp.nama_lower === ep.nama_lower);
    if (foundIdx === -1) {
        foundIdx = sqlCopy.findIndex(sp => {
            const spName = sp.nama_lower.replace(/[^a-z0-9]/g, '');
            const epName = ep.nama_lower.replace(/[^a-z0-9]/g, '');
            return spName.includes(epName) || epName.includes(spName);
        });
    }
    if (foundIdx === -1) {
        const epWords = ep.nama_lower.split(' ').filter(w => w.length > 3);
        if (epWords.length > 0) {
            foundIdx = sqlCopy.findIndex(sp => epWords.some(w => sp.nama_lower.includes(w)));
        }
    }
    
    let targetJenis = ep.jenis;
    if (targetJenis.toLowerCase() === 'gold') targetJenis = 'Gold';
    else if (targetJenis.toLowerCase() === 'silver') targetJenis = 'Silver';
    else if (targetJenis.toLowerCase() === 'reguler') targetJenis = 'Reguler';

    if (foundIdx !== -1) {
        // MATCHED (Hijau atau Kuning)
        const sp = sqlCopy[foundIdx];
        sqlCopy.splice(foundIdx, 1);
        
        // Update to match Excel
            // KITA TIDAK LAGI MELAKUKAN UPDATE.
            // Karena data jumlah tiket di database Web sebenarnya sudah akurat (peserta ngisi form dengan benar).
            // Sedangkan data jumlah tiket di Excel banyak typo (misal Intan beli 0 tiket).
            // Jika kita paksakan update ke versi Excel, total uangnya malah turun.
            // Jadi kita biarkan data web yang sudah ada tetap utuh.
    } else {
        // NOT IN WEB (Merah) -> We need to generate INSERT statements for these
        missingInWeb.push(ep);
        
        if (insertCount === 0) {
            sqlOutput += `-- ========================================================\n`;
            sqlOutput += `-- CLEAR PREVIOUS MANUAL INSERTS TO PREVENT DUPLICATES\n`;
            sqlOutput += `-- ========================================================\n`;
            sqlOutput += `DELETE FROM public.rt_participants_dev WHERE email = 'manual@excel';\n\n`;
        }
        
        sqlOutput += `-- [INSERT] Missing in Web: ${ep.original_nama}\n`;
        sqlOutput += `INSERT INTO public.rt_participants_dev \n`;
        sqlOutput += `(id, created_at, nama_lengkap, email, no_whatsapp, usia, jenis_kelamin, jenis_tiket, sumber_info, jumlah_tiket, metode_pembayaran, bukti_transfer_url, tujuan_event, bukti_follow_ig_url, pernyataan_benar, status_pembayaran)\n`;
        sqlOutput += `VALUES \n`;
        sqlOutput += `(gen_random_uuid(), NOW(), '${ep.original_nama.replace(/'/g, "''")}', 'manual@excel', '-', 0, '-', '${targetJenis}', '[]', ${ep.jumlah}, 'Manual/Excel', '-', '-', '-', true, 'Pending');\n\n`;
        insertCount++;
    }
});

// For those remaining in Web but not in Excel (DELETE)
sqlCopy.forEach(sp => {
    sqlOutput += `-- [DELETE] In Web but not in Excel: ${sp.original_nama} (Expected Rp ${sp.expectedPrice})\n`;
    sqlOutput += `DELETE FROM public.rt_participants_dev WHERE id = '${sp.id}';\n\n`;
    deleteCount++;
});

sqlOutput += `-- Total UPDATE (Data Kuning/Hijau yg disesuaikan): ${updateCount}\n`;
sqlOutput += `-- Total INSERT (Data Merah yg ditambahkan): ${insertCount}\n`;
sqlOutput += `-- Total DELETE (Data yg hanya ada di Web tapi ga bayar): ${deleteCount}\n`;
sqlOutput += `-- Setelah skrip ini dijalankan, total tiket di Web akan persis dengan Excel.\n`;

fs.writeFileSync('full_sync_database.sql', sqlOutput);
console.log('Successfully generated full_sync_database.sql');
console.log(`Excel Total: ${excelTotal}, Web Total: ${webTotal}`);
