const { pool } = require('./config/db');

async function updateSchema() {
    try {
        await pool.query(`
            ALTER TABLE equipments 
            ADD COLUMN IF NOT EXISTS repair_date TIMESTAMP;
        `);
        console.log('✅ Added repair_date column to equipments table');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating database schema:', error);
        process.exit(1);
    }
}

updateSchema();
