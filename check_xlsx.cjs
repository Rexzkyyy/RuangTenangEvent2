const xlsx = require('xlsx');

const workbook = xlsx.readFile('Informasi Kontak (Jawaban).xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

data.forEach((row, idx) => {
  const jsonStr = JSON.stringify(row);
  if (jsonStr.includes("5253822700") || jsonStr.toLowerCase().includes("eky")) {
    console.log(`Row ${idx + 2}:`, row);
  }
});
