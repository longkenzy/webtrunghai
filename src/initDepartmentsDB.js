const { pool } = require('./config/db');

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created departments table');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing DB:', error);
        process.exit(1);
    }
}

initDB();
