const { pool } = require('./config/db');
const bcrypt = require('bcrypt');

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Created users table');

        const username = 'longkenzy';
        const passwordText = 'Longkenzy@7525';
        
        // check if user exists
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash(passwordText, 10);
            await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
            console.log('✅ Default user longkenzy created');
        } else {
            console.log('⚠️ User longkenzy already exists');
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing DB:', error);
        process.exit(1);
    }
}

initDB();
