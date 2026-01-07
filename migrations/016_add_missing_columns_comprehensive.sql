-- Migration: Add all missing columns to tables
-- Date: 2026-01-07
-- Purpose: Add missing columns identified in comprehensive database schema audit
-- This migration adds 15 missing columns across 4 critical tables

BEGIN;

-- ========================================
-- 1. LOANS TABLE - Add 8 Missing Columns
-- ========================================

ALTER TABLE loans ADD COLUMN IF NOT EXISTS redemption_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS reactivated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS reactivated_by_username VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS extended_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS extended_by_username VARCHAR(100);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS extended_at TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS updated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS updated_by_username VARCHAR(100);

-- Create indexes for new loans columns for performance
CREATE INDEX IF NOT EXISTS idx_loans_redemption_fee ON loans(redemption_fee);
CREATE INDEX IF NOT EXISTS idx_loans_extended_at ON loans(extended_at);
CREATE INDEX IF NOT EXISTS idx_loans_reactivated_by_user_id ON loans(reactivated_by_user_id);
CREATE INDEX IF NOT EXISTS idx_loans_extended_by_user_id ON loans(extended_by_user_id);
CREATE INDEX IF NOT EXISTS idx_loans_updated_by_user_id ON loans(updated_by_user_id);

-- ================================================
-- 2. PAYMENT_HISTORY TABLE - Add 6 Missing Columns
-- ================================================

ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50);
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS processor VARCHAR(100);
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for new payment_history columns
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_type ON payment_history(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_status ON payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_history_reference_number ON payment_history(reference_number);
CREATE INDEX IF NOT EXISTS idx_payment_history_processor ON payment_history(processor);

-- ===============================================
-- 3. CUSTOMERS TABLE - Add 1 Missing Column
-- ===============================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_image TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_profile_image ON customers(profile_image);

-- ===============================================
-- 4. CREATE DISCOUNT_LOGS TABLE (Missing Table)
-- ===============================================

CREATE TABLE IF NOT EXISTS discount_logs (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    discount_amount NUMERIC(10, 2) NOT NULL,
    applied_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    applied_by_username VARCHAR(100),
    previous_interest_amount NUMERIC(10, 2),
    new_interest_amount NUMERIC(10, 2),
    previous_total_payable NUMERIC(10, 2),
    new_total_payable NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for discount_logs table
CREATE INDEX IF NOT EXISTS idx_discount_logs_loan_id ON discount_logs(loan_id);
CREATE INDEX IF NOT EXISTS idx_discount_logs_customer_id ON discount_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_discount_logs_applied_by_user_id ON discount_logs(applied_by_user_id);
CREATE INDEX IF NOT EXISTS idx_discount_logs_created_at ON discount_logs(created_at);

-- ===================================================
-- 5. ADD LOAN EXTENSION TRACKING COLUMNS (if missing)
-- ===================================================

ALTER TABLE loans ADD COLUMN IF NOT EXISTS last_discounted_at TIMESTAMP;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS last_discounted_by VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_loans_last_discounted_at ON loans(last_discounted_at);

-- ========================================
-- 6. VERIFY TABLE STRUCTURE (Documentation)
-- ========================================

-- LOANS Table Final Structure (after migration):
-- id, customer_id, customer_name, customer_number, loan_amount, interest_rate, created_at,
-- created_by, first_name, last_name, email, home_phone, mobile_phone, birthdate, referral,
-- identification_info, address, street_address, city, state, zipcode, interest_amount,
-- total_payable_amount, recurring_fee, collateral_description, collateral_image, customer_note,
-- loan_issued_date, loan_term, remaining_balance, created_by_user_id, created_by_username,
-- transaction_number, issued_date, redeemed_date, forfeited_date, is_redeemed, is_forfeited,
-- item_category, item_description, updated_at, due_date, status, id_type, id_number,
-- [NEW] redemption_fee, reactivated_by_user_id, reactivated_by_username, extended_by_user_id,
-- [NEW] extended_by_username, extended_at, updated_by_user_id, updated_by_username,
-- [NEW] last_discounted_at, last_discounted_by

-- PAYMENT_HISTORY Table Final Structure (after migration):
-- id, loan_id, payment_method, payment_amount, payment_date, created_by,
-- [NEW] payment_type, payment_status, reference_number, notes, processor, updated_at

-- CUSTOMERS Table Final Structure (after migration):
-- id, first_name, last_name, email, home_phone, mobile_phone, birthdate,
-- id_type, id_number, referral, identification_info, street_address, city, state, zipcode,
-- customer_number, created_at, created_by_user_id, created_by_username, updated_at,
-- updated_by_user_id, updated_by_username, [NEW] profile_image

-- DISCOUNT_LOGS Table (newly created):
-- id, loan_id, customer_id, discount_amount, applied_by_user_id, applied_by_username,
-- previous_interest_amount, new_interest_amount, previous_total_payable, new_total_payable, created_at

COMMIT;
