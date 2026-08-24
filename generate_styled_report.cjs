const fs = require('fs');
const xlsx = require('xlsx'); // for reading
const ExcelJS = require('exceljs'); // for writing with style

async function generateReport() {
    console.log("Reading data...");
    
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

    // 3. Match
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
        let detail = 'Nama di Rekening Koran tidak dapat ditemukan dalam database Website. Pastikan peserta sudah mengisi form pendaftaran atau nama yang digunakan di form berbeda.';
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
                detail = 'Data 100% cocok (Nama, Jumlah Tiket, dan Nominal Sesuai).';
            } else {
                status = 'TIDAK SESUAI (Beda Harga/Jumlah/Jenis)';
                let errDetails = [];
                if (ep.jumlah !== sp.jumlah) errDetails.push(`Jumlah tiket beda (Excel: ${ep.jumlah}, Web: ${sp.jumlah})`);
                if (ep.nominal !== expectedPrice && expectedPrice > 0) errDetails.push(`Nominal beda (Excel: Rp${ep.nominal}, Seharusnya: Rp${expectedPrice})`);
                if (!jenisMatch) errDetails.push(`Jenis tiket beda (Excel: ${ep.jenis}, Web: ${sp.jenis})`);
                
                detail = 'Ditemukan nama yang sama, tetapi: ' + errDetails.join(', ') + '.';
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
            'Keterangan Transfer (Excel)': ep.keterangan,
            'Status Kesesuaian': status,
            'Detail Kesesuaian': detail,
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
            'Keterangan Transfer (Excel)': '-',
            'Status Kesesuaian': 'ADA DI WEB, TIDAK ADA DI EXCEL',
            'Detail Kesesuaian': 'Peserta sudah mendaftar di Web, tetapi datanya tidak ditemukan di Rekening Koran (belum transfer atau atas nama orang lain).',
            'Nama Pendaftar (Web)': sp.original_nama,
            'Jenis Tiket (Web)': sp.jenis,
            'Jumlah Tiket (Web)': sp.jumlah,
            'Expected Nominal (Web)': expectedPrice > 0 ? expectedPrice : '-'
        });
    });

    // 4. Create Workbook with ExcelJS
    console.log("Generating styled Excel report...");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Rekonsiliasi');

    const headers = Object.keys(reportData[0]);
    worksheet.columns = headers.map(header => ({
        header: header,
        key: header,
        width: 25 // default width
    }));
    
    // Adjust specific column widths
    worksheet.getColumn('Status Kesesuaian').width = 45;
    worksheet.getColumn('Detail Kesesuaian').width = 80;
    worksheet.getColumn('Tanggal Transfer (Excel)').width = 15;
    worksheet.getColumn('Nama Pendaftar (Excel)').width = 30;
    worksheet.getColumn('Nama Pendaftar (Web)').width = 30;

    // Add rows and apply styles
    reportData.forEach((data, index) => {
        const row = worksheet.addRow(data);
        const status = data['Status Kesesuaian'];
        
        if (status.includes('TIDAK DITEMUKAN DI WEB') || status.includes('TIDAK ADA DI EXCEL')) {
            // Merah / Red
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFCCCC' } // light red
                };
            });
        } else if (status.includes('TIDAK SESUAI')) {
            // Kuning / Yellow
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFFF99' } // light yellow
                };
            });
        } else if (status.includes('SAMA/SESUAI')) {
            // Hijau Muda (Optional) / Light Green
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFCCFFCC' } // light green
                };
            });
        }
        
        // Wrap text for detail column
        const detailCell = row.getCell('Detail Kesesuaian');
        detailCell.alignment = { wrapText: true, vertical: 'middle' };
    });

    // Header styling
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F81BD' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    await workbook.xlsx.writeFile('Laporan_Rekonsiliasi_Berwarna.xlsx');
    console.log('Successfully generated updated Laporan_Rekonsiliasi_Berwarna.xlsx');
}

generateReport().catch(err => {
    console.error("Error generating report:", err);
});
