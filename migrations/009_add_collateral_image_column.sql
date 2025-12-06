-- Migration: Add collateral_image column to loans table
-- Date: 2025-11-27
-- Purpose: Store Base64-encoded images of collateral items for loans

-- Check if column already exists
-- Run this manually first to verify the column needs to be added:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name='loans' AND column_name='collateral_image';

-- If the query returns no rows, run the ALTER TABLE command below:

ALTER TABLE loans
ADD COLUMN collateral_image TEXT NULL;

-- Comment explaining the column
COMMENT ON COLUMN loans.collateral_image IS 'Base64-encoded image of the collateral item';

-- Verify the column was added
-- Run: SELECT * FROM loans LIMIT 1;
-- You should see collateral_image in the list of columns
