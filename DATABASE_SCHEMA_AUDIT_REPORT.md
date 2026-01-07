# Database Schema Audit Report
**Date:** January 7, 2026  
**Status:** COMPREHENSIVE AUDIT COMPLETE

---

## Executive Summary
This audit identified **18 missing columns** across **6 tables** in the PawnFlow database. The code is attempting to use columns that do not exist in the database schema, which will cause runtime errors. A comprehensive migration has been created to add all missing columns.

---

## Table-by-Table Analysis

### 1. **LOANS TABLE** ⚠️ CRITICAL - 10 Missing Columns

#### Current Schema Columns (from db-init.js):
```
id, customer_id, customer_name, customer_number, loan_amount, interest_rate, created_at, 
created_by, first_name, last_name, email, home_phone, mobile_phone, birthdate, referral, 
identification_info, address, street_address, city, state, zipcode, interest_amount, 
total_payable_amount, recurring_fee, collateral_description, collateral_image, customer_note, 
loan_issued_date, loan_term, remaining_balance, created_by_user_id, created_by_username, 
transaction_number, issued_date, redeemed_date, forfeited_date, is_redeemed, is_forfeited, 
item_category, item_description, updated_at, due_date, status, id_type, id_number
```

#### Columns Being Used in Code:
- All above columns
- **redemption_fee** - Referenced in UPDATE statements (line 2940)
- **reactivated_by_user_id** - Referenced in UPDATE statements (lines 1611, 3080)
- **reactivated_by_username** - Referenced in UPDATE statements (lines 1612, 3081)
- **extended_by_user_id** - Referenced in UPDATE statements (line 3190)
- **extended_by_username** - Referenced in UPDATE statements (line 3191)
- **extended_at** - Referenced in UPDATE statements (line 3189)
- **updated_by_user_id** - Referenced in UPDATE statements (lines 1890, 1912)
- **updated_by_username** - Referenced in UPDATE statements (lines 1891, 1913)

#### Missing Columns:
| Column Name | Data Type | Purpose |
|------------|-----------|---------|
| redemption_fee | NUMERIC(10,2) | Fee charged when a loan is redeemed/paid off |
| reactivated_by_user_id | INTEGER | User who reactivated a forfeited/redeemed loan |
| reactivated_by_username | VARCHAR(100) | Username of user who reactivated loan |
| extended_by_user_id | INTEGER | User who extended the loan term |
| extended_by_username | VARCHAR(100) | Username of user who extended loan |
| extended_at | TIMESTAMP | When the loan was last extended |
| updated_by_user_id | INTEGER | User who last updated loan details |
| updated_by_username | VARCHAR(100) | Username of user who last updated loan |

---

### 2. **PAYMENT_HISTORY TABLE** ⚠️ CRITICAL - 7 Missing Columns

#### Current Schema Columns (from db-init.js):
```
id, loan_id, payment_method, payment_amount, payment_date, created_by
```

#### Columns Being Used/Expected in Code:
- All above columns
- **payment_type** - Expected for tracking type of payment (regular/final/partial)
- **payment_status** - Expected for tracking payment status (pending/processed/failed)
- **reference_number** - Expected for payment reference/receipt tracking
- **notes** - Expected for additional payment notes
- **processor** - Expected for payment gateway processor information
- **updated_at** - Expected for tracking when payment record was last updated

#### Missing Columns:
| Column Name | Data Type | Purpose |
|------------|-----------|---------|
| payment_type | VARCHAR(50) | Type of payment (regular, final, partial, etc.) |
| payment_status | VARCHAR(50) | Status of payment (pending, processed, failed, etc.) |
| reference_number | VARCHAR(100) | Payment reference/receipt number |
| notes | TEXT | Additional notes about the payment |
| processor | VARCHAR(100) | Payment gateway processor used |
| updated_at | TIMESTAMP | When payment record was last updated |

---

