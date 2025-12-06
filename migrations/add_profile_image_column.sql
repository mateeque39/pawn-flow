-- Migration: Add profile_image column to customers table
-- Date: 2025-11-27
-- Purpose: Store Base64-encoded profile pictures for customers

-- Check if column already exists
-- Run this manually first to verify the column needs to be added:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name='customers' AND column_name='profile_image';

-- If the query returns no rows, run the ALTER TABLE command below:

ALTER TABLE customers 
ADD COLUMN profile_image TEXT NULL;

-- Comment explaining the column
COMMENT ON COLUMN customers.profile_image IS 'Base64-encoded profile picture for the customer';

-- Verify the column was added
-- Run: SELECT * FROM customers LIMIT 1;
-- You should see profile_image in the list of columns
