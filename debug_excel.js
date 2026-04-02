const XLSX = require('xlsx');
const workbook = XLSX.readFile('./danhsachthietbi.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
// log first 50 rows, carefully
for(let i=0; i<50; i++) {
    process.stdout.write(`Row ${i}: ${JSON.stringify(raw[i])}\n`);
}
