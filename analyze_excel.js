const XLSX = require('xlsx');
try {
    const workbook = XLSX.readFile('./danhsachthietbi.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log('✅ Sheet Name:', sheetName);
    console.log('✅ Found', data.length, 'rows');
    if(data.length > 0) {
        console.log('✅ Column names:', Object.keys(data[0]));
        console.log('✅ Row 1 sample:', JSON.stringify(data[0], null, 2));
    }
} catch (err) {
    console.error('❌ Error reading file:', err.message);
}
