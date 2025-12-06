--
-- Removed \restrict line to fix Supabase import error
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: forfeiture_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forfeiture_history (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    forfeited_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    notes character varying(500)
);


ALTER TABLE public.forfeiture_history OWNER TO postgres;

--
-- Name: forfeiture_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forfeiture_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forfeiture_history_id_seq OWNER TO postgres;

--
-- Name: forfeiture_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forfeiture_history_id_seq OWNED BY public.forfeiture_history.id;


--
-- Name: loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loans (
    id integer NOT NULL,
    customer_name character varying(100) NOT NULL,
    customer_number character varying(50),
    loan_amount numeric NOT NULL,
    interest_rate numeric NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    first_name character varying(100),
    last_name character varying(100),
    email character varying(255),
    home_phone character varying(20),
    mobile_phone character varying(20),
    birthdate date,
    referral character varying(255),
    identification_info text,
    address text,
    street_address text,
    city character varying(128),
    state character varying(64),
    zipcode character varying(32),
    interest_amount numeric(10,2),
    total_payable_amount numeric(10,2),
    collateral_description text,
    customer_note text,
    loan_issued_date date,
    loan_term integer,
    remaining_balance numeric(10,2),
    created_by_user_id integer,
    created_by_username character varying(100),
    transaction_number character varying(100),
    issued_date date,
    redeemed_date date,
    forfeited_date date,
    is_redeemed boolean DEFAULT false,
    is_forfeited boolean DEFAULT false,
    item_category character varying(100),
    item_description text,
    updated_at timestamp without time zone,
    due_date date,
    status character varying(50) DEFAULT 'active'::character varying,
    id_type character varying(50),
    id_number character varying(100)
);


ALTER TABLE public.loans OWNER TO postgres;

--
-- Name: COLUMN loans.first_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.first_name IS 'Customer first name (migrated from customer_name or entered directly)';


--
-- Name: COLUMN loans.last_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.last_name IS 'Customer last name (migrated from customer_name or entered directly)';


--
-- Name: COLUMN loans.email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.email IS 'Customer email address';


--
-- Name: COLUMN loans.home_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.home_phone IS 'Customer home phone number';


--
-- Name: COLUMN loans.mobile_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.mobile_phone IS 'Customer mobile phone number';


--
-- Name: COLUMN loans.birthdate; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.birthdate IS 'Customer date of birth';


--
-- Name: COLUMN loans.referral; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.referral IS 'How customer was referred';


--
-- Name: COLUMN loans.identification_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.identification_info IS 'Customer identification details';


--
-- Name: COLUMN loans.street_address; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.street_address IS 'Customer street address';


--
-- Name: COLUMN loans.city; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.city IS 'Customer city';


--
-- Name: COLUMN loans.state; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.state IS 'Customer state/province';


--
-- Name: COLUMN loans.zipcode; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.loans.zipcode IS 'Customer postal/zip code';


--
-- Name: loans_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loans_backup (
    id integer,
    customer_name character varying(100),
    customer_number character varying(50),
    loan_amount numeric,
    interest_rate numeric,
    created_at timestamp without time zone,
    created_by integer,
    first_name character varying(100),
    last_name character varying(100),
    email character varying(255),
    home_phone character varying(20),
    mobile_phone character varying(20),
    birthdate date,
    referral character varying(255),
    identification_info text,
    address text,
    street_address text,
    city character varying(128),
    state character varying(64),
    zipcode character varying(32),
    interest_amount numeric(10,2),
    total_payable_amount numeric(10,2),
    collateral_description text,
    customer_note text,
    loan_issued_date date,
    loan_term integer,
    remaining_balance numeric(10,2),
    created_by_user_id integer,
    created_by_username character varying(100),
    transaction_number character varying(100),
    issued_date date,
    redeemed_date date,
    forfeited_date date,
    is_redeemed boolean,
    is_forfeited boolean,
    item_category character varying(100),
    item_description text,
    updated_at timestamp without time zone,
    due_date date,
    status character varying(50)
);


ALTER TABLE public.loans_backup OWNER TO postgres;

--
-- Name: loans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loans_id_seq OWNER TO postgres;

--
-- Name: loans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loans_id_seq OWNED BY public.loans.id;


