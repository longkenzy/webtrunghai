const XLSX = require('xlsx');
const { pool } = require('./src/config/db');

async function importExcel() {
    try {
        console.log('🚀 Đang đọc file Excel danhsachthietbi.xlsx (Phiên bản chính xác nhất)...');
        const workbook = XLSX.readFile('./danhsachthietbi.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Row 0: Title
        // Row 1: Header
        // Row 2: Data Start
        const dataRows = raw.slice(2); 

        console.log('🧹 Đang làm sạch dữ liệu cũ...');
        await pool.query('TRUNCATE equipments, departments, companies RESTART IDENTITY CASCADE');

        const companyName = "Tập đoàn Trung Hải";
        await pool.query('INSERT INTO companies (name, description) VALUES ($1, $2)', [companyName, 'Công ty mẹ']);

        const depts = new Set();
        const equipmentData = [];

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            if (!row || row.length < 4) continue;

            // Kiểm tra nếu cột 0 (STT) không có giá trị và cột 2 (Nơi để) có giá trị cực dài?
            // Hoặc đơn giản: nếu cột STT trống, có thể đó là dòng tiêu đề con.
            const stt = row[0];
            if (!stt) continue; 

            const assigned_to = String(row[1] || '').trim();
            const dept = String(row[2] || '').trim() || 'Hành chính';
            const comp_name = String(row[3] || '').trim(); // Computer Name
            const cpu = String(row[4] || '').trim();
            const ram = String(row[5] || '').trim();
            const rom = String(row[6] || '').trim();
            const os = String(row[7] || '').trim();
            const monitor = String(row[8] || '').trim();
            const periodic_time = String(row[9] || '').trim();
            const repair = String(row[10] || '').trim();

            if (dept) depts.add(dept);

            // Xác định category dựa trên computer name hoặc CPU
            let category = 'Desktop'; 
            const lowerName = comp_name.toLowerCase();
            const lowerCpu = cpu.toLowerCase();
            
            if (lowerName.includes('laptop') || lowerName.includes('lt') || lowerCpu.includes('u-series') || lowerName.includes('240 g')) {
                category = 'Laptop';
            } else if (lowerName.includes('ipad') || lowerName.includes('tab')) {
                category = 'Tablet';
            } else if (lowerName.includes('print') || lowerName.includes('máy in')) {
                category = 'Máy in';
            } else if (lowerName.includes('pc') || lowerName.includes('th-')) {
                category = 'Desktop';
            }

            // Status mặc định là Đang sử dụng nếu có người, ngược lại là Sẵn sàng
            const status = assigned_to ? 'Đang sử dụng' : 'Sẵn sàng';

            equipmentData.push({
                name: comp_name || `Thiết bị ${stt}`,
                category, cpu, ram, rom, os, monitor, assigned_to, 
                department: dept, company: companyName, status, repair_history: repair,
                periodic_check_time: periodic_time
            });
        }

        console.log(`📂 Đang thêm ${depts.size} phòng ban...`);
        for (const d of depts) {
            await pool.query('INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [d, 'Tự động nhập']);
        }

        console.log(`💻 Đang thêm ${equipmentData.length} thiết bị...`);
        for (const eq of equipmentData) {
            await pool.query(
                `INSERT INTO equipments (name, category, cpu, ram, rom, os, monitor, assigned_to, department, company, status, repair_history, periodic_check_time) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [eq.name, eq.category, eq.cpu, eq.ram, eq.rom, eq.os, eq.monitor, eq.assigned_to, eq.department, eq.company, eq.status, eq.repair_history, eq.periodic_check_time]
            );
        }

        console.log('✨ XONG! Import dữ liệu chính xác thành công.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi import:', err);
        process.exit(1);
    }
}

importExcel();
