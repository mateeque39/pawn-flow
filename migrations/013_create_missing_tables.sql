-- Create missing tables in Railway database

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id integer NOT NULL PRIMARY KEY,
    loan_id integer NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    payment_amount numeric(14,2) NOT NULL,
    payment_method character varying(64),
    payment_date timestamp with time zone DEFAULT now(),
    processed_by_user_id integer,
    processed_by_username character varying(128),
    note text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create shift_management table
CREATE TABLE IF NOT EXISTS public.shift_management (
    id integer NOT NULL PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(id),
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    opening_cash numeric(10,2),
    closing_cash numeric(10,2),
    cash_difference numeric(10,2),
    notes character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create redeem_history table (alias for redemption_history if needed)
CREATE TABLE IF NOT EXISTS public.redeem_history (
    id integer NOT NULL PRIMARY KEY,
    loan_id integer NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    redeemed_amount numeric(14,2),
    redeemed_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    redeemed_by_user_id integer,
    redeemed_by_username character varying(128),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON public.payments USING btree (loan_id);
CREATE INDEX IF NOT EXISTS idx_shift_management_user_id ON public.shift_management USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_redeem_history_loan_id ON public.redeem_history USING btree (loan_id);
