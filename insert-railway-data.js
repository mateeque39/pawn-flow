#!/usr/bin/env node

/**
 * Standalone script to insert initial user roles and users into Railway PostgreSQL
 * Usage: node insert-railway-data.js
 * 
 * This script connects directly to Railway and inserts the necessary seed data
 */

const { Pool } = require('pg');
require('dotenv').config();

// Use Railway's public connection URL
const RAILWAY_URL = 'postgresql://postgres:JRBSJwVnsLaJGxzSFpgrCR1kFsAXmuxQ@switchyard.proxy.riww.net:15291/railway';

const pool = new Pool({
  connectionString: RAILWAY_URL,
  ssl: { rejectUnauthorized: false }
});

async function insertData() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connected to Railway PostgreSQL');
    
    // Insert user roles
    console.log('\n📝 Inserting user roles...');
    await client.query(`
      INSERT INTO public.user_roles (id, role_name) VALUES
      (1, 'admin'),
      (2, 'manager'),
      (3, 'clerk'),
      (4, 'user'),
      (6, 'staff')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ User roles inserted');

    // Insert users
    console.log('\n📝 Inserting users...');
    await client.query(`
      INSERT INTO public.users (id, username, password, role_id, created_at) VALUES
      (1, 'Qasim', '$2b$10$pSTbpia/XhfOcobg1QiDjeqOONLU/jBO5kQlqOiy0gdES3Q/KH1DG', 1, '2025-11-16 04:34:19.799627'),
      (2, 'sakina', '$2b$10$Rq7HkdQ2TzeAYzHMAsW7ZulmW3u8EfiIuFWrhlTEDYL0AWIAxHgvi', 1, '2025-11-16 04:36:34.501602'),
      (3, 'alesterhook@gmail.com', '$2b$10$O9znPqF4v8sFzzVa6DYSuCpb6A4KMo8/vMi5PS0xa0ReVN15gmAK', 4, '2025-11-16 04:37:10.636968'),
      (9, 'user1_admin', '$2b$10$65VMIJw6nCdbebpd3tI1SuEioX708vyq33Y6ntPolQRxUuqWJcVB.', 1, '2025-11-24 05:03:21.045736'),
      (12, 'user2_manager', '$2b$10$eMaIXCi17a14uhlhXAOC..Fjp/LiqnCEE.iEx.RoJVIVwt1bb./8.', 1, '2025-11-24 05:06:16.770334'),
      (13, 'user3_clerk', '$2b$10$u8iJ.r3CGQRKSSDe8M.RaeiSvjDc.qV1N7Q09ZkTpc8z9Tl6t.LF6', 1, '2025-11-24 05:07:36.567323')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Users inserted');

    // Verify the data
    console.log('\n🔍 Verifying data...');
    const rolesResult = await client.query('SELECT COUNT(*) FROM public.user_roles;');
    const usersResult = await client.query('SELECT COUNT(*) FROM public.users;');
    
    console.log(`📊 Total user_roles: ${rolesResult.rows[0].count}`);
    console.log(`📊 Total users: ${usersResult.rows[0].count}`);

    console.log('\n✨ Data insertion completed successfully!');
    console.log('\n🎯 You can now log in with:');
    console.log('   Username: Qasim');
    console.log('   (Use the password from your database)');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
console.log('🚀 Starting data insertion to Railway...\n');
insertData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
