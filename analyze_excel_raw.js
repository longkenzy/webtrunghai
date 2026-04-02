const XLSX = require('xlsx');
const workbook = XLSX.readFile('./danhsachthietbi.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
// take first 5 rows to understand the structure
for(let i=0; i<5; i++) {
    console.log(`Row ${i}:`, JSON.stringify(raw[i]));
}
