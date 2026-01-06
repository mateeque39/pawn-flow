const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Use Railway database
const pool = new Pool({
  connectionString: 'postgresql://postgres:JRBSJwVnsLaJGxzSFpgrCR1kFsAXmuxQ@switchyard.proxy.riww.net:15291/railway',
  ssl: false
});

// Test credentials for login
const testCredentials = [
  { username: 'Qasim', password: 'Qasim123!' },
  { username: 'sakina', password: 'sakina123!' }
];

(async () => {
  try {
    console.log('🔐 Updating passwords for test users...\n');
    
    for (const cred of testCredentials) {
      const hashedPassword = await bcrypt.hash(cred.password, 10);
      
      await pool.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [hashedPassword, cred.username]
      );
      
      console.log(`✅ Updated ${cred.username}`);
      console.log(`   Username: ${cred.username}`);
      console.log(`   Password: ${cred.password}\n`);
    }
    
    // Verify the update
    console.log('📋 Verifying passwords...');
    for (const cred of testCredentials) {
      const result = await pool.query(
        'SELECT password FROM users WHERE username = $1',
        [cred.username]
      );
      
      if (result.rows.length > 0) {
        const storedHash = result.rows[0].password;
        const matches = await bcrypt.compare(cred.password, storedHash);
        console.log(`${matches ? '✅' : '❌'} ${cred.username}: password verification ${matches ? 'passed' : 'failed'}`);
      }
    }
    
    console.log('\n🎯 You can now log in with:');
    testCredentials.forEach(cred => {
      console.log(`   Username: ${cred.username}, Password: ${cred.password}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
})();
