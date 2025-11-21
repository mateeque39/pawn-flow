-- Migration: Add extended customer fields to loans table
-- Date: 2025-11-21
-- Purpose: Support comprehensive customer information capture

-- ===== UP =====
-- Add new customer information columns
ALTER TABLE loans
  ADD COLUMN first_name VARCHAR(128),
  ADD COLUMN last_name VARCHAR(128),
  ADD COLUMN email VARCHAR(255),
  ADD COLUMN home_phone VARCHAR(64),
  ADD COLUMN mobile_phone VARCHAR(64),
  ADD COLUMN birthdate DATE,
  ADD COLUMN referral VARCHAR(128),
  ADD COLUMN identification_info TEXT,
  ADD COLUMN street_address TEXT,
  ADD COLUMN city VARCHAR(128),
  ADD COLUMN state VARCHAR(64),
  ADD COLUMN zipcode VARCHAR(32);

-- Create indexes on frequently searched fields for performance optimization
CREATE INDEX idx_loans_first_name ON loans(first_name);
CREATE INDEX idx_loans_last_name ON loans(last_name);
CREATE INDEX idx_loans_email ON loans(email);
CREATE INDEX idx_loans_mobile_phone ON loans(mobile_phone);

-- Safe data migration: Split legacy customer_name into first_name and last_name
-- This preserves existing customer_name data while populating new fields
-- If no space exists in customer_name, entire value goes to last_name
UPDATE loans
SET 
  first_name = CASE 
    WHEN customer_name IS NOT NULL AND position(' ' IN customer_name) > 0 
    THEN split_part(customer_name, ' ', 1)
    ELSE NULL
  END,
  last_name = CASE 
    WHEN customer_name IS NOT NULL 
    THEN COALESCE(
      CASE 
        WHEN position(' ' IN customer_name) > 0 
        THEN substring(customer_name FROM position(' ' IN customer_name) + 1)
        ELSE customer_name
      END,
      ''
    )
    ELSE NULL
  END
WHERE customer_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Add comment documenting the migration
COMMENT ON COLUMN loans.first_name IS 'Customer first name (migrated from customer_name or entered directly)';
COMMENT ON COLUMN loans.last_name IS 'Customer last name (migrated from customer_name or entered directly)';
COMMENT ON COLUMN loans.email IS 'Customer email address';
COMMENT ON COLUMN loans.home_phone IS 'Customer home phone number';
COMMENT ON COLUMN loans.mobile_phone IS 'Customer mobile phone number';
COMMENT ON COLUMN loans.birthdate IS 'Customer date of birth';
COMMENT ON COLUMN loans.referral IS 'How customer was referred';
COMMENT ON COLUMN loans.identification_info IS 'Customer identification details';
COMMENT ON COLUMN loans.street_address IS 'Customer street address';
COMMENT ON COLUMN loans.city IS 'Customer city';
COMMENT ON COLUMN loans.state IS 'Customer state/province';
COMMENT ON COLUMN loans.zipcode IS 'Customer postal/zip code';

-- ===== DOWN (Rollback) =====
-- DROP INDEX IF EXISTS idx_loans_mobile_phone;
-- DROP INDEX IF EXISTS idx_loans_email;
-- DROP INDEX IF EXISTS idx_loans_last_name;
-- DROP INDEX IF EXISTS idx_loans_first_name;
-- 
-- ALTER TABLE loans
--   DROP COLUMN IF EXISTS zipcode,
--   DROP COLUMN IF EXISTS state,
--   DROP COLUMN IF EXISTS city,
--   DROP COLUMN IF EXISTS street_address,
--   DROP COLUMN IF EXISTS identification_info,
--   DROP COLUMN IF EXISTS referral,
--   DROP COLUMN IF EXISTS birthdate,
--   DROP COLUMN IF EXISTS mobile_phone,
--   DROP COLUMN IF EXISTS home_phone,
--   DROP COLUMN IF EXISTS email,
--   DROP COLUMN IF EXISTS last_name,
--   DROP COLUMN IF EXISTS first_name;
