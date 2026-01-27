const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  try {
    console.log('🔧 Starting migrations...\n');
    
    // Create migrations tracking table if it doesn't exist
    console.log('📝 Setting up migration tracking...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migration tracking table ready\n');

    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Get all migration files (both .sql and .js)
    const sqlFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    const jsFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    const allFiles = [...sqlFiles, ...jsFiles];
    console.log(`📁 Found ${allFiles.length} migration files (${sqlFiles.length} SQL, ${jsFiles.length} JavaScript)\n`);

    // Check which migrations have already been run
    const executedResult = await pool.query('SELECT name FROM migrations;');
    const executedMigrations = new Set(executedResult.rows.map(r => r.name));

    let migrationsRun = 0;

    // Run SQL migrations
    for (const file of sqlFiles) {
      if (executedMigrations.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`⏳ Running SQL: ${file}`);
      
      try {
        await pool.query(sql);
        // Record migration as executed
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        console.log(`✅ Completed: ${file}\n`);
        migrationsRun++;
      } catch (err) {
        console.error(`❌ Error in ${file}: ${err.message}`);
        console.error('Continuing with other migrations...\n');
      }
    }

    // Run JavaScript migrations
    for (const file of jsFiles) {
      if (executedMigrations.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      console.log(`⏳ Running JS: ${file}`);
      
      try {
        const migration = require(filePath);
        
        if (typeof migration.runMigration === 'function') {
          await migration.runMigration();
        }
        
        // Record migration as executed
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        console.log(`✅ Completed: ${file}\n`);
        migrationsRun++;
      } catch (err) {
        console.error(`❌ Error in ${file}: ${err.message}`);
        console.error('Continuing with other migrations...\n');
      }
    }
    
    console.log('═'.repeat(60));
    console.log('✨ All migrations completed!');
    console.log(`📊 Migrations run: ${migrationsRun}`);
    console.log(`⏭️  Migrations skipped: ${allFiles.length - migrationsRun}`);
    console.log('═'.repeat(60));
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
