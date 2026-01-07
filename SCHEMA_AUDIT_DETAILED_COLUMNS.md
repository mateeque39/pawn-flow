# Database Schema Audit - Detailed Column Analysis

**Audit Date:** January 7, 2026  
**Auditor:** Automated Database Schema Analyzer  
**Total Tables Analyzed:** 14  
**Tables with Issues:** 4  
**Total Missing Columns:** 15

---

## LOANS Table - Detailed Column Analysis

### ✅ Existing Columns (43 columns)

| Column Name | Data Type | In Code | Status |
|------------|-----------|---------|--------|
| id | SERIAL | Yes | ✅ OK |
| customer_id | INTEGER | Yes | ✅ OK |
| customer_name | VARCHAR(100) | Yes | ✅ OK |
| customer_number | VARCHAR(50) | Yes | ✅ OK |
| loan_amount | NUMERIC | Yes | ✅ OK |
| interest_rate | NUMERIC | Yes | ✅ OK |
| created_at | TIMESTAMP | Yes | ✅ OK |
| created_by | INTEGER | Yes | ✅ OK |
| first_name | VARCHAR(100) | Yes | ✅ OK |
| last_name | VARCHAR(100) | Yes | ✅ OK |
| email | VARCHAR(255) | Yes | ✅ OK |
| home_phone | VARCHAR(20) | Yes | ✅ OK |
| mobile_phone | VARCHAR(20) | Yes | ✅ OK |
| birthdate | DATE | Yes | ✅ OK |
| referral | VARCHAR(255) | Yes | ✅ OK |
| identification_info | TEXT | Yes | ✅ OK |
| address | TEXT | Yes | ✅ OK |
| street_address | TEXT | Yes | ✅ OK |
| city | VARCHAR(128) | Yes | ✅ OK |
| state | VARCHAR(64) | Yes | ✅ OK |
| zipcode | VARCHAR(32) | Yes | ✅ OK |
| interest_amount | NUMERIC(10,2) | Yes | ✅ OK |
| total_payable_amount | NUMERIC(10,2) | Yes | ✅ OK |
| recurring_fee | NUMERIC(10,2) | Yes | ✅ OK |
| collateral_description | TEXT | Yes | ✅ OK |
| collateral_image | TEXT | Yes | ✅ OK |
| customer_note | TEXT | Yes | ✅ OK |
| loan_issued_date | DATE | Yes | ✅ OK |
| loan_term | INTEGER | Yes | ✅ OK |
| remaining_balance | NUMERIC(10,2) | Yes | ✅ OK |
| created_by_user_id | INTEGER | Yes | ✅ OK |
| created_by_username | VARCHAR(100) | Yes | ✅ OK |
| transaction_number | VARCHAR(100) | Yes | ✅ OK |
| issued_date | DATE | Yes | ✅ OK |
| redeemed_date | DATE | Yes | ✅ OK |
| forfeited_date | DATE | Yes | ✅ OK |
| is_redeemed | BOOLEAN | Yes | ✅ OK |
| is_forfeited | BOOLEAN | Yes | ✅ OK |
| item_category | VARCHAR(100) | Yes | ✅ OK |
| item_description | TEXT | Yes | ✅ OK |
| updated_at | TIMESTAMP | Yes | ✅ OK |
| due_date | DATE | Yes | ✅ OK |
| status | VARCHAR(50) | Yes | ✅ OK |
| id_type | VARCHAR(50) | Yes | ✅ OK |
| id_number | VARCHAR(100) | Yes | ✅ OK |

### 🔴 Missing Columns (8 columns)

