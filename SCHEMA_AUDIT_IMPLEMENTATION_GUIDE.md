# Database Schema Audit - Implementation Guide

**Audit Date:** January 7, 2026  
**Status:** Comprehensive audit completed with migration files ready

---

## Overview

This guide documents the results of a comprehensive database schema audit that identified **15 missing columns** across **4 critical tables** and **1 missing table** in the PawnFlow backend application.

---

## Detailed Findings

### ✅ Tables With Complete Schema (9 tables)
- user_roles
- users
- admin_settings
- audit_log
- forfeiture_history
- redeem_history
- redemption_history
- shift_management
- shifts

### ⚠️ Tables With Missing Columns (4 tables)

#### 1. LOANS Table - 8 Missing Columns

**Business Context:**
The loans table is the core transaction table. It tracks individual loan records with all customer and financial information. Missing columns prevent proper tracking of:
- Redemption fees charged when loans are paid off
- Who reactivated forfeited/redeemed loans
- Who extended loan terms
- Audit trail of who updated loan details

**Missing Columns:**

1. **redemption_fee** (NUMERIC 10,2)
   - **Purpose:** Stores the fee charged when a customer redeems/pays off a loan
   - **Data Type:** NUMERIC(10,2) - handles currency with 2 decimal places
   - **Default:** 0
   - **Usage Location:** [server.js line 2940](../server.js#L2940)

2. **reactivated_by_user_id** (INTEGER)
   - **Purpose:** Tracks which user reactivated a forfeited or redeemed loan
   - **Data Type:** INTEGER - references users.id
   - **Foreign Key:** users(id) ON DELETE SET NULL
   - **Usage Location:** [server.js lines 1611, 3080](../server.js#L1611)

3. **reactivated_by_username** (VARCHAR 100)
   - **Purpose:** Denormalizes username for audit trail readability
   - **Data Type:** VARCHAR(100)
   - **Usage Location:** [server.js lines 1612, 3081](../server.js#L1612)

4. **extended_by_user_id** (INTEGER)
   - **Purpose:** Tracks which user extended the loan term
   - **Data Type:** INTEGER - references users.id
   - **Foreign Key:** users(id) ON DELETE SET NULL
   - **Usage Location:** [server.js line 3190](../server.js#L3190)

5. **extended_by_username** (VARCHAR 100)
   - **Purpose:** Denormalizes username for audit trail readability
   - **Data Type:** VARCHAR(100)
   - **Usage Location:** [server.js line 3191](../server.js#L3191)

6. **extended_at** (TIMESTAMP)
   - **Purpose:** Tracks when the loan was last extended
   - **Data Type:** TIMESTAMP
   - **Usage Location:** [server.js line 3189](../server.js#L3189)

7. **updated_by_user_id** (INTEGER)
   - **Purpose:** Tracks which user last updated loan details (customer info, amounts, etc.)
   - **Data Type:** INTEGER - references users.id
   - **Foreign Key:** users(id) ON DELETE SET NULL
   - **Usage Location:** [server.js lines 1890, 1912](../server.js#L1890)

8. **updated_by_username** (VARCHAR 100)
   - **Purpose:** Denormalizes username for audit trail readability
   - **Data Type:** VARCHAR(100)
   - **Usage Location:** [server.js lines 1891, 1913](../server.js#L1891)

**Additional Columns (supporting discount feature):**
- **last_discounted_at** (TIMESTAMP) - When discount was last applied
- **last_discounted_by** (VARCHAR 100) - Username of who applied discount

---

#### 2. PAYMENT_HISTORY Table - 6 Missing Columns

**Business Context:**
The payment_history table records each payment made against a loan. Missing columns prevent:
- Tracking what type of payment was made
- Recording payment status (success/failure/pending)
- Linking payments to external systems/receipts
- Storing additional payment details and notes

**Missing Columns:**

1. **payment_type** (VARCHAR 50)
   - **Purpose:** Categorize payment type (e.g., 'regular', 'final', 'partial', 'full_redemption')
   - **Data Type:** VARCHAR(50)
   - **Referenced in:** [Migration 015](../migrations/015_add_missing_payment_history_columns.sql)

2. **payment_status** (VARCHAR 50)
   - **Purpose:** Track payment status (e.g., 'pending', 'processed', 'failed', 'refunded')
   - **Data Type:** VARCHAR(50)
   - **Referenced in:** [Migration 015](../migrations/015_add_missing_payment_history_columns.sql)

3. **reference_number** (VARCHAR 100)
   - **Purpose:** Store receipt/reference number for traceability
   - **Data Type:** VARCHAR(100)
   - **Referenced in:** [Migration 015](../migrations/015_add_missing_payment_history_columns.sql)

4. **notes** (TEXT)
   - **Purpose:** Store additional payment notes/comments
   - **Data Type:** TEXT
   - **Referenced in:** [Migration 015](../migrations/015_add_missing_payment_history_columns.sql)

5. **processor** (VARCHAR 100)
   - **Purpose:** Track which payment gateway processed the payment (e.g., 'stripe', 'paypal', 'cash', 'check')
   - **Data Type:** VARCHAR(100)
   - **Referenced in:** [Migration 015](../migrations/015_add_missing_payment_history_columns.sql)

6. **updated_at** (TIMESTAMP)
   - **Purpose:** Track when payment record was last updated
   - **Data Type:** TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - **Referenced in:** [Migration 015](../migrations/015_add_missing_payment_history_columns.sql)

---

#### 3. CUSTOMERS Table - 1 Missing Column

**Business Context:**
The customers table stores customer profile information. Missing column prevents:
- Storing customer profile images/photos
- Displaying customer photos in the interface

**Missing Columns:**

1. **profile_image** (TEXT)
   - **Purpose:** Store customer profile image (as base64 data or URL)
   - **Data Type:** TEXT
   - **Usage Location:** [server.js line 2476](../server.js#L2476)

---

### ❌ Missing Table (1 table)

#### DISCOUNT_LOGS Table

**Business Context:**
This table tracks all interest discounts applied to loans for audit and business analytics purposes. It's referenced in the discount feature but not defined in db-init.js.

**Table Structure:**

```sql
CREATE TABLE discount_logs (
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
```

**Purpose:** Tracks all interest discounts applied to loans
- **loan_id:** Which loan received the discount
- **customer_id:** Which customer's loan was discounted
- **discount_amount:** How much discount was applied
- **applied_by_user_id/username:** Which user applied the discount
- **previous/new amounts:** Before and after discount amounts for audit trail

**Referenced in:** [pawn-flow-frontend/server.js line 2502](../../pawn-flow-frontend/server.js#L2502)

---

## Implementation Steps

### Step 1: Review the Audit Report
- Read [DATABASE_SCHEMA_AUDIT_REPORT.md](../DATABASE_SCHEMA_AUDIT_REPORT.md)
- Understand which columns are missing and why

### Step 2: Apply the Migration
```sql
-- In your database management tool or via script:
psql $DATABASE_URL < migrations/016_add_missing_columns_comprehensive.sql

-- OR if using Railway:
railway run psql $DATABASE_URL < migrations/016_add_missing_columns_comprehensive.sql
```

### Step 3: Verify the Migration
```sql
-- Check LOANS table
\d loans

-- Check PAYMENT_HISTORY table
\d payment_history

-- Check CUSTOMERS table
\d customers

-- Check DISCOUNT_LOGS table
\d discount_logs
```

### Step 4: Test Application Features
After migration, test these features to ensure they work:

1. **Loan Extension**
   - Navigate to a loan record
   - Extend the due date
   - Verify `extended_by_user_id`, `extended_by_username`, `extended_at` are populated

2. **Loan Reactivation**
   - Create a forfeited loan
   - Reactivate it
   - Verify `reactivated_by_user_id`, `reactivated_by_username` are populated

3. **Payment Recording**
   - Record a payment against a loan
   - Verify new payment_history columns are populated with appropriate values

4. **Customer Profile**
   - Update a customer profile with an image
   - Verify `profile_image` column is populated

5. **Discount Application**
   - Apply an interest discount to a loan
   - Verify `discount_logs` table record is created
   - Verify `last_discounted_at`, `last_discounted_by` in loans are updated

### Step 5: Monitor for Errors
After deployment, monitor application logs for:
- Database connection errors
- Foreign key constraint violations
- Any SQL errors related to missing columns

---

## Column Data Types Reference

### NUMERIC Types Used
- `NUMERIC(10,2)` - For currency values (supports up to 10 digits total, 2 after decimal)
  - Examples: 99999999.99, 0.01, 1234.50
  - Used for: amounts, fees, balances

### VARCHAR Types Used
- `VARCHAR(50)` - For short text fields (status, types, methods)
- `VARCHAR(100)` - For usernames, categories, processor names
- `VARCHAR(100)` or `VARCHAR(255)` - For longer text like descriptions

### Other Types Used
- `INTEGER` - For foreign keys to user IDs
- `TIMESTAMP` - For audit trail dates/times
- `TEXT` - For long text content (notes, descriptions, images)

---

## Impact on Application Code

### Loans API Endpoints
The following endpoints will benefit from these columns:
- `POST /create-loan` - Now can set redemption_fee
- `PUT /update-customer-info` - Now tracks updated_by info
- `PUT /extend-loan` - Now has extended_by and extended_at tracking
- `PUT /reactivate-loan` - Now has reactivated_by tracking

### Payment Recording
- Payment recording now captures payment_type, payment_status, reference_number, processor
- Payment records are now updateable via updated_at timestamp

### Customer Management
- Customer profiles can now store images via profile_image column

### Discount Tracking
- All discount applications are now logged in discount_logs table
- Loans table now tracks when last discount was applied

---

## Rollback Instructions (if needed)

If you need to rollback this migration, the following columns can be removed:

```sql
ALTER TABLE loans 
DROP COLUMN IF EXISTS redemption_fee,
DROP COLUMN IF EXISTS reactivated_by_user_id,
DROP COLUMN IF EXISTS reactivated_by_username,
DROP COLUMN IF EXISTS extended_by_user_id,
DROP COLUMN IF EXISTS extended_by_username,
DROP COLUMN IF EXISTS extended_at,
DROP COLUMN IF EXISTS updated_by_user_id,
DROP COLUMN IF EXISTS updated_by_username,
DROP COLUMN IF EXISTS last_discounted_at,
DROP COLUMN IF EXISTS last_discounted_by;

ALTER TABLE payment_history
DROP COLUMN IF EXISTS payment_type,
DROP COLUMN IF EXISTS payment_status,
DROP COLUMN IF EXISTS reference_number,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS processor,
DROP COLUMN IF EXISTS updated_at;

ALTER TABLE customers
DROP COLUMN IF EXISTS profile_image;

DROP TABLE IF EXISTS discount_logs;
```

---

## Testing Checklist

- [ ] Migration applied successfully with no errors
- [ ] All new columns visible in database with correct data types
- [ ] All new indexes created successfully
- [ ] discount_logs table created with all columns and indexes
- [ ] Loan extension feature works (extended_by fields populated)
- [ ] Loan reactivation feature works (reactivated_by fields populated)
- [ ] Payment recording works with new fields
- [ ] Customer profile image upload/update works
- [ ] Discount application logs to discount_logs table
- [ ] No foreign key constraint errors occur
- [ ] Application startup successful with no schema errors

---

## Related Files

- [DATABASE_SCHEMA_AUDIT_REPORT.md](../DATABASE_SCHEMA_AUDIT_REPORT.md) - Detailed audit findings
- [migrations/016_add_missing_columns_comprehensive.sql](../migrations/016_add_missing_columns_comprehensive.sql) - Migration file
- [migrations/015_add_missing_payment_history_columns.sql](../migrations/015_add_missing_payment_history_columns.sql) - Previous payment_history migration
- [db-init.js](../db-init.js) - Initial schema definitions
- [server.js](../server.js) - Application code using these columns

---

## Questions or Issues?

If you encounter issues:

1. Check database connection settings
2. Verify migration file syntax is correct for your PostgreSQL version
3. Check for existing data that might conflict with constraints
4. Review application logs for specific error messages
5. Ensure all foreign key references exist (especially users.id)

---

**Last Updated:** January 7, 2026
