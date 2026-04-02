const { pool } = require('./src/config/db');
async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'equipments'");
        console.log('✅ Columns:', res.rows.map(r => r.column_name));
        process.exit();
    } catch (err) {
        console.error('❌ Error checking schema:', err.message);
        process.exit(1);
    }
}
checkSchema();
