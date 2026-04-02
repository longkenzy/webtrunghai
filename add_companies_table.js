require('dotenv').config();
const { pool } = require('./src/config/db');

async function createCompaniesTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created companies table');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

createCompaniesTable();
