require('dotenv').config();
const { pool } = require('./src/config/db');

async function extendTable() {
    try {
        await pool.query('ALTER TABLE equipments ADD COLUMN IF NOT EXISTS os VARCHAR(100);');
        await pool.query('ALTER TABLE equipments ADD COLUMN IF NOT EXISTS periodic_check_time VARCHAR(100);');
        console.log('Columns os and periodic_check_time added');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

extendTable();
