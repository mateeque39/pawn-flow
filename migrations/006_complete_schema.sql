-- Complete schema for loans table with all required columns
-- This adds any missing columns needed by the application

ALTER TABLE loans ADD COLUMN IF NOT EXISTS transaction_number VARCHAR(100) UNIQUE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_issued_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_term INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS issued_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS redeemed_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS forfeited_date DATE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS is_redeemed BOOLEAN DEFAULT FALSE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS is_forfeited BOOLEAN DEFAULT FALSE;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(10, 2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS collateral_description TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS customer_note TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS created_by_username VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS item_category VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS item_description TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Create additional indexes for frequently searched columns
CREATE INDEX IF NOT EXISTS idx_loans_transaction_number ON loans(transaction_number);
