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
            ['Laptop Dell XPS 15', 'Laptop', 'Intel Core i7 12th', '16GB', '512GB SSD', 'Retina 4K', 'Nguyễn Văn A', 'Phòng Kỹ Thuật', 'Đang sử dụng', ''],
            ['PC Gaming G8', 'Desktop', 'AMD Ryzen 9', '32GB', '1TB SSD', 'LG 27 inch 144Hz', 'Trần Thị B', 'Dự án Alpha', 'Đang sử dụng', ''],
            ['Macbook Pro M2', 'Laptop', 'Apple M2 Pro', '16GB', '512GB SSD', 'Liquid Retina XDR', 'Magic Mouse 2', 'Bàn phím theo máy', '', 'Phòng Kinh Doanh', 'Sẵn sàng', ''],
            ['Màn hình Dell UltraSharp', 'Màn hình', '', '', '', '24 inch IPS', 'Lê Văn C', 'Phòng Kỹ Thuật', 'Đang sử dụng', ''],
            ['PC Văn Phòng Cấu Hình 1', 'Desktop', 'Intel Core i5 10th', '8GB', '256GB SSD', 'HP 21 inch', '', '', 'Đang sửa chữa', 'Máy hay bị sập nguồn đột ngột, nghi lỗi nguồn.'],
            ['Laptop ThinkPad X1 Carbon', 'Laptop', 'Intel Core i7 11th', '16GB', '512GB SSD', 'FHD IPS', 'Phạm Minh D', 'Dự án Beta', 'Đang sử dụng', ''],
            ['PC Đồ Hoạ 01', 'Desktop', 'Core i9 13th', '64GB', '2TB NVMe', 'Dual Asus 24 inch', '', '', 'Sẵn sàng', ''],
            ['Laptop Asus Vivobook', 'Laptop', 'Core i5 12th', '8GB', '512GB SSD', 'OLED 15 inch', '', '', 'Sẵn sàng', ''],
            ['Màn hình Samsung Curved', 'Màn hình', '', '', '', '32 inch 4K', '', 'Dự án Alpha', 'Sẵn sàng', ''],
            ['PC Văn Phòng Cấu Hình 2', 'Desktop', 'Core i3 12th', '8GB', '256GB SSD', 'Dell 19 inch', 'Hoàng Văn E', 'Phòng Hành Chính', 'Đang sử dụng', ''],
            ['Laptop HP EliteBook', 'Laptop', 'Core i7 12th', '16GB', '512GB SSD', '14 inch FHD', 'Nguyễn Thị F', 'Phòng Kinh Doanh', 'Đang sử dụng', ''],
            ['Mac Studio M2 Max', 'Desktop', 'Apple M2 Max', '64GB', '1TB SSD', 'Apple Studio Display', 'Lê Kỹ G', 'Phòng Kỹ Thuật', 'Đang sử dụng', ''],
            ['PC Kế Toán 01', 'Desktop', 'Core i3 10th', '8GB', '256GB SSD', 'Dell 21 inch', 'Phạm Thị H', 'Phòng Hành Chính', 'Đang sử dụng', ''],
            ['iPad Pro 12.9', 'Tablet', 'Apple M2', '8GB', '256GB', '12.9 Liquid Retina XDR', 'Giám Đốc I', 'Dự án Alpha', 'Đang sử dụng', ''],
            ['Máy in HP LaserJet 1020', 'Máy in', '', '', '', '', '', 'Phòng Hành Chính', 'Sẵn sàng', ''],
            ['Laptop MSI Katana', 'Laptop', 'Core i7 13th', '16GB', '1TB SSD', '15.6 144Hz', 'Trần Võ J', 'Dự án Beta', 'Đang sử dụng', ''],
            ['Màn hình LG 27UP600', 'Màn hình', '', '', '', '27 inch 4K', 'Đinh Kiều K', 'Phòng Kỹ Thuật', 'Đang sử dụng', ''],
            ['Laptop Dell Latitude 7420', 'Laptop', 'Core i5 11th', '16GB', '256GB SSD', '14 inch FHD', 'Vũ T L', 'Phòng Hành Chính', 'Đang sử dụng', 'Đã thay pin tháng 1/2026'],
            ['Router Wifi Asus AX5400', 'Thiết bị mạng', '', '', '', '', '', 'Phòng Kỹ Thuật', 'Sẵn sàng', ''],
            ['Switch Cisco 24 Port', 'Thiết bị mạng', '', '', '', '', '', 'Phòng Kỹ Thuật', 'Đang sử dụng', ''],
            ['PC Render 02', 'Desktop', 'Ryzen 9 7950X', '128GB', '2TB SSD', 'Dell UltraSharp 32', 'Lưu Văn M', 'Dự án Alpha', 'Đang sử dụng', ''],
            ['Tai nghe Sony WH-1000XM5', 'Phụ kiện', '', '', '', '', 'Phạm N', 'Dự án Beta', 'Đang sử dụng', ''],
            ['Laptop Acer Nitro 5', 'Laptop', 'Core i5 12th', '16GB', '512GB SSD', '15.6 144Hz FHD', 'Đỗ Thành O', 'Phòng Kỹ Thuật', 'Đang sửa chữa', 'Hỏng tản nhiệt, máy chạy rất nóng'],
            ['Màn hình AOC 24 inch', 'Màn hình', '', '', '', '24 inch IPS', '', 'Phòng Máy Chung', 'Sẵn sàng', ''],
            ['PC Văn Phòng Cấu Hình 3', 'Desktop', 'Core i5 11th', '8GB', '512GB SSD', 'HP 22 inch', 'Nguyễn Khắc P', 'Phòng Hành Chính', 'Đang sử dụng', ''],
            ['Laptop Lenovo IdeaPad 5', 'Laptop', 'Ryzen 5 5500U', '8GB', '512GB', '15.6 FHD', 'Trần Q', 'Phòng Kinh Doanh', 'Đang sử dụng', ''],
            ['Ổ cứng ngoài WD 2TB', 'Phụ kiện', '', '', '2TB', '', '', 'Phòng Hành Chính', 'Sẵn sàng', ''],
            ['Máy chiếu Sony', 'Thiết bị văn phòng', '', '', '', '', '', 'Phòng Họp 1', 'Đang sử dụng', ''],
            ['Laptop Lenovo Legion 5', 'Laptop', 'Ryzen 7 6800H', '16GB', '1TB SSD', '15.6 inch WQHD', 'Lê S', 'Dự án Alpha', 'Sẵn sàng', ''],
            ['Macbook Air M1', 'Laptop', 'Apple M1', '8GB', '256GB SSD', '13.3 Retina', 'Hoàng Minh T', 'Phòng Kinh Doanh', 'Đang sử dụng', '']
        ];

        for (const eq of equipments) {
            await pool.query(
                `INSERT INTO equipments (name, category, cpu, ram, rom, monitor, assigned_to, department, status, repair_history) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
