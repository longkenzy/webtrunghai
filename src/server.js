require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool, testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'trunghai_secret_key_123';

app.use(express.json());
app.use(cookieParser());

// === API login ===
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại!' });
        }
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Sai mật khẩu!' });
        }
        
        // Tạo JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        
        // Set cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 1 ngày
        });
        
        res.json({ status: 'ok', message: 'Đăng nhập thành công' });
    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ status: 'ok' });
});

// Các file tĩnh được phép truy cập không cần auth
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/@vercel/analytics', express.static(path.join(__dirname, '../node_modules/@vercel/analytics/dist')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(__dirname, '../public/styles.css')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));

// === AUTH MIDDLEWARE ===
app.use((req, res, next) => {
    const token = req.cookies.auth_token;
    
    // Nếu chưa đăng nhập, redirect về trang login
    // Dù req path là gì đi nữa, nếu ko ngoại lệ bên trên thì chặn.
    if (!token) {
        return res.redirect('/login.html');
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // Token hết hạn hoặc sai
        res.clearCookie('auth_token');
        return res.redirect('/login.html');
    }
});

// Trang chính - redirect từ '/' sang index.html (mặc định của express.static, nhưng để đảm bảo route được gọi)
app.get('/', (req, res, next) => {
    // Để express.static xử lý bên dưới
    next();
});

// API lấy danh sách thiết bị
app.get('/api/equipments', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM equipments ORDER BY id DESC');
        res.json({ status: 'ok', data: rows });
    } catch (err) {
        console.error('Lỗi lấy danh sách thiết bị:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

// API thêm thiết bị mới
app.post('/api/equipments', async (req, res) => {
    try {
        const { name, category, cpu, ram, rom, os, monitor, assigned_to, department, company, status, repair_history, periodic_check_time } = req.body;
        
        await pool.query(
            'INSERT INTO equipments (name, category, cpu, ram, rom, os, monitor, assigned_to, department, company, status, repair_history, periodic_check_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
            [name, category, cpu || '', ram || '', rom || '', os || '', monitor || '', assigned_to || '', department || '', company || '', status || 'Sẵn sàng', repair_history || '', periodic_check_time || '']
        );
        res.json({ status: 'ok', message: 'Thêm thiết bị thành công' });
    } catch (err) {
        console.error('Lỗi thêm thiết bị:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi thêm thiết bị' });
    }
});

// API cập nhật / chỉnh sửa thiết bị
app.put('/api/equipments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, cpu, ram, rom, os, monitor, assigned_to, department, company, status, repair_history } = req.body;
        
        await pool.query(
            `UPDATE equipments 
             SET name=$1, category=$2, cpu=$3, ram=$4, rom=$5, os=$6, monitor=$7, assigned_to=$8, department=$9, status=$10, repair_history=$11, company=$12
             WHERE id=$13`,
            [name, category, cpu || '', ram || '', rom || '', os || '', monitor || '', assigned_to || '', department || '', status || 'Sẵn sàng', repair_history || '', company || '', id]
        );
        res.json({ status: 'ok', message: 'Cập nhật thiết bị thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật thiết bị:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi cập nhật thiết bị' });
    }
});

