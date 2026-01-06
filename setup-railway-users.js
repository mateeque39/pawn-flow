const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Get Railway database URL
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  if (process.env.PGHOST && process.env.PGPORT && process.env.PGDATABASE) {
    return `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
  }
  // Railway database from the context shown earlier
  return 'postgresql://postgres:JRBSJwVnsLaJGxzSFpgrCR1kFsAXmuxQ@switchyard.proxy.riww.net:15291/railway';
};

const DATABASE_URL = getDatabaseUrl();
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false
});

const testUsers = [
  {
    username: 'Qasim',
    password: 'Qasim123!', // Test password
    roleId: 1
  },
  {
    username: 'sakina',
    password: 'sakina123!', // Test password
    roleId: 1
  }
];

(async () => {
  try {
    console.log('🔌 Connecting to Railway database...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to database');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Users table does not exist! Please run migrations first.');
      process.exit(1);
    }
    
    // Insert test users
    for (const user of testUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Check if user exists
        const checkUser = await pool.query(
          'SELECT id FROM users WHERE username = $1',
          [user.username]
        );
        
        if (checkUser.rows.length > 0) {
          console.log(`⚠️ User ${user.username} already exists, skipping...`);
          continue;
        }
        
        // Insert user
        await pool.query(
          'INSERT INTO users (username, password, role_id, created_at) VALUES ($1, $2, $3, NOW())',
          [user.username, hashedPassword, user.roleId]
        );
        
        console.log(`✅ Inserted user: ${user.username} (password: ${user.password})`);
      } catch (err) {
        console.error(`❌ Error inserting user ${user.username}:`, err.message);
      }
    }
    
    // Display all users
    console.log('\n📋 Current users in database:');
    const result = await pool.query('SELECT id, username, role_id FROM users ORDER BY id');
    result.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Username: ${row.username}, Role ID: ${row.role_id}`);
    });
    
    console.log('\n✨ Test user setup complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
})();
