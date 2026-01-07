-- Migration: Add missing columns to payment_history table
-- Date: 2026-01-07
-- Purpose: Ensure payment_history table has all required columns for recording payments

BEGIN;

-- Add payment method column
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add payment type column
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50);

-- Add payment status column
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);

-- Add reference number for tracking
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- Add notes column
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add processor column for payment gateway
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS processor VARCHAR(100);

-- Add updated timestamp
ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

COMMIT;
