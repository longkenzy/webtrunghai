const XLSX = require('xlsx');
const workbook = XLSX.readFile('./danhsachthietbi.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const range = XLSX.utils.decode_range(sheet['!ref']);
console.log('Sheet Range:', sheet['!ref']);

for(let R = 1; R <= 30; R++) { // Rows 1 to 30
    let rowData = [];
    for(let C = range.s.c; C <= range.e.c; C++) {
        let cellRef = XLSX.utils.encode_cell({c:C, r:R});
        let cell = sheet[cellRef];
        rowData.push(cell ? cell.v : null);
    }
    console.log(`[R${R}]`, JSON.stringify(rowData));
}
