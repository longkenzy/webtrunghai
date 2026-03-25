const { pool } = require('./src/config/db');
pool.query('ALTER TABLE equipments ADD COLUMN IF NOT EXISTS department VARCHAR(255)')
  .then(() => { console.log('OK'); pool.end(); })
  .catch(err => { console.error(err); pool.end(); });
