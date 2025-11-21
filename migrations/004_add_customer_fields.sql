-- Migration: Add comprehensive customer fields to loans table
-- Created: 2025-11-21
-- This migration adds new customer information fields to support better data collection

-- UP: Add new columns to loans table
BEGIN;

-- Add new customer information columns
ALTER TABLE loans ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS home_phone VARCHAR(20);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(20);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS referral VARCHAR(255);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS identification_info TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS address TEXT;

-- Create indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_loans_first_name ON loans(first_name);
CREATE INDEX IF NOT EXISTS idx_loans_last_name ON loans(last_name);
CREATE INDEX IF NOT EXISTS idx_loans_email ON loans(email);
CREATE INDEX IF NOT EXISTS idx_loans_mobile_phone ON loans(mobile_phone);

-- Migrate existing customer_name data to first_name and last_name
-- Strategy: Split on first space; if no space, put all in last_name
-- For PostgreSQL, use: SPLIT_PART(customer_name, ' ', 1) and SPLIT_PART with position
UPDATE loans
SET 
  first_name = CASE 
    WHEN customer_name ~ ' ' THEN SPLIT_PART(customer_name, ' ', 1)
    ELSE customer_name
  END,
  last_name = CASE 
    WHEN customer_name ~ ' ' THEN SUBSTRING(customer_name FROM POSITION(' ' IN customer_name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL AND customer_name IS NOT NULL;

COMMIT;

-- DOWN: Remove new columns (for rollback)
-- BEGIN;
-- ALTER TABLE loans DROP COLUMN IF EXISTS first_name;
-- ALTER TABLE loans DROP COLUMN IF EXISTS last_name;
-- ALTER TABLE loans DROP COLUMN IF EXISTS email;
-- ALTER TABLE loans DROP COLUMN IF EXISTS home_phone;
-- ALTER TABLE loans DROP COLUMN IF EXISTS mobile_phone;
-- ALTER TABLE loans DROP COLUMN IF EXISTS birthdate;
-- ALTER TABLE loans DROP COLUMN IF EXISTS referral;
-- ALTER TABLE loans DROP COLUMN IF EXISTS identification_info;
-- ALTER TABLE loans DROP COLUMN IF EXISTS address;
-- DROP INDEX IF EXISTS idx_loans_first_name;
-- DROP INDEX IF EXISTS idx_loans_last_name;
-- DROP INDEX IF EXISTS idx_loans_email;
-- DROP INDEX IF EXISTS idx_loans_mobile_phone;
-- COMMIT;
