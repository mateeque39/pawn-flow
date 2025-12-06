-- Create customers table for customer profiles
CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    home_phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    birthdate DATE,
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    referral VARCHAR(255),
    identification_info TEXT,
    street_address VARCHAR(255),
    city VARCHAR(128),
    state VARCHAR(64),
    zipcode VARCHAR(32),
    customer_number VARCHAR(50),
    created_by_user_id INTEGER,
    created_by_username VARCHAR(100),
    updated_by_user_id INTEGER,
    updated_by_username VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add customer_id column to loans table if it doesn't exist
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES public.customers(id) ON DELETE SET NULL;

-- Add reactivation columns to loans table if they don't exist
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS reactivated_by_user_id INTEGER,
ADD COLUMN IF NOT EXISTS reactivated_by_username VARCHAR(100);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_customers_mobile_phone ON public.customers(mobile_phone);
CREATE INDEX IF NOT EXISTS idx_customers_home_phone ON public.customers(home_phone);
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON public.customers(first_name);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON public.customers(last_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON public.loans(customer_id);

-- Create audit_log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_log (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    user_id INTEGER,
    username VARCHAR(100),
    loan_id INTEGER,
    customer_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB,
    FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_loan_id ON public.audit_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_customer_id ON public.audit_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON public.audit_log(timestamp);
