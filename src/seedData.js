const { pool } = require('./config/db');

async function seedData() {
    try {
        console.log('🚀 Đang tạo dữ liệu mẫu...');

        // 1. Xoá dữ liệu cũ (tuỳ chọn - ở đây mình giữ nguyên chỉ insert thêm)
        // await pool.query('TRUNCATE departments, equipments RESTART IDENTITY CASCADE');

        // 2. Thêm Phòng ban / Dự án mẫu
        const depts = [
            ['Phòng Kỹ Thuật', 'Quản lý hạ tầng và thiết bị công nghệ'],
            ['Phòng Hành Chính', 'Quản lý nhân sự và văn phòng phẩm'],
            ['Phòng Kinh Doanh', 'Đội ngũ sales và chăm sóc khách hàng'],
            ['Dự án Alpha', 'Dự án phát triển phần mềm nội bộ'],
            ['Dự án Beta', 'Dự án triển khai hệ thống cho khách hàng']
        ];

        for (const [name, desc] of depts) {
            await pool.query(
                'INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [name, desc]
            );
        }
        console.log('✅ Đã tạo các phòng ban mẫu.');

        // 3. Thêm Thiết bị mẫu
        const equipments = [
            ['Laptop Dell XPS 15', 'Laptop', 'Intel Core i7 12th', '16GB', '512GB SSD', 'Retina 4K', 'Logitech Silent', 'Bàn phím theo máy', 'Nguyễn Văn A', 'Phòng Kỹ Thuật', 'Đang sử dụng', ''],
            ['PC Gaming G8', 'Desktop', 'AMD Ryzen 9', '32GB', '1TB SSD', 'LG 27 inch 144Hz', 'Razer DeathAdder', 'Cơ AKKO 3087', 'Trần Thị B', 'Dự án Alpha', 'Đang sử dụng', ''],
            ['Macbook Pro M2', 'Laptop', 'Apple M2 Pro', '16GB', '512GB SSD', 'Liquid Retina XDR', 'Magic Mouse 2', 'Bàn phím theo máy', '', 'Phòng Kinh Doanh', 'Sẵn sàng', ''],
            ['Màn hình Dell UltraSharp', 'Màn hình', '', '', '', '24 inch IPS', '', '', 'Lê Văn C', 'Phòng Kỹ Thuật', 'Đang sử dụng', ''],
            ['PC Văn Phòng Cấu Hình 1', 'Desktop', 'Intel Core i5 10th', '8GB', '256GB SSD', 'HP 21 inch', 'Chuột Genius', 'Bàn phím Mitsumi', '', '', 'Đang sửa chữa', 'Máy hay bị sập nguồn đột ngột, nghi lỗi nguồn.'],
            ['Laptop ThinkPad X1 Carbon', 'Laptop', 'Intel Core i7 11th', '16GB', '512GB SSD', 'FHD IPS', 'Logitech Anywhere 3', 'Bàn phím theo máy', 'Phạm Minh D', 'Dự án Beta', 'Đang sử dụng', ''],
            ['PC Đồ Hoạ 01', 'Desktop', 'Core i9 13th', '64GB', '2TB NVMe', 'Dual Asus 24 inch', 'Logitech MX Master 3S', 'Logitech G613', '', '', 'Sẵn sàng', ''],
            ['Laptop Asus Vivobook', 'Laptop', 'Core i5 12th', '8GB', '512GB SSD', 'OLED 15 inch', 'Chuột có dây OEM', 'Bàn phím theo máy', '', '', 'Sẵn sàng', ''],
            ['Màn hình Samsung Curved', 'Màn hình', '', '', '', '32 inch 4K', '', '', '', 'Dự án Alpha', 'Sẵn sàng', ''],
            ['PC Văn Phòng Cấu Hình 2', 'Desktop', 'Core i3 12th', '8GB', '256GB SSD', 'Dell 19 inch', 'Chuột Mitsumi', 'Bàn phím Mitsumi', 'Hoàng Văn E', 'Phòng Hành Chính', 'Đang sử dụng', '']
        ];

        for (const eq of equipments) {
            await pool.query(
                `INSERT INTO equipments (name, category, cpu, ram, rom, monitor, mouse, keyboard, assigned_to, department, status, repair_history) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                eq
            );
        }
        console.log('✅ Đã tạo 10 thiết bị mẫu.');

        console.log('✨ Chúc mừng! Dữ liệu mẫu đã sẵn sàng.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi tạo dữ liệu mẫu:', error);
        process.exit(1);
    }
}

seedData();