--
-- Name: payment_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_history (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_amount numeric NOT NULL,
    payment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.payment_history OWNER TO postgres;

--
-- Name: payment_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_history_id_seq OWNER TO postgres;

--
-- Name: payment_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_history_id_seq OWNED BY public.payment_history.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    payment_amount numeric(14,2) NOT NULL,
    payment_method character varying(64),
    payment_date timestamp with time zone DEFAULT now(),
    processed_by_user_id integer,
    processed_by_username character varying(128),
    note text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: redeem_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.redeem_history (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    redeemed_by integer NOT NULL,
    redeemed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.redeem_history OWNER TO postgres;

--
-- Name: redeem_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.redeem_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.redeem_history_id_seq OWNER TO postgres;

--
-- Name: redeem_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.redeem_history_id_seq OWNED BY public.redeem_history.id;


--
-- Name: redemption_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.redemption_history (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    redeemed_amount numeric(10,2),
    redeemed_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    notes character varying(500)
);


ALTER TABLE public.redemption_history OWNER TO postgres;

--
-- Name: redemption_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.redemption_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.redemption_history_id_seq OWNER TO postgres;

--
-- Name: redemption_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.redemption_history_id_seq OWNED BY public.redemption_history.id;


--
-- Name: shift_management; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_management (
    id integer NOT NULL,
    user_id integer NOT NULL,
    shift_start_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    shift_end_time timestamp without time zone,
    opening_balance numeric(12,2) NOT NULL,
    closing_balance numeric(12,2),
    total_payments_received numeric(12,2) DEFAULT 0,
    total_loans_given numeric(12,2) DEFAULT 0,
    expected_balance numeric(12,2),
    difference numeric(12,2),
    is_balanced boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shift_management OWNER TO postgres;

--
-- Name: shift_management_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shift_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_management_id_seq OWNER TO postgres;

--
-- Name: shift_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_management_id_seq OWNED BY public.shift_management.id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    opening_cash numeric(10,2),
    closing_cash numeric(10,2),
    cash_difference numeric(10,2),
    notes character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shifts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shifts_id_seq OWNER TO postgres;

--
-- Name: shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_id_seq OWNED BY public.shifts.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: forfeiture_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forfeiture_history ALTER COLUMN id SET DEFAULT nextval('public.forfeiture_history_id_seq'::regclass);


--
-- Name: loans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans ALTER COLUMN id SET DEFAULT nextval('public.loans_id_seq'::regclass);


--
-- Name: payment_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_history ALTER COLUMN id SET DEFAULT nextval('public.payment_history_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: redeem_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.redeem_history ALTER COLUMN id SET DEFAULT nextval('public.redeem_history_id_seq'::regclass);


--
-- Name: redemption_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.redemption_history ALTER COLUMN id SET DEFAULT nextval('public.redemption_history_id_seq'::regclass);


--
-- Name: shift_management id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_management ALTER COLUMN id SET DEFAULT nextval('public.shift_management_id_seq'::regclass);


--
-- Name: shifts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN id SET DEFAULT nextval('public.shifts_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: forfeiture_history forfeiture_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forfeiture_history
    ADD CONSTRAINT forfeiture_history_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: loans loans_transaction_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_transaction_number_key UNIQUE (transaction_number);


--
-- Name: payment_history payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: redeem_history redeem_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.redeem_history
    ADD CONSTRAINT redeem_history_pkey PRIMARY KEY (id);


--
-- Name: redemption_history redemption_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.redemption_history
    ADD CONSTRAINT redemption_history_pkey PRIMARY KEY (id);


--
-- Name: shift_management shift_management_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_management
    ADD CONSTRAINT shift_management_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_name_key UNIQUE (role_name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_loans_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loans_created_by ON public.loans USING btree (created_by);


--
-- Name: idx_loans_customer_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loans_customer_name ON public.loans USING btree (customer_name);


--
-- Name: idx_loans_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loans_email ON public.loans USING btree (email);


--
-- Name: idx_loans_first_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loans_first_name ON public.loans USING btree (first_name);


--
-- Name: idx_loans_last_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loans_last_name ON public.loans USING btree (last_name);


--
-- Name: idx_loans_mobile_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loans_mobile_phone ON public.loans USING btree (mobile_phone);


--
-- Name: idx_loans_transaction_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_loans_transaction_number ON public.loans USING btree (transaction_number);


--
-- Name: idx_payment_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_created_by ON public.payment_history USING btree (created_by);


--
-- Name: idx_payment_history_loan_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_history_loan_id ON public.payment_history USING btree (loan_id);


--
-- Name: idx_shift_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shift_active ON public.shift_management USING btree (user_id, shift_end_time);


--
-- Name: idx_shift_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shift_date ON public.shift_management USING btree (shift_start_time);


--
-- Name: idx_shift_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shift_user_id ON public.shift_management USING btree (user_id);


--
-- Name: idx_shifts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shifts_user_id ON public.shifts USING btree (user_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: forfeiture_history forfeiture_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forfeiture_history
    ADD CONSTRAINT forfeiture_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: forfeiture_history forfeiture_history_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forfeiture_history
    ADD CONSTRAINT forfeiture_history_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: loans loans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_history payment_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_history payment_history_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: payments payments_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: redeem_history redeem_history_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.redeem_history
    ADD CONSTRAINT redeem_history_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: redemption_history redemption_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.redemption_history
    ADD CONSTRAINT redemption_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: redemption_history redemption_history_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.redemption_history
    ADD CONSTRAINT redemption_history_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: shift_management shift_management_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_management
    ADD CONSTRAINT shift_management_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shifts shifts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Removed \unrestrict line to fix Supabase import error