| Column Name | Data Type | Purpose | Code Location | Impact |
|------------|-----------|---------|---|---------|
| redemption_fee | NUMERIC(10,2) | Fee charged when loan is redeemed/paid off | server.js:2940 | UPDATE loans SET status = $1, redemption_fee = $2 WHERE id = $3 |
| reactivated_by_user_id | INTEGER | User who reactivated a forfeited/redeemed loan | server.js:1611, 3080 | UPDATE loans SET reactivated_by_user_id = $2 WHERE id = $3 |
| reactivated_by_username | VARCHAR(100) | Username of user who reactivated loan | server.js:1612, 3081 | UPDATE loans SET reactivated_by_username = $3 WHERE id = $4 |
| extended_by_user_id | INTEGER | User who extended loan term | server.js:3190 | UPDATE loans SET extended_by_user_id = $2 WHERE id = $4 |
| extended_by_username | VARCHAR(100) | Username of user who extended loan | server.js:3191 | UPDATE loans SET extended_by_username = $3 WHERE id = $4 |
| extended_at | TIMESTAMP | When loan was extended | server.js:3189 | UPDATE loans SET extended_at = CURRENT_TIMESTAMP WHERE id = $4 |
| updated_by_user_id | INTEGER | User who last updated loan details | server.js:1890, 1912 | UPDATE loans SET updated_by_user_id = $14 WHERE transaction_number = $16 |
| updated_by_username | VARCHAR(100) | Username of user who last updated loan | server.js:1891, 1913 | UPDATE loans SET updated_by_username = $15 WHERE transaction_number = $16 |

### Query Error Examples Without These Columns

**Error 1:** Loan Reactivation (server.js:1611)
```javascript
// This will fail with: column "reactivated_by_user_id" does not exist
const updateQuery = `
  UPDATE loans 
  SET status = $1,
      reactivated_by_user_id = $2,
      reactivated_by_username = $3
  WHERE id = $4
  RETURNING *
`;
```

**Error 2:** Loan Extension (server.js:3189)
```javascript
// This will fail with: column "extended_at" does not exist
const updateQuery = `
  UPDATE loans
  SET due_date = $1,
      extended_at = CURRENT_TIMESTAMP,
      extended_by_user_id = $2,
      extended_by_username = $3
  WHERE id = $4
  RETURNING *
`;
```

**Error 3:** Update Customer Info (server.js:1890)
```javascript
// This will fail with: column "updated_by_user_id" does not exist
const updateQuery = `
  UPDATE loans 
  SET first_name = $1,
      ...
      updated_at = $13,
      updated_by_user_id = $14,
      updated_by_username = $15
  WHERE transaction_number = $16
  RETURNING *
`;
```

---

## PAYMENT_HISTORY Table - Detailed Column Analysis

### ✅ Existing Columns (6 columns)

| Column Name | Data Type | In Code | Status |
|------------|-----------|---------|--------|
| id | SERIAL | Yes | ✅ OK |
| loan_id | INTEGER | Yes | ✅ OK |
| payment_method | VARCHAR(50) | Yes | ✅ OK |
| payment_amount | NUMERIC | Yes | ✅ OK |
| payment_date | TIMESTAMP | Yes | ✅ OK |
| created_by | INTEGER | Yes | ✅ OK |

### 🔴 Missing Columns (6 columns)

| Column Name | Data Type | Purpose | Referenced In | Impact |
|------------|-----------|---------|---|---------|
| payment_type | VARCHAR(50) | Type of payment (regular, final, partial) | Migration 015 | Can't categorize payment types |
| payment_status | VARCHAR(50) | Status of payment (pending, processed, failed) | Migration 015 | Can't track payment status |
| reference_number | VARCHAR(100) | Payment reference/receipt number | Migration 015 | Can't link to external systems |
| notes | TEXT | Additional payment notes | Migration 015 | Can't store payment context |
| processor | VARCHAR(100) | Payment gateway (stripe, paypal, cash) | Migration 015 | Can't track payment method source |
| updated_at | TIMESTAMP | When payment record was updated | Migration 015 | Can't audit payment changes |

### Schema Comparison

**Current (from db-init.js):**
```sql
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    payment_method VARCHAR(50) NOT NULL,
    payment_amount NUMERIC NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);
```

