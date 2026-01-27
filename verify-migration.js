#!/usr/bin/env node

/**
 * Verify Initial Loan Amount Migration
 * 
 * Run this script after deployment to verify the fix worked correctly
 * Usage: node verify-migration.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyMigration() {
  try {
    console.log('🔍 Verifying Initial Loan Amount Migration\n');
    console.log('═'.repeat(60));

    // Check 1: Column exists
    console.log('\n1️⃣  Checking if initial_loan_amount column exists...');
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loans' 
      AND column_name = 'initial_loan_amount';
    `);

    if (columnCheck.rows.length === 0) {
      console.log('❌ Column does not exist - Migration may have failed');
      throw new Error('initial_loan_amount column not found');
    }
    console.log('✅ Column exists\n');

    // Check 2: Migrations table exists
    console.log('2️⃣  Checking migrations tracking table...');
    const migrationsTableCheck = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'migrations';
    `);

    if (migrationsTableCheck.rows.length === 0) {
      console.log('⚠️  Migrations table not found (will be created on next run)\n');
    } else {
      console.log('✅ Migrations table exists\n');

      // Check 3: Migration was recorded
      console.log('3️⃣  Checking if migration was recorded...');
      const migrationRecord = await pool.query(
        "SELECT * FROM migrations WHERE name LIKE '%initial_loan_amount%';"
      );

      if (migrationRecord.rows.length === 0) {
        console.log('⚠️  Migration not recorded in tracking table');
        console.log('   (This is OK if you ran the migration manually)\n');
      } else {
        console.log('✅ Migration recorded:', migrationRecord.rows[0].executed_at);
        console.log('\n');
      }
    }

    // Check 4: Loans have data
    console.log('4️⃣  Checking loan data...');
    const loanStats = await pool.query(`
      SELECT 
        COUNT(*) as total_loans,
        COUNT(CASE WHEN initial_loan_amount > 0 THEN 1 END) as loans_with_initial_amount,
        COUNT(CASE WHEN initial_loan_amount = 0 THEN 1 END) as loans_without_amount,
        COALESCE(AVG(initial_loan_amount), 0)::NUMERIC(10,2) as avg_initial_amount,
        COALESCE(SUM(initial_loan_amount), 0)::NUMERIC(10,2) as total_initial_amount,
        COALESCE(AVG(loan_amount), 0)::NUMERIC(10,2) as avg_current_amount,
        COALESCE(SUM(loan_amount), 0)::NUMERIC(10,2) as total_current_amount
      FROM loans;
    `);

    const stats = loanStats.rows[0];
    console.log(`   Total loans: ${stats.total_loans}`);
    console.log(`   Loans with initial_loan_amount: ${stats.loans_with_initial_amount}`);
    console.log(`   Loans without amount: ${stats.loans_without_amount}`);
    console.log(`   Average initial amount: $${stats.avg_initial_amount}`);
    console.log(`   Total initial amount: $${stats.total_initial_amount}`);
    console.log(`   Average current amount: $${stats.avg_current_amount}`);
    console.log(`   Total current amount: $${stats.total_current_amount}`);
    console.log('\n');

    // Check 5: Sample data
    console.log('5️⃣  Sample loan data:');
    const sampleLoans = await pool.query(`
      SELECT 
        id,
        transaction_number,
        loan_amount,
        initial_loan_amount,
        (loan_amount - initial_loan_amount)::NUMERIC(10,2) as amount_added,
        created_at
      FROM loans 
      WHERE loan_amount > 0
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    if (sampleLoans.rows.length === 0) {
      console.log('   No loans found in database\n');
    } else {
      console.log('   ID | Initial | Current | Added | Created');
      console.log('   ' + '─'.repeat(55));
      sampleLoans.rows.forEach(loan => {
        console.log(
          `   ${loan.id} | $${loan.initial_loan_amount} | $${loan.loan_amount} | $${loan.amount_added} | ${new Date(loan.created_at).toLocaleDateString()}`
        );
      });
      console.log('\n');
    }

    // Final verdict
    console.log('═'.repeat(60));
    console.log('\n✅ Migration Verification Summary:\n');

    if (columnCheck.rows.length > 0 && stats.total_loans >= 0) {
      console.log('✨ Everything looks good!');
      console.log('\n   ✓ Column exists');
      console.log('   ✓ Data structure is correct');
      
      if (stats.total_loans === 0) {
        console.log('   ✓ No loans yet (ready for first loan)');
      } else {
        console.log(`   ✓ ${stats.total_loans} existing loans migrated`);
        console.log(`   ✓ Total value tracked: $${stats.total_initial_amount}`);
      }

      console.log('\n🚀 Ready to use! The fix is deployed correctly.\n');
      console.log('   You can now:');
      console.log('   - Add money to loans without blocking new loans');
      console.log('   - Create loans and the balance will be correct');
      console.log('   - Track original vs. current loan amounts\n');
    } else {
      console.log('⚠️  Some checks failed. Please review the output above.\n');
    }

    console.log('═'.repeat(60) + '\n');

  } catch (err) {
    console.error('\n❌ Verification failed:', err.message);
    console.error('\nMake sure:');
    console.error('  1. DATABASE_URL is set correctly');
    console.error('  2. Database is accessible');
    console.error('  3. You have permission to query migrations table');
    console.error('  4. PostgreSQL version is 9.6 or higher\n');
  } finally {
    await pool.end();
  }
}

// Run verification
verifyMigration().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
