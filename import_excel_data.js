const XLSX = require('xlsx');
const { pool } = require('./src/config/db');

async function importExcel() {
    try {
        console.log('🚀 Đang đọc file Excel...');
        const workbook = XLSX.readFile('./danhsachthietbi.xlsx');
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Dữ liệu bắt đầu từ dòng 2 (index 2)
        // Row 1 (index 1) là header
        const dataRows = raw.slice(2); 

        console.log(`✅ Tìm thấy ${dataRows.length} dòng dữ liệu.`);

        // 1. Xoá dữ liệu cũ
        console.log('🧹 Đang xoá dữ liệu demo...');
        await pool.query('TRUNCATE equipments, departments, companies RESTART IDENTITY CASCADE');

        // 2. Thu thập danh sách Công ty và Phòng ban duy nhất
        const companies = new Set();
        const departments = new Set();
        const equipmentData = [];

        dataRows.forEach(row => {
            if (!row || row.length < 5) return; // Bỏ qua dòng trống

            const assigned_to = String(row[1] || '').trim();
            const company = String(row[2] || '').trim();
            const dept = String(row[3] || '').trim();
            const name = String(row[4] || '').trim();
            const cpu = String(row[5] || '').trim();
            const ram = String(row[6] || '').trim();
            const rom = String(row[7] || '').trim();
            const os = String(row[8] || '').trim();
            const monitor = String(row[9] || '').trim();
            const status = String(row[13] || 'Sẵn sàng').trim();
            const repair = String(row[14] || '').trim();

            if (company) companies.add(company);
            if (dept) departments.add(dept);

            // Xác định category dựa trên tên hoặc logic đơn giản
            let category = 'Máy tính';
            const lowerName = name.toLowerCase();
            if (lowerName.includes('laptop') || lowerName.includes('lt')) category = 'Laptop';
            else if (lowerName.includes('pc') || lowerName.includes('th-')) category = 'Desktop';

            equipmentData.push({
                name, category, cpu, ram, rom, os, monitor, assigned_to, 
                department: dept, company, status, repair_history: repair
            });
        });

        // 3. Chèn Công ty
        console.log(`🏢 Đang thêm ${companies.size} công ty...`);
        for (const name of companies) {
            await pool.query('INSERT INTO companies (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [name, 'Được thêm tự động từ Excel']);
        }

        // 4. Chèn Phòng ban
        console.log(`📂 Đang thêm ${departments.size} phòng ban...`);
        for (const name of departments) {
            await pool.query('INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [name, 'Được thêm tự động từ Excel']);
        }

        // 5. Chèn Thiết bị
        console.log(`💻 Đang thêm ${equipmentData.length} thiết bị...`);
        for (const eq of equipmentData) {
            await pool.query(
                `INSERT INTO equipments (name, category, cpu, ram, rom, os, monitor, assigned_to, department, company, status, repair_history) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [eq.name, eq.category, eq.cpu, eq.ram, eq.rom, eq.os, eq.monitor, eq.assigned_to, eq.department, eq.company, eq.status, eq.repair_history]
            );
        }

        console.log('✨ HOÀN THÀNH! Import dữ liệu thành công.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi khi import dữ liệu:', err);
        process.exit(1);
    }
}

importExcel();
