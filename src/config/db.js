const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Kết nối Neon PostgreSQL thành công! Thời gian hiện tại:', res.rows[0].now);
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
