/**
 * Migration: Add initial_loan_amount column and populate with existing loan amounts
 * Date: January 27, 2026
 * 
 * This migration:
 * 1. Adds the initial_loan_amount column to loans table (if not exists)
 * 2. Populates existing loans with their current loan_amount as initial_loan_amount
 * 3. Ensures cash balance checks use initial amounts, not modified amounts
 */

const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/pawnflow'
  });

  try {
    console.log('🔄 Running migration: Add initial_loan_amount column...\n');

    // Step 1: Add column if it doesn't exist
    console.log('Step 1: Adding initial_loan_amount column (if not exists)...');
    await pool.query(`
      ALTER TABLE loans
      ADD COLUMN IF NOT EXISTS initial_loan_amount NUMERIC NOT NULL DEFAULT 0;
    `);
    console.log('✅ Column added (or already exists)\n');

    // Step 2: Populate initial_loan_amount for existing loans where it's 0 or NULL
    console.log('Step 2: Populating initial_loan_amount for existing loans...');
    const updateResult = await pool.query(`
      UPDATE loans
      SET initial_loan_amount = loan_amount
      WHERE initial_loan_amount IS NULL OR initial_loan_amount = 0;
    `);
    console.log(`✅ Updated ${updateResult.rowCount} loans with their current loan_amount as initial_loan_amount\n`);

    // Step 3: Verify migration
    console.log('Step 3: Verifying migration...');
    const verification = await pool.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(CASE WHEN initial_loan_amount > 0 THEN 1 END) as loans_with_initial_amount,
        AVG(initial_loan_amount) as avg_initial_amount,
        SUM(initial_loan_amount) as total_initial_amount
      FROM loans;
    `);
    
    const stats = verification.rows[0];
    console.log(`✅ Migration verification:
   - Total loans: ${stats.total_loans}
   - Loans with initial_loan_amount: ${stats.loans_with_initial_amount}
   - Average initial amount: $${parseFloat(stats.avg_initial_amount || 0).toFixed(2)}
   - Total initial amount: $${parseFloat(stats.total_initial_amount || 0).toFixed(2)}\n`);

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Summary:');
    console.log('   - initial_loan_amount column is now active');
    console.log('   - All existing loans have been populated');
    console.log('   - Cash balance calculations now use initial_loan_amount');
    console.log('   - Adding money to loans will no longer affect available balance\n');

    await pool.end();
    return true;
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    await pool.end();
    return false;
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runMigration };
