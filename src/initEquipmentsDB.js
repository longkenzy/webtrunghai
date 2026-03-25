const { pool } = require('./config/db');

async function initEquipmentsDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS equipments (
                id SERIAL PRIMARY KEY,
                asset_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                specs TEXT,
                status VARCHAR(50) DEFAULT 'Sẵn sàng',
                assigned_to VARCHAR(100),
                purchase_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created equipments table');

        // Check if there is data
        const { rows } = await pool.query('SELECT COUNT(*) FROM equipments');
        if (parseInt(rows[0].count) === 0) {
            const mockData = [
                ['PC-001', 'Dell Optiplex 7090', 'Desktop', 'Core i7-11700, 16GB RAM, 512GB SSD', 'Đang sử dụng', 'Nguyễn Văn A', '2025-01-10', 'Máy mới'],
                ['LT-105', 'ThinkPad T14 Gen 3', 'Laptop', 'Core i5-1240P, 16GB RAM, 512GB SSD', 'Sẵn sàng', null, '2025-02-15', ''],
                ['MN-020', 'Màn hình LG 24MP60G', 'Màn hình', '24 inch, FHD, 75Hz', 'Đang sửa chữa', null, '2024-11-20', 'Sọc màn hình'],
                ['PC-002', 'HP EliteDesk 800 G6', 'Desktop', 'Core i5-10500, 8GB RAM, 256GB SSD', 'Đang sử dụng', 'Dự án Alpha', '2023-05-10', ''],
                ['LT-106', 'MacBook Pro M2 2022', 'Laptop', 'Apple M2, 16GB RAM, 512GB SSD', 'Sẵn sàng', null, '2024-08-05', 'Bàn phím hơi bóng'],
            ];

            for (const item of mockData) {
                await pool.query(
                    'INSERT INTO equipments (asset_id, name, category, specs, status, assigned_to, purchase_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    item
                );
            }
            console.log('✅ Inserted mock equipments data');
        } else {
            console.log('⚠️ Equipments data already exists');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing equipments DB:', error);
        process.exit(1);
    }
}

initEquipmentsDB();
