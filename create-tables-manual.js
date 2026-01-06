#!/usr/bin/env node

/**
 * Manual table creation script for Railway
 * This creates all missing tables and inserts user data
 * Run with: node create-tables-manual.js
 */

const { Pool } = require('pg');
require('dotenv').config();

async function createTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected!');

    // 1. Create user_roles table
    console.log('\n📝 Creating user_roles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_roles (
        id integer NOT NULL PRIMARY KEY,
        role_name character varying(50) NOT NULL UNIQUE
      );
    `);
    console.log('✅ user_roles created');

    // 2. Insert roles
    console.log('📝 Inserting roles...');
    await client.query(`
      INSERT INTO public.user_roles (id, role_name) VALUES
      (1, 'admin'),
      (2, 'manager'),
      (3, 'clerk'),
      (4, 'user'),
      (6, 'staff')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Roles inserted');

    // 3. Create users table
    console.log('\n📝 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id integer NOT NULL PRIMARY KEY,
        username character varying(100) NOT NULL,
        password character varying(255) NOT NULL,
        role_id integer NOT NULL REFERENCES public.user_roles(id),
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ users created');

    // 4. Insert users
    console.log('📝 Inserting users...');
    await client.query(`
      INSERT INTO public.users (id, username, password, role_id, created_at) VALUES
      (1, 'Qasim', '$2b$10$pSTbpia/XhfOcobg1QiDjeqOONLU/jBO5kQlqOiy0gdES3Q/KH1DG', 1, '2025-11-16 04:34:19.799627'),
      (2, 'sakina', '$2b$10$Rq7HkdQ2TzeAYzHMAsW7ZulmW3u8EfiIuFWrhlTEDYL0AWIAxHgvi', 1, '2025-11-16 04:36:34.501602'),
      (3, 'alesterhook@gmail.com', '$2b$10$O9znPqF4v8sFzzVa6DYSuCpb6A4KMo8/vMi5PS0xa0ReVN15gmAK', 4, '2025-11-16 04:37:10.636968')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Users inserted');

    // 5. Create payments table
    console.log('\n📝 Creating payments table...');
    await client.query(`
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
    `);
    console.log('✅ payments created');

    // 6. Create shifts table
    console.log('📝 Creating shifts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.shifts (
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
    `);
    console.log('✅ shifts created');

    // 7. Create shift_management table
    console.log('📝 Creating shift_management table...');
    await client.query(`
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
    `);
    console.log('✅ shift_management created');

    // 8. Create redeem_history table
    console.log('📝 Creating redeem_history table...');
    await client.query(`
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
    `);
    console.log('✅ redeem_history created');

    // 9. Create indexes
    console.log('\n📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON public.payments USING btree (loan_id);
      CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON public.shifts USING btree (user_id);
      CREATE INDEX IF NOT EXISTS idx_shift_management_user_id ON public.shift_management USING btree (user_id);
      CREATE INDEX IF NOT EXISTS idx_redeem_history_loan_id ON public.redeem_history USING btree (loan_id);
    `);
    console.log('✅ Indexes created');

    console.log('\n✨ All tables created successfully!');
    console.log('\n🎯 You can now log in with:');
    console.log('   Username: Qasim');
    console.log('   Username: sakina');

    client.release();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();
