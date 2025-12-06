--
-- PostgreSQL database dump
--

\restrict zjgg0xy924BOdTf7v2IwxuCjVwkdZwYWOT0Kf52tkPDGfEFuVrs3ihbUkp2rFzJ

-- Dumped from database version 18.0
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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: forfeiture_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forfeiture_history (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    forfeited_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    notes character varying(500)
);


--
-- Name: forfeiture_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forfeiture_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forfeiture_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forfeiture_history_id_seq OWNED BY public.forfeiture_history.id;


--
-- Name: loans; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: COLUMN loans.first_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.first_name IS 'Customer first name (migrated from customer_name or entered directly)';


--
-- Name: COLUMN loans.last_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.last_name IS 'Customer last name (migrated from customer_name or entered directly)';


--
-- Name: COLUMN loans.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.email IS 'Customer email address';


--
-- Name: COLUMN loans.home_phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.home_phone IS 'Customer home phone number';


--
-- Name: COLUMN loans.mobile_phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.mobile_phone IS 'Customer mobile phone number';


--
-- Name: COLUMN loans.birthdate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.birthdate IS 'Customer date of birth';


--
-- Name: COLUMN loans.referral; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.referral IS 'How customer was referred';


--
-- Name: COLUMN loans.identification_info; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.identification_info IS 'Customer identification details';


--
-- Name: COLUMN loans.street_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.street_address IS 'Customer street address';


--
-- Name: COLUMN loans.city; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.city IS 'Customer city';


--
-- Name: COLUMN loans.state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.state IS 'Customer state/province';


--
-- Name: COLUMN loans.zipcode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.loans.zipcode IS 'Customer postal/zip code';


--
-- Name: loans_backup; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: loans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loans_id_seq OWNED BY public.loans.id;


