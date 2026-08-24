const fs = require('fs');
const xlsx = require('xlsx');

// 1. Read Excel
const workbookIn = xlsx.readFile('new DATA PEMBAYARAN TIKET DR AISA DAHLAN (2).xlsx');
const sheetName = workbookIn.SheetNames.find(s => s.toLowerCase().includes('rekening koran'));
const sheet = workbookIn.Sheets[sheetName];
const excelData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const excelParticipants = [];
for (let i = 5; i < excelData.length; i++) {
    const row = excelData[i];
    if (!row || row.length === 0) continue;
    const nominal = row[3];
    let nama = row[4];
    if (!nama) nama = row[2]; // fallback
    const jenis = row[5];
    const jumlah = row[6];
    
    if (nama && nominal) {
        excelParticipants.push({
            nama_lower: String(nama).trim().toLowerCase(),
            original_nama: String(nama).trim(),
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
            
            sqlParticipants.push({
                id: id,
                nama_lower: nama.toLowerCase(),
                original_nama: nama,
                jenis: jenis,
                jumlah: jumlah
            });
        }
    }
}

// 3. Generate Update SQL Queries
let updateQueries = `-- ==========================================\n`;
updateQueries += `-- SCRIPT UPDATE DATABASE DARI REKENING KORAN\n`;
updateQueries += `-- ==========================================\n\n`;

let updateCount = 0;
const sqlCopy = [...sqlParticipants];

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
    
    if (foundIdx !== -1) {
        const sp = sqlCopy[foundIdx];
        sqlCopy.splice(foundIdx, 1); // remove from array so it won't be matched again
        
        let targetJenis = ep.jenis;
        if (targetJenis.toLowerCase() === 'gold') targetJenis = 'Gold';
        if (targetJenis.toLowerCase() === 'silver') targetJenis = 'Silver';
        if (targetJenis.toLowerCase() === 'reguler') targetJenis = 'Reguler';
        
        // Buat query update, memaksa data di web mengikuti Excel
        updateQueries += `-- Match: Excel (${ep.original_nama}) -> Web (${sp.original_nama})\n`;
        updateQueries += `UPDATE public.rt_participants \n`;
        updateQueries += `SET jenis_tiket = '${targetJenis}',\n`;
        updateQueries += `    jumlah_tiket = ${ep.jumlah}\n`;
        updateQueries += `WHERE id = '${sp.id}';\n\n`;
        updateCount++;
    }
});

updateQueries += `-- Total data yang akan diupdate: ${updateCount}\n`;

fs.writeFileSync('sync_database.sql', updateQueries);
console.log('Successfully generated sync_database.sql');
