require('dotenv').config();
const { pool } = require('./src/config/db');

async function extendTable() {
    try {
        await pool.query('ALTER TABLE equipments ADD COLUMN IF NOT EXISTS company VARCHAR(100);');
        console.log('Column company added');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

extendTable();