// API nhập danh sách thiết bị từ Excel
app.post('/api/equipments/import', async (req, res) => {
    try {
        const { mode, data } = req.body; // mode: 'overwrite' hoặc 'append'
        if (!data || !Array.isArray(data)) return res.status(400).json({ status: 'error', message: 'Dữ liệu không hợp lệ' });

        if (mode === 'overwrite') {
            await pool.query('TRUNCATE equipments RESTART IDENTITY');
        }

        // Tự động thu thập công ty và phòng ban để thêm nếu chưa có
        const companies = new Set();
        const departments = new Set();

        for (const eq of data) {
            if (eq.company) companies.add(eq.company.trim());
            if (eq.department) departments.add(eq.department.trim());

            await pool.query(
                `INSERT INTO equipments (name, assigned_to, company, department, cpu, ram, rom, os, monitor, status, repair_history, category) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    eq.name || 'TH-UNKNOWN',
                    eq.assigned_to || '',
                    eq.company || '',
                    eq.department || '',
                    eq.cpu || '',
                    eq.ram || '',
                    eq.rom || '',
                    eq.os || '',
                    eq.monitor || '',
                    eq.status || 'Sẵn sàng',
                    eq.repair_history || '',
                    eq.category || 'Laptop'
                ]
            );
        }

        // Thêm các công ty/phòng ban mới vào danh mục nếu chưa tồn tại
        for (const c of companies) {
            await pool.query('INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [c]);
        }
        for (const d of departments) {
            await pool.query('INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [d]);
        }

        res.json({ status: 'ok', message: `Đã nhập thành công ${data.length} thiết bị` });
    } catch (err) {
        console.error('Lỗi import:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi máy chủ khi nhập dữ liệu' });
    }
});

// API xoá thiết bị
app.delete('/api/equipments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM equipments WHERE id = $1', [id]);
        res.json({ status: 'ok', message: 'Xoá thiết bị thành công' });
    } catch (err) {
        console.error('Lỗi xoá thiết bị:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi xoá thiết bị' });
    }
});

// API cập nhật trạng thái thiết bị
app.patch('/api/equipments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, repair_content } = req.body;
        
        if (status === 'Đang sửa chữa') {
            await pool.query(
                'UPDATE equipments SET status = $1, repair_date = CURRENT_TIMESTAMP, repair_history = $2 WHERE id = $3', 
                [status, repair_content || '', id]
            );
        } else {
            await pool.query('UPDATE equipments SET status = $1 WHERE id = $2', [status, id]);
        }
        res.json({ status: 'ok', message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật trạng thái:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi cập nhật trạng thái' });
    }
});

// API lấy danh sách phòng ban
app.get('/api/departments', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM departments ORDER BY id DESC');
        res.json({ status: 'ok', data: rows });
    } catch (err) {
        console.error('Lỗi lấy danh sách phòng ban:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

// API thêm phòng ban mới
app.post('/api/departments', async (req, res) => {
    try {
        const { name, description } = req.body;
        await pool.query(
            'INSERT INTO departments (name, description) VALUES ($1, $2)',
            [name, description || '']
        );
        res.json({ status: 'ok', message: 'Thêm phòng ban thành công' });
    } catch (err) {
        console.error('Lỗi thêm phòng ban:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi thêm phòng ban (Có thể tên đã tồn tại)' });
    }
});

// API cập nhật phòng ban
app.put('/api/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        // Lấy tên cũ để đồng bộ
        const oldDept = await pool.query('SELECT name FROM departments WHERE id = $1', [id]);
        
        await pool.query(
            'UPDATE departments SET name = $1, description = $2 WHERE id = $3',
            [name, description || '', id]
        );

        if (oldDept.rows.length > 0) {
            const oldName = oldDept.rows[0].name;
            // Đồng bộ tên phòng ban trong bảng equipments
            await pool.query('UPDATE equipments SET department = $1 WHERE department = $2', [name, oldName]);
        }

        res.json({ status: 'ok', message: 'Cập nhật phòng ban thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật phòng ban:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi cập nhật phòng ban' });
    }
});

// API xoá phòng ban
app.delete('/api/departments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM departments WHERE id = $1', [id]);
        res.json({ status: 'ok', message: 'Xoá phòng ban thành công' });
    } catch (err) {
        console.error('Lỗi xoá phòng ban:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi xoá phòng ban' });
    }
});

// API lấy danh sách công ty
app.get('/api/companies', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM companies ORDER BY id DESC');
        res.json({ status: 'ok', data: rows });
    } catch (err) {
        console.error('Lỗi lấy danh sách công ty:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

// API thêm công ty mới
app.post('/api/companies', async (req, res) => {
    try {
        const { name, description } = req.body;
        await pool.query(
            'INSERT INTO companies (name, description) VALUES ($1, $2)',
            [name, description || '']
        );
        res.json({ status: 'ok', message: 'Thêm công ty thành công' });
    } catch (err) {
        console.error('Lỗi thêm công ty:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi thêm công ty (Có thể tên đã tồn tại)' });
    }
});

// API cập nhật công ty
app.put('/api/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        // Lấy tên cũ để đồng bộ
        const oldCompany = await pool.query('SELECT name FROM companies WHERE id = $1', [id]);

        await pool.query(
            'UPDATE companies SET name = $1, description = $2 WHERE id = $3',
            [name, description || '', id]
        );

        if (oldCompany.rows.length > 0) {
            const oldName = oldCompany.rows[0].name;
            // Đồng bộ tên công ty trong bảng equipments
            await pool.query('UPDATE equipments SET company = $1 WHERE company = $2', [name, oldName]);
        }

        res.json({ status: 'ok', message: 'Cập nhật công ty thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật công ty:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi cập nhật công ty' });
    }
});

// API xoá công ty
app.delete('/api/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM companies WHERE id = $1', [id]);
        res.json({ status: 'ok', message: 'Xoá công ty thành công' });
    } catch (err) {
        console.error('Lỗi xoá công ty:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi xoá công ty' });
    }
});

// API health test
app.get('/api/health', async (req, res) => {
    const isConnected = await testConnection();
    if (isConnected) {
        res.status(200).json({ status: 'ok', message: 'Kết nối Database cực tốt!', user: req.user });
    } else {
        res.status(500).json({ status: 'error', message: 'Kết nối Database thất bại.' });
    }
});

// === API MÁY PHOTO & MÁY IN ===
app.get('/api/office-equipments', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM office_equipments ORDER BY id DESC');
        res.json({ status: 'ok', data: rows });
    } catch (err) {
        console.error('Lỗi lấy danh sách office equipment:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

app.get('/api/office-repair-history/:eqId', async (req, res) => {
    try {
        const { eqId } = req.params;
        const { rows } = await pool.query('SELECT * FROM office_repair_history WHERE equipment_id = $1 ORDER BY repair_date DESC, id DESC', [eqId]);
        res.json({ status: 'ok', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Lỗi lấy lịch sử' });
    }
});

app.post('/api/office-equipments', async (req, res) => {
    try {
        const { location, name, category, ip_address, user_auth, password_auth, port_auth, note } = req.body;
        await pool.query(
            'INSERT INTO office_equipments (location, name, category, ip_address, user_auth, password_auth, port_auth, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [location || '', name, category || 'Máy in', ip_address || '', user_auth || '', password_auth || '', port_auth || '', note || '']
        );
        res.json({ status: 'ok', message: 'Thêm thiết bị thành công' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

app.put('/api/office-equipments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { location, name, category, ip_address, user_auth, password_auth, port_auth, note } = req.body;
        await pool.query(
            'UPDATE office_equipments SET location=$1, name=$2, category=$3, ip_address=$4, user_auth=$5, password_auth=$6, port_auth=$7, note=$8 WHERE id=$9',
            [location || '', name, category, ip_address || '', user_auth || '', password_auth || '', port_auth || '', note || '', id]
        );
        res.json({ status: 'ok', message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

app.delete('/api/office-equipments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM office_equipments WHERE id = $1', [id]);
        res.json({ status: 'ok', message: 'Xoá thành công' });
    } catch (err) {
        console.error('Lỗi xoá office-equipment:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

app.post('/api/office-equipments/import', async (req, res) => {
    try {
        const { mode, data } = req.body;
        if (mode === 'overwrite') {
            await pool.query('TRUNCATE office_equipments RESTART IDENTITY CASCADE');
        }
        for (const eq of data) {
            await pool.query(
                `INSERT INTO office_equipments (location, name, category, ip_address, user_auth, password_auth, port_auth, note)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    eq.location || '',
                    eq.name || 'PHOTO-UNKNOWN',
                    eq.category || 'Máy photo',
                    eq.ip_address || '',
                    eq.user_auth || '',
                    eq.password_auth || '',
                    eq.port_auth || '',
                    eq.note || ''
                ]
            );
        }
        res.json({ status: 'ok', message: `Đã nhập thành công ${data.length} máy!` });
    } catch (err) {
        console.error('Lỗi import office-equipment:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi máy chủ' });
    }
});

