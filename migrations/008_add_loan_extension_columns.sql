-- Add extension tracking columns to loans table
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS extended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS extended_by_user_id INTEGER,
ADD COLUMN IF NOT EXISTS extended_by_username VARCHAR(100);

-- Create index for extension tracking
CREATE INDEX IF NOT EXISTS idx_loans_extended_by_user_id ON public.loans(extended_by_user_id);
