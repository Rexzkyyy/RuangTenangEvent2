const fs = require('fs');
const xlsx = require('xlsx'); 
const ExcelJS = require('exceljs'); 

async function generateReport() {
    console.log("Reading data...");
    
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
        if (!nama) nama = row[2]; 
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
                    nama_lower: nama.toLowerCase(),
                    original_nama: nama,
                    jenis: jenis,
                    jumlah: jumlah,
                    expectedPrice: expectedPrice
                });
            }
        }
    }

    // 3. Match
    const reportData = [];
    const simulasiData = [];
    const gabunganData = [];
    const sqlCopy = [...sqlParticipants];
    
    let deltaInsert = 0;
    let deltaUpdate = 0;
    let deltaDelete = 0;

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
                foundIdx = sqlCopy.findIndex(sp => {
                    return epWords.some(w => sp.nama_lower.includes(w));
                });
            }
        }
        
        let status = 'TIDAK DITEMUKAN DI WEB';
        let detail = 'Nama di Rekening Koran tidak dapat ditemukan dalam database Website.';
        let spData = { original_nama: '-', jenis: '-', jumlah: '-' };
        let expectedPrice = 0;
        let aksi = 'DITAMBAHKAN (INSERT)';
        let efek = ep.nominal;
        
        if (foundIdx !== -1) {
            const sp = sqlCopy[foundIdx];
            spData = sp;
            expectedPrice = sp.expectedPrice;
            
            const jenisMatch = ep.jenis.toLowerCase().replace(/[^a-z]/g, '') === sp.jenis.toLowerCase().replace(/[^a-z]/g, '');
            
            if (ep.jumlah === sp.jumlah && (ep.nominal === expectedPrice || expectedPrice === 0)) {
                status = 'SAMA/SESUAI';
                detail = 'Data 100% cocok.';
                aksi = 'SAMA (NO ACTION)';
                efek = 0;
            } else {
                status = 'TIDAK SESUAI (Beda Harga/Jumlah/Jenis)';
                detail = 'Ditemukan, tetapi ada perbedaan.';
                
                const selisih = ep.nominal - expectedPrice;
                aksi = 'DIUBAH (UPDATE)';
                efek = selisih;
                
                if (selisih !== 0) {
                    deltaUpdate += selisih;
                    simulasiData.push({
                        'Aksi Diperlukan': aksi,
                        'Nama Peserta': ep.original_nama,
                        'Kondisi Saat Ini (Web)': `Nominal: Rp ${expectedPrice}`,
                        'Seharusnya (Excel)': `Nominal: Rp ${ep.nominal}`,
                        'Efek Perubahan Nominal (Rp)': selisih > 0 ? `+${selisih}` : `${selisih}`
                    });
                }
            }
            sqlCopy.splice(foundIdx, 1);
        } else {
            deltaInsert += ep.nominal;
            simulasiData.push({
                'Aksi Diperlukan': aksi,
                'Nama Peserta': ep.original_nama,
                'Kondisi Saat Ini (Web)': 'Belum terdaftar',
                'Seharusnya (Excel)': `Transfer: Rp ${ep.nominal}`,
                'Efek Perubahan Nominal (Rp)': `+${ep.nominal}`
            });
        }
        
        const rowObj = {
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
        };
        reportData.push(rowObj);
        
        gabunganData.push({
            ...rowObj,
            'Aksi Diperlukan': aksi,
            'Efek Perubahan Nominal (Rp)': efek
        });
    });

    sqlCopy.forEach(sp => {
        let expectedPrice = sp.expectedPrice;
        
        const rowObj = {
            'Tanggal Transfer (Excel)': '-',
            'Nama Pengirim (Excel)': '-',
            'Nama Pendaftar (Excel)': '-',
            'Jenis Tiket (Excel)': '-',
            'Jumlah Tiket (Excel)': '-',
            'Nominal Transfer (Excel)': '-',
            'Keterangan Transfer (Excel)': '-',
            'Status Kesesuaian': 'ADA DI WEB, TIDAK ADA DI EXCEL',
            'Detail Kesesuaian': 'Peserta terdaftar di Web, tapi tidak ada di Rekening Koran.',
            'Nama Pendaftar (Web)': sp.original_nama,
            'Jenis Tiket (Web)': sp.jenis,
            'Jumlah Tiket (Web)': sp.jumlah,
            'Expected Nominal (Web)': expectedPrice > 0 ? expectedPrice : '-'
        };
        reportData.push(rowObj);
        
        gabunganData.push({
            ...rowObj,
            'Aksi Diperlukan': 'DIHAPUS / DIABAIKAN (DELETE)',
            'Efek Perubahan Nominal (Rp)': -expectedPrice
        });
        
        if (expectedPrice > 0) {
            deltaDelete -= expectedPrice;
            simulasiData.push({
                'Aksi Diperlukan': 'DIHAPUS / DIABAIKAN (DELETE)',
                'Nama Peserta': sp.original_nama,
                'Kondisi Saat Ini (Web)': `Terdaftar, Target Rp ${expectedPrice}`,
                'Seharusnya (Excel)': 'Tidak ada transfer',
                'Efek Perubahan Nominal (Rp)': `-${expectedPrice}`
            });
        }
    });
    
    simulasiData.push({});
    simulasiData.push({ 'Aksi Diperlukan': 'TOTAL NOMINAL AWAL WEB', 'Efek Perubahan Nominal (Rp)': webTotal });
    simulasiData.push({ 'Aksi Diperlukan': 'TOTAL PENAMBAHAN (DATA BARU EXCEL)', 'Efek Perubahan Nominal (Rp)': `+${deltaInsert}` });
    simulasiData.push({ 'Aksi Diperlukan': 'TOTAL PENYESUAIAN (UBAH DATA WEB)', 'Efek Perubahan Nominal (Rp)': deltaUpdate > 0 ? `+${deltaUpdate}` : `${deltaUpdate}` });
    simulasiData.push({ 'Aksi Diperlukan': 'TOTAL PENGURANGAN (DATA HANYA ADA DI WEB)', 'Efek Perubahan Nominal (Rp)': `${deltaDelete}` });
    simulasiData.push({ 'Aksi Diperlukan': 'TOTAL NOMINAL AKHIR (MENJADI SAMA DENGAN EXCEL)', 'Efek Perubahan Nominal (Rp)': webTotal + deltaInsert + deltaUpdate + deltaDelete });

    // 4. Create Workbook with ExcelJS
    console.log("Generating styled Excel report...");
    const workbook = new ExcelJS.Workbook();
    
    // ============================================
    // SHEET 1: Laporan Rekonsiliasi
    // ============================================
    const worksheet1 = workbook.addWorksheet('Laporan Rekonsiliasi');
    worksheet1.columns = Object.keys(reportData[0]).map(header => ({ header, key: header, width: 25 }));
    worksheet1.getColumn('Status Kesesuaian').width = 45;
    worksheet1.getColumn('Detail Kesesuaian').width = 80;
    
    reportData.forEach((data) => {
        const row = worksheet1.addRow(data);
        const status = data['Status Kesesuaian'];
        if (status.includes('TIDAK DITEMUKAN DI WEB') || status.includes('TIDAK ADA DI EXCEL')) {
            row.eachCell({ includeEmpty: true }, (cell) => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } });
        } else if (status.includes('TIDAK SESUAI')) {
            row.eachCell({ includeEmpty: true }, (cell) => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } });
        } else if (status.includes('SAMA/SESUAI')) {
            row.eachCell({ includeEmpty: true }, (cell) => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFFCC' } });
        }
    });
    const headerRow1 = worksheet1.getRow(1);
    headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    
    // ============================================
    // SHEET 2: Simulasi
    // ============================================
    const sheetSimulasi = workbook.addWorksheet('Simulasi Pencapaian Nominal');
    sheetSimulasi.columns = [
        { header: 'Aksi Diperlukan', key: 'Aksi Diperlukan', width: 45 },
        { header: 'Nama Peserta', key: 'Nama Peserta', width: 40 },
        { header: 'Kondisi Saat Ini (Web)', key: 'Kondisi Saat Ini (Web)', width: 35 },
        { header: 'Seharusnya (Excel)', key: 'Seharusnya (Excel)', width: 35 },
        { header: 'Efek Perubahan Nominal (Rp)', key: 'Efek Perubahan Nominal (Rp)', width: 35 }
    ];
    
    simulasiData.forEach(data => {
        const row = sheetSimulasi.addRow(data);
        if (data['Aksi Diperlukan'] && data['Aksi Diperlukan'].includes('TOTAL')) {
            row.font = { bold: true };
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        }
    });
    
    const headerRow2 = sheetSimulasi.getRow(1);
    headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };

    // ============================================
    // SHEET 3: Laporan Gabungan
    // ============================================
    const sheetGabungan = workbook.addWorksheet('Laporan Gabungan Lengkap');
    const gabunganHeaders = Object.keys(gabunganData[0]);
    sheetGabungan.columns = gabunganHeaders.map(header => ({ header, key: header, width: 25 }));
    sheetGabungan.getColumn('Status Kesesuaian').width = 45;
    sheetGabungan.getColumn('Detail Kesesuaian').width = 80;
    
    gabunganData.forEach((data) => {
        const row = sheetGabungan.addRow(data);
        const status = data['Status Kesesuaian'];
        if (status.includes('TIDAK DITEMUKAN DI WEB') || status.includes('TIDAK ADA DI EXCEL')) {
            row.eachCell({ includeEmpty: true }, (cell) => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } });
        } else if (status.includes('TIDAK SESUAI')) {
            row.eachCell({ includeEmpty: true }, (cell) => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } });
        } else if (status.includes('SAMA/SESUAI')) {
            row.eachCell({ includeEmpty: true }, (cell) => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFFCC' } });
        }
    });
    
    const headerRow3 = sheetGabungan.getRow(1);
    headerRow3.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8064A2' } }; // Purple
    
    // Add Summary Rows at the bottom of Sheet 3
    sheetGabungan.addRow({});
    
    const totalWebRow = sheetGabungan.addRow({ 'Aksi Diperlukan': 'TOTAL NOMINAL AWAL WEB', 'Efek Perubahan Nominal (Rp)': webTotal });
    totalWebRow.font = { bold: true };
    totalWebRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    
    const totalExcelRow = sheetGabungan.addRow({ 'Aksi Diperlukan': 'TOTAL NOMINAL EXCEL (TARGET)', 'Efek Perubahan Nominal (Rp)': excelTotal });
    totalExcelRow.font = { bold: true };
    totalExcelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    
    const selisihRow = sheetGabungan.addRow({ 'Aksi Diperlukan': 'TOTAL NOMINAL PERUBAHAN (EFEK)', 'Efek Perubahan Nominal (Rp)': excelTotal - webTotal });
    selisihRow.font = { bold: true };
    selisihRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    await workbook.xlsx.writeFile('Laporan_Rekonsiliasi_Berwarna_v3.xlsx');
    console.log('Successfully generated updated Laporan_Rekonsiliasi_Berwarna_v3.xlsx');
}

generateReport().catch(err => {
    console.error("Error generating report:", err);
});