--
-- Name: payment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_history (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_amount numeric NOT NULL,
    payment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


--
-- Name: payment_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_history_id_seq OWNED BY public.payment_history.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: redeem_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redeem_history (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    redeemed_by integer NOT NULL,
    redeemed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: redeem_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.redeem_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: redeem_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.redeem_history_id_seq OWNED BY public.redeem_history.id;


--
-- Name: redemption_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.redemption_history (
    id integer NOT NULL,
    loan_id integer NOT NULL,
    redeemed_amount numeric(10,2),
    redeemed_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    notes character varying(500)
);


--
-- Name: redemption_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.redemption_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: redemption_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.redemption_history_id_seq OWNED BY public.redemption_history.id;


--
-- Name: shift_management; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: shift_management_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shift_management_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shift_management_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shift_management_id_seq OWNED BY public.shift_management.id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shifts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shifts_id_seq OWNED BY public.shifts.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: forfeiture_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forfeiture_history ALTER COLUMN id SET DEFAULT nextval('public.forfeiture_history_id_seq'::regclass);


--
-- Name: loans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans ALTER COLUMN id SET DEFAULT nextval('public.loans_id_seq'::regclass);


--
-- Name: payment_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history ALTER COLUMN id SET DEFAULT nextval('public.payment_history_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: redeem_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redeem_history ALTER COLUMN id SET DEFAULT nextval('public.redeem_history_id_seq'::regclass);


--
-- Name: redemption_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_history ALTER COLUMN id SET DEFAULT nextval('public.redemption_history_id_seq'::regclass);


--
-- Name: shift_management id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_management ALTER COLUMN id SET DEFAULT nextval('public.shift_management_id_seq'::regclass);


--
-- Name: shifts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts ALTER COLUMN id SET DEFAULT nextval('public.shifts_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: forfeiture_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.forfeiture_history (id, loan_id, forfeited_date, created_by, notes) FROM stdin;
\.


--
-- Data for Name: loans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loans (id, customer_name, customer_number, loan_amount, interest_rate, created_at, created_by, first_name, last_name, email, home_phone, mobile_phone, birthdate, referral, identification_info, address, street_address, city, state, zipcode, interest_amount, total_payable_amount, collateral_description, customer_note, loan_issued_date, loan_term, remaining_balance, created_by_user_id, created_by_username, transaction_number, issued_date, redeemed_date, forfeited_date, is_redeemed, is_forfeited, item_category, item_description, updated_at, due_date, status, id_type, id_number) FROM stdin;
36	Khalil Rehman	\N	100	5	2025-11-21 12:05:45.864783	\N	Khalil	Rehman	k@example.com	8868768776	0809899787	2000-02-22	friend	none	\N	po box 42	Fort Worth	texas	77604	5.00	105.00	bottle	none	2025-11-21	29	105.00	\N	\N	794153372	\N	\N	\N	f	f	\N	\N	\N	2025-12-20	active	\N	\N
38	Lubnah Riaz	\N	100	5	2025-11-22 12:15:38.695177	\N	Lubnah	Riaz	lubnah@example.com	8461378437846	13487239487293	1999-11-11	none	none	\N	po box 12	fort worth	texas	77886	5.00	105.00	clothes	none	2025-11-22	30	105.00	\N	\N	456679478	\N	\N	\N	f	f	\N	\N	\N	2025-12-22	active	\N	\N
39	Test User	\N	100	5	2025-11-24 02:39:00.886022	\N	Test	User	test@example.com	876776576575	686867857657	1999-11-11	none	none	\N	po box 32	fort worth	texas	77665	5.00	105.00	rooh afza	none	2025-11-24	30	105.00	\N	\N	452695402	\N	\N	\N	f	f	\N	\N	\N	2025-12-24	active	passport	8768778
25	loner	5621526155	100200	5	2025-11-19 09:39:45.735269	\N	loner		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
26	Dazzle	4545677577	100200	5	2025-11-19 09:52:35.862725	\N	Dazzle		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
27	keeper	45651636	100200	5	2025-11-19 10:04:25.549787	\N	keeper		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
2	Urooj	03121162014	8000	3	2025-11-16 05:59:43.713377	\N	Urooj		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
1	A	000000000	100	2	2025-11-16 05:08:07.320695	\N	A		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
3	Hamza	099887766	1000	10	2025-11-16 06:52:26.639283	\N	Hamza		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
4	Waqas	225566555362	3000	15	2025-11-16 07:40:51.02392	\N	Waqas		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
5	wahab	1244332211	30000	15	2025-11-16 07:42:49.376733	\N	wahab		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
6	Ateeque	73727362732	7000	15	2025-11-16 07:49:30.949619	\N	Ateeque		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
28	Stella	5645668888	300	5	2025-11-19 11:15:52.245068	\N	Stella		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
8	Wali	66776655443	100	3	2025-11-16 09:32:20.590176	\N	Wali		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
9	wwww	67676766	100	2	2025-11-16 10:00:14.327039	\N	wwww		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
11	Alex	87878675656	500	10	2025-11-16 10:41:23.689201	\N	Alex		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
12	Jose	445552233	500	15	2025-11-16 10:49:42.428154	\N	Jose		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
13	Isabelle	557766699	6000	15	2025-11-16 10:56:47.022317	\N	Isabelle		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
7	Tabish	5556664442	9000	9	2025-11-16 08:02:39.395088	\N	Tabish		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
10	Alex	87878675656	1000	10	2025-11-16 10:35:47.388328	\N	Alex		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
14	johny	989898989	100	5	2025-11-17 10:36:54.35848	\N	johny		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
15	tj	886775656	100200	5	2025-11-17 11:11:44.252129	\N	tj		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
16	Girl	65261256152	100185	5	2025-11-17 11:16:11.05515	\N	Girl		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
17	allura	89887878	100	5	2025-11-17 11:30:45.848605	\N	allura		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
21	Linda	565656556	300	5	2025-11-18 11:20:17.70487	\N	Linda		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
22	saad	9988778877	100	5	2025-11-18 11:37:13.040178	\N	saad		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
29	Bloom	765796756	300	5	2025-11-19 11:27:45.15216	\N	Bloom		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
23	Invoker	8392738273	100200300	5	2025-11-19 08:49:59.187472	\N	Invoker		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
24	Beetle	8781271	100200	5	2025-11-19 09:36:51.144194	\N	Beetle		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
30	Walter	746836382	300	5	2025-11-19 12:16:06.217958	\N	Walter		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
31	Humaira	6464664647	100	3	2025-11-19 12:59:27.782036	\N	Humaira		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
32	Akbar	7653761374	300	5	2025-11-19 23:26:30.772192	\N	Akbar		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
33	Ariana	767575767	100	5	2025-11-20 09:41:23.946301	\N	Ariana		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
34	Aslam	757657675756	300	5	2025-11-21 01:59:44.156004	\N	Aslam		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active	\N	\N
\.


--
-- Data for Name: loans_backup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loans_backup (id, customer_name, customer_number, loan_amount, interest_rate, created_at, created_by, first_name, last_name, email, home_phone, mobile_phone, birthdate, referral, identification_info, address, street_address, city, state, zipcode, interest_amount, total_payable_amount, collateral_description, customer_note, loan_issued_date, loan_term, remaining_balance, created_by_user_id, created_by_username, transaction_number, issued_date, redeemed_date, forfeited_date, is_redeemed, is_forfeited, item_category, item_description, updated_at, due_date, status) FROM stdin;
25	loner	5621526155	100200	5	2025-11-19 09:39:45.735269	\N	loner		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
26	Dazzle	4545677577	100200	5	2025-11-19 09:52:35.862725	\N	Dazzle		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
27	keeper	45651636	100200	5	2025-11-19 10:04:25.549787	\N	keeper		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
2	Urooj	03121162014	8000	3	2025-11-16 05:59:43.713377	\N	Urooj		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
1	A	000000000	100	2	2025-11-16 05:08:07.320695	\N	A		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
3	Hamza	099887766	1000	10	2025-11-16 06:52:26.639283	\N	Hamza		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
4	Waqas	225566555362	3000	15	2025-11-16 07:40:51.02392	\N	Waqas		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
5	wahab	1244332211	30000	15	2025-11-16 07:42:49.376733	\N	wahab		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
6	Ateeque	73727362732	7000	15	2025-11-16 07:49:30.949619	\N	Ateeque		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
28	Stella	5645668888	300	5	2025-11-19 11:15:52.245068	\N	Stella		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
8	Wali	66776655443	100	3	2025-11-16 09:32:20.590176	\N	Wali		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
9	wwww	67676766	100	2	2025-11-16 10:00:14.327039	\N	wwww		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
11	Alex	87878675656	500	10	2025-11-16 10:41:23.689201	\N	Alex		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
12	Jose	445552233	500	15	2025-11-16 10:49:42.428154	\N	Jose		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
13	Isabelle	557766699	6000	15	2025-11-16 10:56:47.022317	\N	Isabelle		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
7	Tabish	5556664442	9000	9	2025-11-16 08:02:39.395088	\N	Tabish		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
10	Alex	87878675656	1000	10	2025-11-16 10:35:47.388328	\N	Alex		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
14	johny	989898989	100	5	2025-11-17 10:36:54.35848	\N	johny		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
15	tj	886775656	100200	5	2025-11-17 11:11:44.252129	\N	tj		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
16	Girl	65261256152	100185	5	2025-11-17 11:16:11.05515	\N	Girl		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
17	allura	89887878	100	5	2025-11-17 11:30:45.848605	\N	allura		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
21	Linda	565656556	300	5	2025-11-18 11:20:17.70487	\N	Linda		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
22	saad	9988778877	100	5	2025-11-18 11:37:13.040178	\N	saad		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
29	Bloom	765796756	300	5	2025-11-19 11:27:45.15216	\N	Bloom		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
23	Invoker	8392738273	100200300	5	2025-11-19 08:49:59.187472	\N	Invoker		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
24	Beetle	8781271	100200	5	2025-11-19 09:36:51.144194	\N	Beetle		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
30	Walter	746836382	300	5	2025-11-19 12:16:06.217958	\N	Walter		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
31	Humaira	6464664647	100	3	2025-11-19 12:59:27.782036	\N	Humaira		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
32	Akbar	7653761374	300	5	2025-11-19 23:26:30.772192	\N	Akbar		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
33	Ariana	767575767	100	5	2025-11-20 09:41:23.946301	\N	Ariana		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
34	Aslam	757657675756	300	5	2025-11-21 01:59:44.156004	\N	Aslam		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	active
\.


--
-- Data for Name: payment_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_history (id, loan_id, payment_method, payment_amount, payment_date, created_by) FROM stdin;
1	1	cash	52	2025-11-16 05:18:08.363795	\N
2	1	cash	50	2025-11-16 05:27:25.906997	\N
3	2	cash	8240	2025-11-16 06:00:41.164179	\N
4	2	cash	8240.0000000000000000	2025-11-16 06:19:25.154713	\N
5	3	cash	1100	2025-11-16 06:52:53.070866	\N
6	3	cash	1100	2025-11-16 07:05:11.505361	\N
7	7	cash	9810	2025-11-16 08:04:22.660993	\N
8	8	cash	103	2025-11-16 09:32:51.422667	\N
9	9	cash	102	2025-11-16 10:00:41.79086	\N
10	10	cash	600	2025-11-16 10:37:20.612411	\N
11	12	cash	374	2025-11-16 10:50:42.546499	\N
12	13	cash	6900	2025-11-16 10:57:20.226028	\N
13	10	cash	500	2025-11-17 09:43:20.798265	\N
17	22	cash	55	2025-11-18 11:46:01.035275	\N
18	28	cash	65	2025-11-19 11:16:47.503884	\N
19	29	cash	65	2025-11-19 11:28:26.232886	\N
20	30	cash	65	2025-11-19 12:18:16.040394	\N
21	32	cash	65	2025-11-19 23:27:26.468065	\N
22	34	cash	65	2025-11-21 02:02:05.251569	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, loan_id, payment_amount, payment_method, payment_date, processed_by_user_id, processed_by_username, note, created_at) FROM stdin;
\.


--
-- Data for Name: redeem_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.redeem_history (id, loan_id, redeemed_by, redeemed_at) FROM stdin;
1	1	1	2025-11-16 06:51:49.849826
2	3	1	2025-11-16 07:05:24.271614
3	7	1	2025-11-17 08:58:58.139961
\.


--
-- Data for Name: redemption_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.redemption_history (id, loan_id, redeemed_amount, redeemed_date, created_by, notes) FROM stdin;
\.


--
-- Data for Name: shift_management; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shift_management (id, user_id, shift_start_time, shift_end_time, opening_balance, closing_balance, total_payments_received, total_loans_given, expected_balance, difference, is_balanced, notes, created_at) FROM stdin;
4	1	2025-11-19 12:36:06.642969	2025-11-19 12:36:29.260795	1000.00	998.00	0.00	0.00	1000.00	-2.00	f	\N	2025-11-19 12:36:06.642969
5	1	2025-11-21 02:11:56.592234	\N	1000.00	\N	0.00	0.00	\N	\N	f	\N	2025-11-21 02:11:56.592234
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shifts (id, user_id, start_time, end_time, opening_cash, closing_cash, cash_difference, notes, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, role_name) FROM stdin;
1	admin
2	manager
3	clerk
4	user
6	staff
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, role_id, created_at) FROM stdin;
1	Qasim	$2b$10$pSTbpia/XhfOcobg1QiDjeqOONLU/jBO5kQlqOiy0gdES3Q/KH1DG	1	2025-11-16 04:34:19.799627
2	sakina	$2b$10$Rq7HkdQ2TzeAYzHMAsW7ZulmW3u8EfiIuFWrhlTEDYL0AWIAxHgvi	1	2025-11-16 04:36:34.501602
3	alesterhook@gmail.com	$2b$10$O9znPqF4v8sFzzvVa6DYSuCpb6A4KMo8/vMi5PS0xa0ReVN15gmAK	4	2025-11-16 04:37:10.636968
\.


--
-- Name: forfeiture_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.forfeiture_history_id_seq', 1, false);


--
-- Name: loans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loans_id_seq', 39, true);


--
-- Name: payment_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_history_id_seq', 22, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: redeem_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.redeem_history_id_seq', 3, true);


--
-- Name: redemption_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.redemption_history_id_seq', 1, false);


--
-- Name: shift_management_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shift_management_id_seq', 5, true);


--
-- Name: shifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shifts_id_seq', 1, false);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: forfeiture_history forfeiture_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forfeiture_history
    ADD CONSTRAINT forfeiture_history_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: loans loans_transaction_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_transaction_number_key UNIQUE (transaction_number);


--
-- Name: payment_history payment_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: redeem_history redeem_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redeem_history
    ADD CONSTRAINT redeem_history_pkey PRIMARY KEY (id);


--
-- Name: redemption_history redemption_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_history
    ADD CONSTRAINT redemption_history_pkey PRIMARY KEY (id);


--
-- Name: shift_management shift_management_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_management
    ADD CONSTRAINT shift_management_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_name_key UNIQUE (role_name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_loans_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_created_by ON public.loans USING btree (created_by);


--
-- Name: idx_loans_customer_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_customer_name ON public.loans USING btree (customer_name);


--
-- Name: idx_loans_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_email ON public.loans USING btree (email);


--
-- Name: idx_loans_first_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_first_name ON public.loans USING btree (first_name);


--
-- Name: idx_loans_last_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_last_name ON public.loans USING btree (last_name);


--
-- Name: idx_loans_mobile_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_mobile_phone ON public.loans USING btree (mobile_phone);


--
-- Name: idx_loans_transaction_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_loans_transaction_number ON public.loans USING btree (transaction_number);


--
-- Name: idx_payment_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_created_by ON public.payment_history USING btree (created_by);


--
-- Name: idx_payment_history_loan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_history_loan_id ON public.payment_history USING btree (loan_id);


--
-- Name: idx_shift_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shift_active ON public.shift_management USING btree (user_id, shift_end_time);


--
-- Name: idx_shift_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shift_date ON public.shift_management USING btree (shift_start_time);


--
-- Name: idx_shift_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shift_user_id ON public.shift_management USING btree (user_id);


--
-- Name: idx_shifts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shifts_user_id ON public.shifts USING btree (user_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: forfeiture_history forfeiture_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forfeiture_history
    ADD CONSTRAINT forfeiture_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: forfeiture_history forfeiture_history_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forfeiture_history
    ADD CONSTRAINT forfeiture_history_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: loans loans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_history payment_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_history payment_history_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_history
    ADD CONSTRAINT payment_history_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: payments payments_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: redeem_history redeem_history_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redeem_history
    ADD CONSTRAINT redeem_history_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: redemption_history redemption_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_history
    ADD CONSTRAINT redemption_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: redemption_history redemption_history_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.redemption_history
    ADD CONSTRAINT redemption_history_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: shift_management shift_management_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_management
    ADD CONSTRAINT shift_management_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shifts shifts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict zjgg0xy924BOdTf7v2IwxuCjVwkdZwYWOT0Kf52tkPDGfEFuVrs3ihbUkp2rFzJ

