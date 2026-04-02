const XLSX = require('xlsx');
const workbook = XLSX.readFile('./danhsachthietbi.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

for(let i=1; i<123; i++) {
    const row = raw[i];
    if(!row || row.length === 0) continue;
    
    const stt = row[0];
    const isHeading = !stt && row.some(cell => cell && typeof cell === 'string' && cell.length > 5);
    
    if(isHeading) {
        console.log(`[R${i}] HEADING:`, row.find(c => c));
    } else if (stt && !isNaN(stt)) {
        // Data row
    }
}
