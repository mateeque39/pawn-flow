-- Migration: Add all missing columns to loans table
-- Date: 2026-01-07
-- Purpose: Ensure loans table has all required columns for full loan creation

BEGIN;

-- Add customer-related columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS customer_number VARCHAR(50);

-- Add name columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add contact columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS home_phone VARCHAR(20);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20);

-- Add demographic columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS referral VARCHAR(255);

-- Add identification columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS id_type VARCHAR(50);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS identification_info TEXT;

-- Add address columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS street_address VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS zipcode VARCHAR(20);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS address TEXT;

-- Add collateral columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS collateral_description TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS collateral_image TEXT;

-- Add amount columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS interest_amount NUMERIC(10, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS total_payable_amount NUMERIC(10, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS recurring_fee NUMERIC(10, 2);

-- Add item/note columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS item_category VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS item_description TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS customer_note TEXT;

-- Add transaction column
ALTER TABLE loans ADD COLUMN IF NOT EXISTS transaction_number VARCHAR(100) UNIQUE;

-- Add date columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_issued_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS issued_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS redeemed_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS forfeited_date DATE;

-- Add term columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_term INTEGER;

-- Add balance tracking
ALTER TABLE loans ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(10, 2);

-- Add status columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS is_redeemed BOOLEAN;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS is_forfeited BOOLEAN;

-- Add audit columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS created_by_username VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

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
