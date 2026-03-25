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
        const { name, category, cpu, ram, rom, monitor, mouse, keyboard, assigned_to, department, status, repair_history } = req.body;
        
        await pool.query(
            'INSERT INTO equipments (name, category, cpu, ram, rom, monitor, mouse, keyboard, assigned_to, department, status, repair_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
            [name, category, cpu || '', ram || '', rom || '', monitor || '', mouse || '', keyboard || '', assigned_to || '', department || '', status || 'Sẵn sàng', repair_history || '']
        );
        res.json({ status: 'ok', message: 'Thêm thiết bị thành công' });
    } catch (err) {
        console.error('Lỗi thêm thiết bị:', err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi thêm thiết bị' });
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

// API health test
app.get('/api/health', async (req, res) => {
    const isConnected = await testConnection();
    if (isConnected) {
        res.status(200).json({ status: 'ok', message: 'Kết nối Database cực tốt!', user: req.user });
    } else {
        res.status(500).json({ status: 'error', message: 'Kết nối Database thất bại.' });
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
