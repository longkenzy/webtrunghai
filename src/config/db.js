const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

// Sử dụng WebSocket thay vì TCP thông thường để tránh bị chặn Port 5432 ở trường học/công ty
neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Kết nối Neon PostgreSQL (qua WebSocket) thành công! Thời gian hiện tại:', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối CSDL:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};
