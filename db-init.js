/**
 * Database Initialization Module
 * Automatically creates all tables on first deployment to Railway
 * Run this during server startup to ensure database schema exists
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database initialization schema
const DATABASE_SCHEMA = `
-- Drop existing tables in correct dependency order (avoid foreign key issues)
DROP TABLE IF EXISTS redeem_history CASCADE;
DROP TABLE IF EXISTS redemption_history CASCADE;
DROP TABLE IF EXISTS forfeiture_history CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS shift_management CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS loans_backup CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Create user_roles table first (referenced by users)
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create users table (referenced by other tables)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES user_roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loans table (referenced by most history tables)
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_number VARCHAR(50),
    loan_amount NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    home_phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    birthdate DATE,
    referral VARCHAR(255),
    identification_info TEXT,
    address TEXT,
    street_address TEXT,
    city VARCHAR(128),
    state VARCHAR(64),
    zipcode VARCHAR(32),
    interest_amount NUMERIC(10,2),
    total_payable_amount NUMERIC(10,2),
    collateral_description TEXT,
    customer_note TEXT,
    loan_issued_date DATE,
    loan_term INTEGER,
    remaining_balance NUMERIC(10,2),
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by_username VARCHAR(100),
    transaction_number VARCHAR(100) UNIQUE,
    issued_date DATE,
    redeemed_date DATE,
    forfeited_date DATE,
    is_redeemed BOOLEAN DEFAULT FALSE,
    is_forfeited BOOLEAN DEFAULT FALSE,
    item_category VARCHAR(100),
    item_description TEXT,
    updated_at TIMESTAMP,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    id_type VARCHAR(50),
    id_number VARCHAR(100)
);

-- Create loans_backup table
CREATE TABLE IF NOT EXISTS loans_backup (
    id INTEGER,
    customer_name VARCHAR(100),
    customer_number VARCHAR(50),
    loan_amount NUMERIC,
    interest_rate NUMERIC,
    created_at TIMESTAMP,
    created_by INTEGER,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    home_phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    birthdate DATE,
    referral VARCHAR(255),
    identification_info TEXT,
    address TEXT,
    street_address TEXT,
    city VARCHAR(128),
    state VARCHAR(64),
    zipcode VARCHAR(32),
    interest_amount NUMERIC(10,2),
    total_payable_amount NUMERIC(10,2),
    collateral_description TEXT,
    customer_note TEXT,
    loan_issued_date DATE,
    loan_term INTEGER,
    remaining_balance NUMERIC(10,2),
    created_by_user_id INTEGER,
    created_by_username VARCHAR(100),
    transaction_number VARCHAR(100),
    issued_date DATE,
    redeemed_date DATE,
    forfeited_date DATE,
    is_redeemed BOOLEAN,
    is_forfeited BOOLEAN,
    item_category VARCHAR(100),
    item_description TEXT,
    updated_at TIMESTAMP,
    due_date DATE,
    status VARCHAR(50)
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    payment_method VARCHAR(50) NOT NULL,
    payment_amount NUMERIC NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    payment_amount NUMERIC(14,2) NOT NULL,
    payment_method VARCHAR(64),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by_user_id INTEGER,
    processed_by_username VARCHAR(128),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forfeiture_history table
CREATE TABLE IF NOT EXISTS forfeiture_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    forfeited_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    notes VARCHAR(500)
);

-- Create redeem_history table
CREATE TABLE IF NOT EXISTS redeem_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    redeemed_by INTEGER NOT NULL REFERENCES users(id),
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create redemption_history table
CREATE TABLE IF NOT EXISTS redemption_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    redeemed_amount NUMERIC(10,2),
    redeemed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    notes VARCHAR(500)
);

-- Create shift_management table
CREATE TABLE IF NOT EXISTS shift_management (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shift_end_time TIMESTAMP,
    opening_balance NUMERIC(12,2) NOT NULL,
    closing_balance NUMERIC(12,2),
    total_payments_received NUMERIC(12,2) DEFAULT 0,
    total_loans_given NUMERIC(12,2) DEFAULT 0,
    expected_balance NUMERIC(12,2),
    difference NUMERIC(12,2),
    is_balanced BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    opening_cash NUMERIC(10,2),
    closing_cash NUMERIC(10,2),
    cash_difference NUMERIC(10,2),
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_settings table for admin panel authentication
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    admin_password VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loans_created_by ON loans(created_by);
CREATE INDEX IF NOT EXISTS idx_loans_customer_name ON loans(customer_name);
CREATE INDEX IF NOT EXISTS idx_loans_email ON loans(email);
CREATE INDEX IF NOT EXISTS idx_loans_first_name ON loans(first_name);
CREATE INDEX IF NOT EXISTS idx_loans_last_name ON loans(last_name);
CREATE INDEX IF NOT EXISTS idx_loans_mobile_phone ON loans(mobile_phone);
CREATE INDEX IF NOT EXISTS idx_loans_transaction_number ON loans(transaction_number);
CREATE INDEX IF NOT EXISTS idx_payment_created_by ON payment_history(created_by);
CREATE INDEX IF NOT EXISTS idx_payment_history_loan_id ON payment_history(loan_id);
CREATE INDEX IF NOT EXISTS idx_shift_active ON shift_management(user_id, shift_end_time);
CREATE INDEX IF NOT EXISTS idx_shift_date ON shift_management(shift_start_time);
CREATE INDEX IF NOT EXISTS idx_shift_user_id ON shift_management(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add comments to loans table columns for documentation
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
`;

/**
 * Initialize database schema
 * This function creates all necessary tables if they don't exist
 * 
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function initializeDatabase(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database initialization...');
    
    // Execute the full schema creation script
    await client.query(DATABASE_SCHEMA);
    
    console.log('✅ Database schema initialized successfully!');
    
    // Initialize default roles
    console.log('🔧 Initializing default roles...');
    await client.query(`
      INSERT INTO user_roles (role_name) VALUES 
      ('admin'),
      ('staff'),
      ('manager'),
      ('user')
      ON CONFLICT (role_name) DO NOTHING;
    `);
    console.log('✅ Default roles initialized');
    
    // Initialize admin settings with default password if not exists
    console.log('🔧 Initializing admin settings...');
    const adminSettingsCheck = await client.query('SELECT COUNT(*) as count FROM admin_settings');
    if (parseInt(adminSettingsCheck.rows[0].count) === 0) {
      // Default admin password (should be changed on first login)
      const defaultPassword = 'admin123'; // Default password - MUST be changed
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await client.query(
        'INSERT INTO admin_settings (admin_password) VALUES ($1)',
        [hashedPassword]
      );
      console.log('✅ Admin settings initialized with default password');
    }
    
    // Verify all tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 Created/Verified tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Error details:', error.detail || error.code || '');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if database is already initialized
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Promise<boolean>}
 */
async function isDatabaseInitialized(pool) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking database status:', error.message);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  isDatabaseInitialized,
  DATABASE_SCHEMA
};