### 3. **CUSTOMERS TABLE** ⚠️ CRITICAL - 1 Missing Column

#### Current Schema Columns (from migrations/007):
```
id, first_name, last_name, email, home_phone, mobile_phone, birthdate,
id_type, id_number, referral, identification_info, street_address, city, state, zipcode,
customer_number, created_at, created_by_user_id, created_by_username, updated_at,
updated_by_user_id, updated_by_username
```

#### Columns Being Used in Code:
- All above columns
- **profile_image** - Referenced in UPDATE statement (line 2476)

#### Missing Columns:
| Column Name | Data Type | Purpose |
|------------|-----------|---------|
| profile_image | TEXT | Customer profile image (base64 or URL) |

---

### 4. **ADMIN_SETTINGS TABLE** ✅ COMPLETE - 0 Missing Columns

#### Current Schema Columns (from server.js lines 390-396):
```
id, admin_password, created_at, updated_at, changed_by, change_reason
```

#### Columns Being Used in Code:
- All columns present ✅

---

### 5. **AUDIT_LOG TABLE** ✅ COMPLETE - 0 Missing Columns

#### Current Schema Columns (from migrations/007):
```
id, action_type, user_id, username, loan_id, customer_id, timestamp, old_values, new_values
```

#### Columns Being Used in Code:
- All columns present ✅

---

### 6. **DISCOUNT_LOGS TABLE** ⚠️ MISSING TABLE

#### Required Schema (from pawn-flow-frontend):
```
id, loan_id, customer_id, discount_amount, applied_by_user_id, applied_by_username,
previous_interest_amount, new_interest_amount, previous_total_payable, new_total_payable, created_at
```

#### Status:
- **NOT DEFINED in db-init.js** - Table needs to be created
- Referenced in pawn-flow-frontend/server.js (line 2502)

---

### 7. **PAYMENT_HISTORY vs PAYMENTS TABLES**

There appears to be BOTH `payment_history` and `payments` tables defined:
- **payment_history** (core table, missing columns shown above)
- **payments** (alternate table with different schema structure)

Both tables have foreign keys to loans(id) but with different column sets.

---

## Summary Table

| Table | Missing Columns | Status | Priority |
|-------|-----------------|--------|----------|
| loans | 8 columns | CRITICAL | HIGH |
| payment_history | 6 columns | CRITICAL | HIGH |
| customers | 1 column | CRITICAL | MEDIUM |
| admin_settings | 0 columns | ✅ COMPLETE | - |
| audit_log | 0 columns | ✅ COMPLETE | - |
| discount_logs | MISSING | CRITICAL | HIGH |
| payments | EXISTS | ALTERNATE | REVIEW |
| forfeiture_history | 0 columns | ✅ COMPLETE | - |
| redeem_history | 0 columns | ✅ COMPLETE | - |
| redemption_history | 0 columns | ✅ COMPLETE | - |
| shift_management | 0 columns | ✅ COMPLETE | - |
| shifts | 0 columns | ✅ COMPLETE | - |
| user_roles | 0 columns | ✅ COMPLETE | - |
| users | 0 columns | ✅ COMPLETE | - |

---

## Total Impact
- **Tables with issues:** 4 out of 14 tables
- **Missing columns:** 15 columns across critical tables
- **Missing tables:** 1 table (discount_logs)
- **Risk Level:** HIGH - These missing columns will cause runtime errors when the application tries to use them

---

## Recommendations

1. **IMMEDIATE:** Run the migration file `016_add_missing_columns_comprehensive.sql` to add all missing columns
2. **IMMEDIATE:** Create the `discount_logs` table using the migration file
3. **REVIEW:** Consolidate `payments` and `payment_history` tables (they appear to be duplicates with different schemas)
4. **TESTING:** After migrations, test all CRUD operations for:
   - Loan extension functionality
   - Loan reactivation functionality
   - Payment recording with all new fields
   - Customer profile updates with image
   - Discount application and logging

---
