const XLSX = require('xlsx');
const workbook = XLSX.readFile('./danhsachthietbi.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
for(let i=0; i<150; i++) {
    if(!raw[i]) continue;
    console.log(`[${i}] ${JSON.stringify(raw[i])}`);
}
