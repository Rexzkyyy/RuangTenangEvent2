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
    if (!nama) nama = row[2]; // fallback to nama pengirim
    const jenis = row[5];
    const jumlah = row[6];
    
    if (nama && nominal) {
        excelParticipants.push({
            original_row: row,
            nama_lower: String(nama).trim().toLowerCase(),
            original_nama: String(nama).trim(),
            nominal: Number(nominal) || 0,
            jenis: jenis ? String(jenis).trim() : 'Unknown',
            jumlah: Number(jumlah) || 0,
            tanggal: row[1] || '',
            nama_pengirim: row[2] || '',
            keterangan: row[8] || ''
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
            let nama = fields[2].replace(/^'|'$/g, '');
            let jenis = fields[7].replace(/^'|'$/g, '');
            let jumlah = parseInt(fields[9], 10);
            
            sqlParticipants.push({
                nama_lower: nama.toLowerCase(),
                original_nama: nama,
                jenis: jenis,
                jumlah: jumlah
            });
        }
    }
}

// 3. Match and Prepare Data for New Excel
const reportData = [];
const sqlCopy = [...sqlParticipants];

excelParticipants.forEach(ep => {
    let foundIdx = -1;
    // 1. Exact match
    foundIdx = sqlCopy.findIndex(sp => sp.nama_lower === ep.nama_lower);
    
    // 2. Contains match
    if (foundIdx === -1) {
        foundIdx = sqlCopy.findIndex(sp => {
            const spName = sp.nama_lower.replace(/[^a-z0-9]/g, '');
            const epName = ep.nama_lower.replace(/[^a-z0-9]/g, '');
            return spName.includes(epName) || epName.includes(spName);
        });
    }
    
    // 3. Word matching
    if (foundIdx === -1) {
        const epWords = ep.nama_lower.split(' ').filter(w => w.length > 3);
        if (epWords.length > 0) {
            foundIdx = sqlCopy.findIndex(sp => {
                return epWords.some(w => sp.nama_lower.includes(w));
            });
        }
    }
    
    let status = 'TIDAK DITEMUKAN DI WEB';
    let spData = { original_nama: '-', jenis: '-', jumlah: '-' };
    let expectedPrice = 0;
    
    if (foundIdx !== -1) {
        const sp = sqlCopy[foundIdx];
        spData = sp;
        
        if (sp.jenis.toLowerCase().includes('gold')) expectedPrice = 200000 * sp.jumlah;
        else if (sp.jenis.toLowerCase().includes('silver')) expectedPrice = 150000 * sp.jumlah;
        else if (sp.jenis.toLowerCase().includes('reguler')) expectedPrice = 110000 * sp.jumlah;
        else if (sp.jenis.toLowerCase().includes('200k')) expectedPrice = 200000 * sp.jumlah;
        
        const jenisMatch = ep.jenis.toLowerCase().replace(/[^a-z]/g, '') === sp.jenis.toLowerCase().replace(/[^a-z]/g, '');
        
        if (ep.jumlah === sp.jumlah && (ep.nominal === expectedPrice || expectedPrice === 0)) {
            status = 'SAMA/SESUAI';
        } else {
            status = 'TIDAK SESUAI (Beda Harga/Jumlah/Jenis)';
        }
        
        sqlCopy.splice(foundIdx, 1);
    }
    
    reportData.push({
        'Tanggal Transfer (Excel)': ep.tanggal,
        'Nama Pengirim (Excel)': ep.nama_pengirim,
        'Nama Pendaftar (Excel)': ep.original_nama,
        'Jenis Tiket (Excel)': ep.jenis,
        'Jumlah Tiket (Excel)': ep.jumlah,
        'Nominal Transfer (Excel)': ep.nominal,
        'Keterangan (Excel)': ep.keterangan,
        'Status Kesesuaian': status,
        'Nama Pendaftar (Web)': spData.original_nama,
        'Jenis Tiket (Web)': spData.jenis,
        'Jumlah Tiket (Web)': spData.jumlah,
        'Expected Nominal (Web)': expectedPrice > 0 ? expectedPrice : '-'
    });
});

// Add those in Web but not in Excel
sqlCopy.forEach(sp => {
    let expectedPrice = 0;
    if (sp.jenis.toLowerCase().includes('gold')) expectedPrice = 200000 * sp.jumlah;
    else if (sp.jenis.toLowerCase().includes('silver')) expectedPrice = 150000 * sp.jumlah;
    else if (sp.jenis.toLowerCase().includes('reguler')) expectedPrice = 110000 * sp.jumlah;
    
    reportData.push({
        'Tanggal Transfer (Excel)': '-',
        'Nama Pengirim (Excel)': '-',
        'Nama Pendaftar (Excel)': '-',
        'Jenis Tiket (Excel)': '-',
        'Jumlah Tiket (Excel)': '-',
        'Nominal Transfer (Excel)': '-',
        'Keterangan (Excel)': '-',
        'Status Kesesuaian': 'ADA DI WEB, TIDAK ADA DI EXCEL',
        'Nama Pendaftar (Web)': sp.original_nama,
        'Jenis Tiket (Web)': sp.jenis,
        'Jumlah Tiket (Web)': sp.jumlah,
        'Expected Nominal (Web)': expectedPrice > 0 ? expectedPrice : '-'
    });
});

// 4. Write to new Excel file
const newWorkbook = xlsx.utils.book_new();
const newSheet = xlsx.utils.json_to_sheet(reportData);

// Adjust column widths
const colWidths = [
    { wch: 15 }, // Tanggal Transfer
    { wch: 25 }, // Nama Pengirim
    { wch: 25 }, // Nama Pendaftar
    { wch: 15 }, // Jenis Tiket
    { wch: 15 }, // Jumlah Tiket
    { wch: 20 }, // Nominal
    { wch: 25 }, // Keterangan
    { wch: 40 }, // Status Kesesuaian
    { wch: 25 }, // Nama Web
    { wch: 20 }, // Jenis Web
    { wch: 15 }, // Jumlah Web
    { wch: 20 }  // Expected Nominal
];
newSheet['!cols'] = colWidths;

xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Laporan Rekonsiliasi');
xlsx.writeFile(newWorkbook, 'Laporan_Kesesuaian_Data_Web_Excel.xlsx');

console.log('Successfully generated Laporan_Kesesuaian_Data_Web_Excel.xlsx');
