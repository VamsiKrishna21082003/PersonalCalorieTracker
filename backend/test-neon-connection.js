require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW() as current_time')
  .then(result => {
    console.log('✓ Database connection successful!');
    console.log('Server time:', result.rows[0].current_time);
    pool.end();
    process.exit(0);
  })
  .catch(error => {
    console.log('✗ Connection failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('\nPossible issues:');
    console.log('1. Database might be paused (Neon pauses inactive databases)');
    console.log('2. Network/firewall blocking connection');
    console.log('3. Incorrect connection string');
    pool.end();
    process.exit(1);
  });
