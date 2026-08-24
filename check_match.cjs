const xlsx = require('xlsx');

const workbook = xlsx.readFile('new DATA PEMBAYARAN TIKET DR AISA DAHLAN (2).xlsx');
const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('rekening koran'));

const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 5; i < Math.min(100, data.length); i++) {
    const row = data[i];
    if (row[5] === 'REGULER') {
        console.log(`Found REGULER at row ${i}:`, JSON.stringify(row));
        break;
    }
}