**After Migration:**
```sql
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id),
    payment_method VARCHAR(50) NOT NULL,
    payment_amount NUMERIC NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    -- NEW COLUMNS BELOW
    payment_type VARCHAR(50),
    payment_status VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    processor VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## CUSTOMERS Table - Detailed Column Analysis

### ✅ Existing Columns (20 columns)

| Column Name | Data Type | In Code | Status |
|------------|-----------|---------|--------|
| id | SERIAL | Yes | ✅ OK |
| first_name | VARCHAR(100) | Yes | ✅ OK |
| last_name | VARCHAR(100) | Yes | ✅ OK |
| email | VARCHAR(255) | Yes | ✅ OK |
| home_phone | VARCHAR(20) | Yes | ✅ OK |
| mobile_phone | VARCHAR(20) | Yes | ✅ OK |
| birthdate | DATE | Yes | ✅ OK |
| id_type | VARCHAR(50) | Yes | ✅ OK |
| id_number | VARCHAR(100) | Yes | ✅ OK |
| referral | VARCHAR(255) | Yes | ✅ OK |
| identification_info | TEXT | Yes | ✅ OK |
| street_address | TEXT | Yes | ✅ OK |
| city | VARCHAR(128) | Yes | ✅ OK |
| state | VARCHAR(64) | Yes | ✅ OK |
| zipcode | VARCHAR(32) | Yes | ✅ OK |
| customer_number | VARCHAR(50) | Yes | ✅ OK |
| created_at | TIMESTAMP | Yes | ✅ OK |
| created_by_user_id | INTEGER | Yes | ✅ OK |
| created_by_username | VARCHAR(100) | Yes | ✅ OK |
| updated_at | TIMESTAMP | Yes | ✅ OK |
| updated_by_user_id | INTEGER | Yes | ✅ OK |
| updated_by_username | VARCHAR(100) | Yes | ✅ OK |

### 🔴 Missing Columns (1 column)

| Column Name | Data Type | Purpose | Code Location | Impact |
|------------|-----------|---------|---|---------|
| profile_image | TEXT | Customer profile image (base64 or URL) | pawn-flow-frontend/server.js:2476 | UPDATE customers SET profile_image = $16 WHERE id = $19 - Images can't be stored |

### Query Error Without profile_image

**Error:** Customer Profile Update (pawn-flow-frontend/server.js:2476)
```javascript
// This will fail with: column "profile_image" does not exist
const result = await pool.query(
  `UPDATE customers
   SET first_name = $1, last_name = $2, email = $3, home_phone = $4,
       mobile_phone = $5, birthdate = $6, id_type = $7, id_number = $8,
       referral = $9, identification_info = $10, street_address = $11,
       city = $12, state = $13, zipcode = $14, customer_number = $15,
       profile_image = $16,  // <-- MISSING COLUMN
       updated_by_user_id = $17, updated_by_username = $18, updated_at = CURRENT_TIMESTAMP
   WHERE id = $19
   RETURNING *`,
  [
    first_name || null,
    last_name || null,
    email || null,
    home_phone || null,
    mobile_phone || null,
    birthdate || null,
    id_type || null,
    id_number || null,
    referral || null,
    identification_info || null,
    street_address || null,
    city || null,
    state || null,
    zipcode || null,
    customer_number || null,
    profile_image || null,  // <-- ERROR HERE
    updated_by_user_id || null,
    updated_by_username || null,
    customerIdNum
  ]
);
```

---

## DISCOUNT_LOGS Table - Missing Table Analysis

### Status: 🔴 TABLE DOES NOT EXIST

**Referenced In:**
- pawn-flow-frontend/server.js line 2502
- Migration file reference in comment

### Required Structure:

```sql
CREATE TABLE IF NOT EXISTS discount_logs (
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

### Column Definitions:

| Column | Type | Purpose | Allows NULL |
|--------|------|---------|------------|
| id | SERIAL | Primary key | No |
| loan_id | INTEGER | FK to loans | No |
| customer_id | INTEGER | FK to customers | Yes |
| discount_amount | NUMERIC(10,2) | Amount discounted | No |
| applied_by_user_id | INTEGER | FK to users who applied | Yes |
| applied_by_username | VARCHAR(100) | Username audit trail | Yes |
| previous_interest_amount | NUMERIC(10,2) | Before discount | Yes |
| new_interest_amount | NUMERIC(10,2) | After discount | Yes |
| previous_total_payable | NUMERIC(10,2) | Before discount | Yes |
| new_total_payable | NUMERIC(10,2) | After discount | Yes |
| created_at | TIMESTAMP | When applied | Yes (defaults to now) |

### Example Usage:

```javascript
// From pawn-flow-frontend/server.js:2502
const discountLogQuery = `
  INSERT INTO discount_logs (
    loan_id, 
    customer_id, 
    discount_amount, 
    applied_by_user_id, 
    applied_by_username,
    previous_interest_amount,
    new_interest_amount,
    previous_total_payable,
    new_total_payable,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
  RETURNING *
`;

await pool.query(discountLogQuery, [
  loanIdNum,           // $1
  customerIdNum,       // $2
  discountAmountNum,   // $3
  appliedByUserId,     // $4
  appliedByUsername,   // $5
  previousInterest,    // $6
  newInterest,         // $7
  previousTotal,       // $8
  newTotal             // $9
]);
```

---

## Summary Statistics

### By Table:
- **loans:** 43 existing + 8 missing = 51 total columns
- **payment_history:** 6 existing + 6 missing = 12 total columns
- **customers:** 20 existing + 1 missing = 21 total columns
- **discount_logs:** 0 existing + 11 missing = 11 total columns

### By Type:
- **NUMERIC/DECIMAL:** 6 missing columns
- **VARCHAR:** 8 missing columns
- **INTEGER:** 2 missing columns
- **TIMESTAMP:** 2 missing columns
- **TEXT:** 1 missing column
- **Entire Tables:** 1 missing table

### By Function:
- **Audit/Tracking:** 8 columns
- **Business Logic:** 4 columns
- **Status/Classification:** 3 columns

---

## Indexes Needed for New Columns

```sql
-- Loans table indexes
CREATE INDEX idx_loans_redemption_fee ON loans(redemption_fee);
CREATE INDEX idx_loans_extended_at ON loans(extended_at);
CREATE INDEX idx_loans_reactivated_by_user_id ON loans(reactivated_by_user_id);
CREATE INDEX idx_loans_extended_by_user_id ON loans(extended_by_user_id);
CREATE INDEX idx_loans_updated_by_user_id ON loans(updated_by_user_id);

-- Payment_history indexes
CREATE INDEX idx_payment_history_payment_type ON payment_history(payment_type);
CREATE INDEX idx_payment_history_payment_status ON payment_history(payment_status);
CREATE INDEX idx_payment_history_reference_number ON payment_history(reference_number);
CREATE INDEX idx_payment_history_processor ON payment_history(processor);

-- Discount_logs indexes
CREATE INDEX idx_discount_logs_loan_id ON discount_logs(loan_id);
CREATE INDEX idx_discount_logs_customer_id ON discount_logs(customer_id);
CREATE INDEX idx_discount_logs_applied_by_user_id ON discount_logs(applied_by_user_id);
CREATE INDEX idx_discount_logs_created_at ON discount_logs(created_at);

-- Customers indexes
CREATE INDEX idx_customers_profile_image ON customers(profile_image);
```

---

## Foreign Key Relationships

### New Foreign Keys Added:

1. **loans.reactivated_by_user_id** → users(id) ON DELETE SET NULL
2. **loans.extended_by_user_id** → users(id) ON DELETE SET NULL
3. **loans.updated_by_user_id** → users(id) ON DELETE SET NULL
4. **discount_logs.loan_id** → loans(id) ON DELETE CASCADE
5. **discount_logs.customer_id** → customers(id) ON DELETE SET NULL
6. **discount_logs.applied_by_user_id** → users(id) ON DELETE SET NULL

---

**Audit Complete - All Missing Columns Documented**
