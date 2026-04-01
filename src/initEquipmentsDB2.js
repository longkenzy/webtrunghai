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
            ['Laptop HP EliteBook', 'Laptop', 'Core i7 12th', '16GB', '512GB SSD', '14 inch FHD', 'Logitech M331', 'Bàn phím theo máy', 'Nguyễn Thị F', 'Đang sử dụng', ''],
            ['Mac Studio M2 Max', 'Desktop', 'Apple M2 Max', '64GB', '1TB SSD', 'Apple Studio Display', 'Magic Mouse', 'Magic Keyboard', 'Lê Kỹ G', 'Đang sử dụng', ''],
            ['PC Kế Toán 01', 'Desktop', 'Core i3 10th', '8GB', '256GB SSD', 'Dell 21 inch', 'Dell MS116', 'Dell KB216', 'Phạm Thị H', 'Đang sử dụng', ''],
            ['iPad Pro 12.9', 'Tablet', 'Apple M2', '8GB', '256GB', '12.9 Liquid Retina XDR', '', 'Magic Keyboard Folio', 'Giám Đốc I', 'Đang sử dụng', ''],
            ['Máy in HP LaserJet 1020', 'Máy in', '', '', '', '', '', '', null, 'Sẵn sàng', ''],
            ['Laptop MSI Katana', 'Laptop', 'Core i7 13th', '16GB', '1TB SSD', '15.6 144Hz', 'MSI Gaming Mouse', 'RGB theo máy', 'Trần Võ J', 'Đang sử dụng', ''],
            ['Màn hình LG 27UP600', 'Màn hình', '', '', '', '27 inch 4K', '', '', 'Đinh Kiều K', 'Đang sử dụng', ''],
            ['Laptop Dell Latitude 7420', 'Laptop', 'Core i5 11th', '16GB', '256GB SSD', '14 inch FHD', 'Logitech MX Anywhere 2S', 'Bàn phím theo máy', 'Vũ T L', 'Đang sử dụng', 'Đã thay pin tháng 1/2026'],
            ['Router Wifi Asus AX5400', 'Thiết bị mạng', '', '', '', '', '', '', null, 'Sẵn sàng', ''],
            ['Switch Cisco 24 Port', 'Thiết bị mạng', '', '', '', '', '', '', null, 'Đang sử dụng', ''],
            ['PC Render 02', 'Desktop', 'Ryzen 9 7950X', '128GB', '2TB SSD', 'Dell UltraSharp 32', 'Logitech G502', 'Corsair K70', 'Lưu Văn M', 'Đang sử dụng', ''],
            ['Tai nghe Sony WH-1000XM5', 'Phụ kiện', '', '', '', '', '', '', 'Phạm N', 'Đang sử dụng', ''],
            ['Laptop Acer Nitro 5', 'Laptop', 'Core i5 12th', '16GB', '512GB SSD', '15.6 144Hz FHD', 'Acer Predator', 'Khung viền đỏ', 'Đỗ Thành O', 'Đang sửa chữa', 'Hỏng tản nhiệt, máy chạy rất nóng'],
            ['Màn hình AOC 24 inch', 'Màn hình', '', '', '', '24 inch IPS', '', '', null, 'Sẵn sàng', ''],
            ['PC Văn Phòng Cấu Hình 3', 'Desktop', 'Core i5 11th', '8GB', '512GB SSD', 'HP 22 inch', 'Genius DX-110', 'Bàn phím Fuhlen L411', 'Nguyễn Khắc P', 'Đang sử dụng', ''],
            ['Laptop Lenovo IdeaPad 5', 'Laptop', 'Ryzen 5 5500U', '8GB', '512GB', '15.6 FHD', '', 'Bàn phím theo máy', 'Trần Q', 'Đang sử dụng', ''],
            ['Ổ cứng ngoài WD 2TB', 'Phụ kiện', '', '', '2TB', '', '', '', null, 'Sẵn sàng', ''],
            ['Máy chiếu Sony', 'Thiết bị văn phòng', '', '', '', '', '', '', null, 'Đang sử dụng', ''],
            ['Laptop Lenovo Legion 5', 'Laptop', 'Ryzen 7 6800H', '16GB', '1TB SSD', '15.6 inch WQHD', 'Logitech G304', 'Bàn phím theo máy', 'Lê S', 'Sẵn sàng', ''],
            ['Macbook Air M1', 'Laptop', 'Apple M1', '8GB', '256GB SSD', '13.3 Retina', 'Magic Mouse', 'Bàn phím theo máy', 'Hoàng Minh T', 'Đang sử dụng', '']
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
