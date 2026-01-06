const { Pool } = require('pg');

// Test database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/pawn_shop'
});

(async () => {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET (using default)');
    
    const result = await pool.query('SELECT * FROM users LIMIT 5');
    console.log('✅ Database connection successful!');
    console.log('Users in database:', result.rows.length);
    console.log('Users:', result.rows.map(u => ({ id: u.id, username: u.username })));
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    await pool.end();
  }
})();
