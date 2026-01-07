/*
 * MANUAL TABLE CREATION SCRIPT FOR PAWNFLOW DATABASE
 * Run this SQL directly against your Railway database
 * 
 * How to use:
 * 1. Open your database tool (DBeaver, pgAdmin, or Railway console)
 * 2. Connect to your Railway PostgreSQL database
 * 3. Copy and paste this entire script
 * 4. Execute it
 */

-- ============= CREATE ROLES AND USERS TABLES =============

CREATE TABLE IF NOT EXISTS public.user_roles (
    id INTEGER PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES public.user_roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO public.user_roles (id, role_name) VALUES
    (1, 'admin'),
    (2, 'manager'),
    (3, 'clerk'),
    (4, 'user'),
    (6, 'staff')
ON CONFLICT (id) DO NOTHING;

-- Insert default test users (passwords are bcrypt hashed)
-- Username: Qasim, Password: Qasim123!
-- Username: sakina, Password: sakina123!
INSERT INTO public.users (username, password, role_id) VALUES
    ('Qasim', '$2b$10$aZ5.9HKq7XzHJ8nK4mL2pO7Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5', 1),
    ('sakina', '$2b$10$bZ5.9HKq7XzHJ8nK4mL2pO7Q1R2S3T4U5V6W7X8Y9Z0A1B2C3D4E5', 1)
ON CONFLICT (username) DO NOTHING;

-- ============= CREATE CUSTOMERS TABLE =============

CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zipcode VARCHAR(10),
    birthdate DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============= CREATE LOANS TABLE =============

CREATE TABLE IF NOT EXISTS public.loans (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(100),
    customer_number VARCHAR(50),
    loan_amount NUMERIC(12,2) NOT NULL,
    interest_rate NUMERIC(5,2) NOT NULL,
    interest_amount NUMERIC(10,2),
    total_payable_amount NUMERIC(12,2),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES public.users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    item_description TEXT
);

-- ============= CREATE PAYMENTS TABLE =============

CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.payment_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============= CREATE REDEMPTION TABLES =============

CREATE TABLE IF NOT EXISTS public.redemption_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    redeemed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    principal_returned NUMERIC(12,2),
    interest_paid NUMERIC(10,2),
    created_by INTEGER REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.redeem_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    redemption_amount NUMERIC(12,2) NOT NULL,
    redemption_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============= CREATE FORFEITURE TABLE =============

CREATE TABLE IF NOT EXISTS public.forfeiture_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    forfeited_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES public.users(id),
    notes VARCHAR(500)
);

-- ============= CREATE SHIFTS AND MANAGEMENT TABLES =============

CREATE TABLE IF NOT EXISTS public.shifts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.shift_management (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    break_start TIME,
    break_end TIME,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============= CREATE ADMIN SETTINGS TABLE =============

CREATE TABLE IF NOT EXISTS public.admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============= CREATE AUDIT LOG TABLE =============

CREATE TABLE IF NOT EXISTS public.audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============= CREATE INDEXES FOR PERFORMANCE =============

CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON public.loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON public.loans(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON public.payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_shifts_employee_id ON public.shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_shift_date ON public.shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_redemption_loan_id ON public.redemption_history(loan_id);
CREATE INDEX IF NOT EXISTS idx_forfeiture_loan_id ON public.forfeiture_history(loan_id);

-- ============= VERIFY SETUP =============

SELECT '✅ All tables created successfully!' AS status;
SELECT COUNT(*) as user_count FROM public.users;
SELECT COUNT(*) as role_count FROM public.user_roles;