app.post('/api/office-repair-history', async (req, res) => {
    try {
        const { equipment_id, repair_date, content } = req.body;
        await pool.query(
            'INSERT INTO office_repair_history (equipment_id, repair_date, content) VALUES ($1, $2, $3)',
            [equipment_id, repair_date, content]
        );
        res.json({ status: 'ok', message: 'Thêm lịch sử thành công' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

app.delete('/api/office-repair-history/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM office_repair_history WHERE id = $1', [id]);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

// === API LỊCH SỬ SỬA CHỮA THIẾT BỊ VI TÍNH ===
app.get('/api/equipment-repair-history/:eqId', async (req, res) => {
    try {
        const { eqId } = req.params;
        const { rows } = await pool.query('SELECT * FROM equipment_repair_history WHERE equipment_id = $1 ORDER BY repair_date DESC, id DESC', [eqId]);
        res.json({ status: 'ok', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Lỗi lấy lịch sử' });
    }
});

app.post('/api/equipment-repair-history', async (req, res) => {
    try {
        const { equipment_id, repair_date, content } = req.body;
        await pool.query(
            'INSERT INTO equipment_repair_history (equipment_id, repair_date, content) VALUES ($1, $2, $3)',
            [equipment_id, repair_date, content]
        );
        res.json({ status: 'ok', message: 'Thêm lịch sử thành công' });
    } catch (err) {
        console.error('Lỗi thêm lịch sử thiết bị:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

app.delete('/api/equipment-repair-history/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM equipment_repair_history WHERE id = $1', [id]);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

// Phục vụ các file bảo vệ (HTML chính)
app.use(express.static(path.join(__dirname, '../public')));

// SPA support: fallback all non-API and non-static-file routes to index.html
app.use((req, res, next) => {
    // Nếu là API thì skip
    if (req.path.startsWith('/api/')) return next();
    // Gửi file index.html
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export app for Vercel
if (process.env.NODE_ENV !== 'production' || require.main === module) {
    app.listen(PORT, async () => {
        console.log(`🚀 Web server đang chạy tại http://localhost:${PORT}`);
        await testConnection();
    });
}

module.exports = app;
