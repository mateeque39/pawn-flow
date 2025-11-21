-- Migration: Create initial database schema
-- Date: 2025-11-21
-- Purpose: Initialize all core tables for the pawn shop management system

-- ===== CREATE TABLES =====

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES user_roles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table (core transaction table)
CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  transaction_number VARCHAR(100) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  item_category VARCHAR(100),
  loan_amount DECIMAL(10, 2) NOT NULL,
  interest_amount DECIMAL(10, 2),
  total_payable_amount DECIMAL(10, 2),
  interest_rate DECIMAL(5, 2),
  issued_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_date DATE,
  is_forfeited BOOLEAN DEFAULT FALSE,
  forfeited_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  notes VARCHAR(500)
);

-- Redemption history table
CREATE TABLE IF NOT EXISTS redemption_history (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  redeemed_amount DECIMAL(10, 2),
  redeemed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  notes VARCHAR(500)
);

-- Forfeiture history table
CREATE TABLE IF NOT EXISTS forfeiture_history (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  forfeited_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  notes VARCHAR(500)
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  opening_cash DECIMAL(10, 2),
  closing_cash DECIMAL(10, 2),
  cash_difference DECIMAL(10, 2),
  notes VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== CREATE INDEXES =====
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_issued_date ON loans(issued_date);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
CREATE INDEX IF NOT EXISTS idx_loans_customer_name ON loans(customer_name);
CREATE INDEX IF NOT EXISTS idx_loans_transaction_number ON loans(transaction_number);
CREATE INDEX IF NOT EXISTS idx_payment_history_loan_id ON payment_history(loan_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ===== INSERT DEFAULT DATA =====
-- Insert default user roles if they don't exist
INSERT INTO user_roles (role_name) VALUES ('admin') ON CONFLICT DO NOTHING;
INSERT INTO user_roles (role_name) VALUES ('staff') ON CONFLICT DO NOTHING;
INSERT INTO user_roles (role_name) VALUES ('manager') ON CONFLICT DO NOTHING;
