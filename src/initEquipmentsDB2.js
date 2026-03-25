const { pool } = require('./config/db');

async function initEquipmentsDB() {
    try {
        await pool.query('DROP TABLE IF EXISTS equipments');
        await pool.query(`
            CREATE TABLE equipments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                cpu VARCHAR(100),
                ram VARCHAR(50),
                rom VARCHAR(50),
                monitor VARCHAR(100),
                mouse VARCHAR(100),
                keyboard VARCHAR(100),
                assigned_to VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Sẵn sàng',
                repair_history TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created equipments table with new schema');

        const mockData = [
            ['Dell Optiplex 7090', 'PC', 'Core i7-11700', '16GB', '512GB SSD', 'Dell 24 inch', 'Dell USB', 'Dell USB', 'Nguyễn Văn A', 'Đang sử dụng', 'Thay RAM tháng 2/2026'],
            ['ThinkPad T14 Gen 3', 'Laptop', 'Core i5-1240P', '16GB', '512GB SSD', '', 'Logitech M331', '', null, 'Sẵn sàng', ''],
            ['HP EliteDesk 800 G6', 'PC', 'Core i5-10500', '8GB', '256GB SSD', 'HP 22 inch', 'HP', 'HP', 'Dự án Alpha', 'Đang sử dụng', 'Cài lại Win 10'],
            ['MacBook Pro M2', 'Laptop', 'Apple M2', '16GB', '512GB SSD', '', 'Magic Mouse', '', null, 'Đang sửa chữa', 'Hỏng phím Space'],
            ['Dell Latitude 5420', 'Laptop', 'Core i5-1135G7', '8GB', '256GB SSD', '', '', '', 'Trần Thị B', 'Đang sử dụng', ''],
        ];

        for (const item of mockData) {
            await pool.query(
                'INSERT INTO equipments (name, category, cpu, ram, rom, monitor, mouse, keyboard, assigned_to, status, repair_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                item
            );
        }
        console.log('✅ Inserted mock equipments data');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing equipments DB:', error);
        process.exit(1);
    }
}

initEquipmentsDB();
