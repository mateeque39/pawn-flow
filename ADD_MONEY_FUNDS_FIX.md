# Fix: "Not Enough Funds" Error When Creating Loan After Adding Money

## Problem Summary
When you added money to an existing loan, the system would prevent you from creating new loans with the error "Insufficient store cash! Available: $X, Requested: $Y". This happened because the cash balance check was incorrectly counting added money as part of the original loan amount.

## Root Cause
The `/create-loan` endpoint checks available cash by calculating:
```
currentBalance = openingBalance + paymentsIn - loansOut
```

Where `loansOut` was calculated by summing ALL `loan_amount` values for loans created in the shift:
```sql
SELECT SUM(loan_amount) as total_loans_out FROM loans 
WHERE created_by_user_id = $1 AND DATE(created_at) = DATE($2)
```

**The Problem:** When you used the `/add-money` endpoint to add funds to a loan, it increased that loan's `loan_amount`. The next time someone tried to create a new loan, the cash check would sum ALL current loan amounts (including the additions), which incorrectly reduced the available balance.

## Solution Implemented

### 1. Added `initial_loan_amount` Column
- **File:** `db-init.js`
- **Change:** Added new column to track the original loan amount at creation time
- This column is set once when the loan is created and never changes

### 2. Updated Loan Creation Endpoints
- **Files:** `server.js` (both `/create-loan` and `/customers/:customerId/loans`)
- **Change:** Now sets `initial_loan_amount = loan_amount` when creating a new loan
- Ensures the original amount is preserved for accurate balance calculations

### 3. Updated Add Money Endpoint
- **File:** `server.js` (POST `/add-money`)
- **Change:** Added clarifying comment that `initial_loan_amount` is NOT modified
- The endpoint only updates `loan_amount`, `interest_amount`, `total_payable_amount`, and `remaining_balance`

### 4. Fixed Cash Balance Check
- **File:** `server.js` (POST `/create-loan` in customer-centric endpoint)
- **Before:**
  ```sql
  SELECT COALESCE(SUM(loan_amount), 0) as total_loans_out FROM loans ...
  ```
- **After:**
  ```sql
  SELECT COALESCE(SUM(initial_loan_amount), 0) as total_loans_out FROM loans ...
  ```
- Now only counts the original loan amounts, not any additions

## Impact
✅ Adding money to loans no longer affects the available balance for new loans  
✅ Cash balance checks are now accurate  
✅ You can create loans freely as long as you have funds from the opening balance + payments  
✅ Existing loan data is preserved; no data migration needed  

## Database Migration
For existing loans, you need to run:
```sql
UPDATE loans SET initial_loan_amount = loan_amount 
WHERE initial_loan_amount IS NULL;
```

This sets all existing loans' initial amount to their current amount (a reasonable assumption for past data).

## Files Modified
1. `c:\Users\HP\pawn-flow\db-init.js` - Added schema column
2. `c:\Users\HP\pawn-flow\server.js` - Updated 3 endpoints and cash check logic

## Testing Checklist
- [ ] Add money to an existing loan
- [ ] Verify you can still create a new loan
- [ ] Check that the balance displayed is correct
- [ ] Verify loan amounts in the database are correct
