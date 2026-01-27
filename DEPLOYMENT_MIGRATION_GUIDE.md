# Deployment Guide: Initial Loan Amount Migration

## Overview
This migration adds the `initial_loan_amount` column to track original loan amounts separately from modified amounts. This fixes the "insufficient store cash" bug when adding money to loans.

## What Gets Migrated

The migration:
1. ✅ Adds `initial_loan_amount` column to the `loans` table
2. ✅ Populates all existing loans with their current `loan_amount` as `initial_loan_amount`
3. ✅ Tracks which migrations have been run to prevent duplicates
4. ✅ Runs automatically during deployment

## Deployment Instructions

### Option 1: Automatic (Recommended)
When you deploy your code, the migrations run automatically:

```bash
npm run deploy
```

This command:
- Runs all pending migrations
- Starts the server
- Never runs the same migration twice

### Option 2: Manual Migration Only
If you want to run migrations separately from starting the server:

```bash
npm run migrate
```

Then start the server normally:

```bash
npm start
```

### Option 3: Manual SQL (If migrations fail)
If the migration runner has issues, run this directly in your database:

```sql
-- Add the column
ALTER TABLE loans
ADD COLUMN IF NOT EXISTS initial_loan_amount NUMERIC NOT NULL DEFAULT 0;

-- Populate existing loans
UPDATE loans
SET initial_loan_amount = loan_amount
WHERE initial_loan_amount IS NULL OR initial_loan_amount = 0;

-- Verify the update
SELECT 
  COUNT(*) as total_loans,
  COUNT(CASE WHEN initial_loan_amount > 0 THEN 1 END) as loans_with_initial_amount,
  SUM(initial_loan_amount) as total_initial_amount
FROM loans;
```

## What Changed in the Code

### Files Modified
1. **`db-init.js`** - Added `initial_loan_amount` column definition
2. **`server.js`** - Updated 3 endpoints to use `initial_loan_amount` for cash checks
3. **`package.json`** - Added migration scripts
4. **`run-migrations.js`** - Enhanced to handle JavaScript migrations

### New Files Created
- **`migrations/20260127_add_initial_loan_amount.js`** - The migration file
- **`migrations/` directory** - Stores all future migrations

## How Migrations Work

1. **First Deployment**: All migrations in `migrations/` folder run automatically
2. **Subsequent Deployments**: Only new migrations (not in `migrations` table) run
3. **Tracking**: Each migration is recorded in the `migrations` table
4. **Safety**: Same migration never runs twice

## Verification

After deployment, verify the migration worked:

```sql
-- Check if column exists and has data
SELECT COUNT(*) as total_loans, 
       COUNT(CASE WHEN initial_loan_amount > 0 THEN 1 END) as loans_with_amounts
FROM loans;

-- Check migration history
SELECT * FROM migrations ORDER BY executed_at DESC;
```

## Troubleshooting

### If migration fails:
1. Check database logs for the specific error
2. Ensure `DATABASE_URL` is set correctly
3. Try running the manual SQL option above
4. Contact support with the error message

### If deployed but migration didn't run:
1. Run `npm run migrate` manually
2. Check that the `migrations` table was created
3. Verify `initial_loan_amount` column exists in `loans` table

## What This Fixes

✅ **Before**: Adding $10,000 to a loan made it impossible to create a new $10,000 loan (said "insufficient funds")

✅ **After**: Adding money to loans doesn't affect available balance for new loans

## Rollback (If Needed)

If you need to revert this migration:

1. Delete the record from `migrations` table:
   ```sql
   DELETE FROM migrations WHERE name = '20260127_add_initial_loan_amount.js';
   ```

2. Optional: Drop the column (data loss):
   ```sql
   ALTER TABLE loans DROP COLUMN initial_loan_amount;
   ```

3. Redeploy previous version

## Questions?

If the migration fails or you have questions, check:
- Database connectivity
- Environment variables set correctly
- Log output for specific error messages
- PostgreSQL version compatibility (requires 9.6+)
