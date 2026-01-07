-- Migration: Add all missing columns to loans table
-- Date: 2026-01-07
-- Purpose: Ensure loans table has all required columns for full loan creation

BEGIN;

-- Add missing identification columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS id_type VARCHAR(50);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);

-- Add missing address columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS zipcode VARCHAR(20);

-- Add missing collateral column
ALTER TABLE loans ADD COLUMN IF NOT EXISTS collateral_description TEXT;

-- Add missing amount columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(10, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_payable_amount NUMERIC(10, 2);

-- Add missing transaction column
ALTER TABLE loans ADD COLUMN IF NOT EXISTS transaction_number VARCHAR(100);

-- Add missing balance tracking
ALTER TABLE loans ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(10, 2);

COMMIT;

-- DOWN: Rollback (for reference)
-- BEGIN;
-- ALTER TABLE loans DROP COLUMN IF EXISTS id_type;
-- ALTER TABLE loans DROP COLUMN IF EXISTS id_number;
-- ALTER TABLE loans DROP COLUMN IF EXISTS street_address;
-- ALTER TABLE loans DROP COLUMN IF EXISTS city;
-- ALTER TABLE loans DROP COLUMN IF EXISTS state;
-- ALTER TABLE loans DROP COLUMN IF EXISTS zipcode;
-- ALTER TABLE loans DROP COLUMN IF EXISTS collateral_description;
-- ALTER TABLE loans DROP COLUMN IF EXISTS interest_amount;
-- ALTER TABLE loans DROP COLUMN IF EXISTS total_payable_amount;
-- ALTER TABLE loans DROP COLUMN IF EXISTS transaction_number;
-- ALTER TABLE loans DROP COLUMN IF EXISTS remaining_balance;
-- COMMIT;
