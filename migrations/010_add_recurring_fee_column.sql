-- Add recurring_fee column to loans table
-- This column stores the monthly recurring flat fee amount (e.g., $5/month on top of interest)

ALTER TABLE loans ADD COLUMN IF NOT EXISTS recurring_fee NUMERIC(10, 2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN loans.recurring_fee IS 'Monthly recurring flat fee amount (e.g., $5/month) charged on top of interest';
