## Backend Analysis & Setup Guide

### Summary of Findings

✅ **Backend Status:** Fully Functional
- All endpoints are correctly implemented
- PostgreSQL database is configured
- CORS is enabled for frontend communication
- Customer-scoped API design is working

🔴 **Current Issue:** 404 Error on Loan Creation
- **Cause:** Customer ID 2 does not exist in the database
- **Solution:** Create test customers before creating loans
- **Location:** Backend is at `C:\Users\HP\pawn-flow`
- **Running on:** Port 5000 (http://localhost:5000)

---

### Backend Structure

```
C:\Users\HP\pawn-flow/
├── server.js                      # Main Express server with all endpoints
├── validators.js                  # Input validation & data mapping
├── pdf-invoice-generator.js       # PDF generation for loans
├── package.json                   # Dependencies
├── .env                          # Environment configuration
├── migrations/                    # Database migration scripts
├── tests/                        # Test files
└── pawn_shop_schema.sql          # Database schema
```

---

### Key Endpoints Implemented

#### Customer Management
- `POST /customers` - Create new customer ✅
- `GET /customers/:customerId` - Get customer by ID ✅
- `GET /customers/search-phone?phone=...` - Search by phone ✅
- `GET /customers/search-name?firstName=&lastName=` - Search by name ✅
- `PUT /customers/:customerId` - Update customer ✅

#### Loan Management (Customer-Scoped)
- `POST /customers/:customerId/loans` - **Create loan for customer** ✅
- `GET /customers/:customerId/loans` - **Get all loans for customer** ✅
- `POST /customers/:customerId/loans/:loanId/payment` - Make payment ✅
- `POST /customers/:customerId/loans/:loanId/redeem` - Redeem loan ✅
- `POST /customers/:customerId/loans/:loanId/forfeit` - Forfeit loan ✅
- `POST /customers/:customerId/loans/:loanId/extend-due-date` - Extend due date ✅
- `POST /customers/:customerId/loans/:loanId/reactivate` - Reactivate loan ✅

---

### The 404 Error Explained

**Error Message:**
```
POST /customers/2/loans - 404 (Not Found)
Customer not found
```

**Root Cause:**
The backend endpoint is working correctly! It's checking if customer 2 exists in the database:

```javascript
// server.js line 1596-1602
const customerResult = await pool.query(
  'SELECT * FROM customers WHERE id = $1',
  [customerIdNum]
);

if (customerResult.rows.length === 0) {
  return res.status(404).json({ message: 'Customer not found' });  // ← This is the error
}
```

**What's Happening:**
1. Frontend tries to create a loan for customer ID 2
2. Backend checks if customer 2 exists in database
3. Customer 2 doesn't exist
4. Backend returns 404 "Customer not found"

**This is NOT a bug** - it's correct behavior! You cannot create a loan for a non-existent customer.

---

### Solution: Create Test Customers

#### Option 1: Using SQL (Recommended)

1. **Connect to PostgreSQL:**
   ```powershell
   # Using psql (if installed)
   psql -U postgres -h localhost -d pawn_shop
   
   # Or use any PostgreSQL client
   ```

2. **Run the test data script:**
   ```sql
   -- Copy contents from C:\Users\HP\pawn-flow\seed-test-data.sql
   -- and execute in your PostgreSQL client
   ```

3. **Verify customers were created:**
   ```sql
   SELECT id, first_name, last_name, email FROM customers LIMIT 10;
   ```

**Expected Output:**
```
 id | first_name | last_name |         email
----+------------+-----------+------------------------
  1 | John       | Smith     | john.smith@example.com
  2 | Susan      | Johnson   | susan@example.com
  3 | Michael    | Brown     | michael.brown@example.com
  4 | Emily      | Davis     | emily.davis@example.com
  5 | Robert     | Wilson    | robert.w@example.com
```

#### Option 2: Using Frontend

1. Go to http://localhost:3001
2. Click "Create Customer Profile"
3. Fill in customer details:
   - First Name: Susan
   - Last Name: Johnson
   - Email: susan@example.com
   - Phone: 555-1234 (home or mobile)
   - Other optional fields
4. Click Create
5. **Note the Customer ID** returned in success message
6. Use that ID for creating loans

---

### Testing Workflow

#### Step 1: Create a Customer
**Option A - Via Frontend:**
```
1. Login to http://localhost:3001
2. Select "Create Customer Profile"
3. Enter customer details
4. Click Submit
5. Note the Customer ID (e.g., 1, 2, 3)
```

**Option B - Via SQL:**
```sql
INSERT INTO customers (first_name, last_name, email)
VALUES ('Test', 'Customer', 'test@example.com')
RETURNING id;
-- Returns: id = 6
```

#### Step 2: Create a Loan for That Customer
```
1. Go to "Manage Profile & Loans"
2. Search for the customer you created
3. Select the customer from results
4. Click "Create New Loan"
5. Fill in loan details (amount, interest rate, term)
6. Click Submit
7. Should see success message (no more 404 error)
```

#### Step 3: Verify in Backend
```sql
-- Check if loan was created
SELECT id, customer_id, first_name, last_name, loan_amount, status 
FROM loans 
WHERE customer_id = 2
ORDER BY created_at DESC;
```

---

### Common Issues & Solutions

#### Issue 1: "Customer not found" when creating loan
**Cause:** Customer ID doesn't exist
**Solution:** 
- Create customer first using POST /customers
- Use returned Customer ID to create loan
- Verify customer exists: GET /customers/:customerId

#### Issue 2: Database connection error
**Check:**
```powershell
# Verify PostgreSQL is running
Get-Process | Select-String postgres

# Test connection
Test-NetConnection -ComputerName localhost -Port 5432
```

**Fix:** Start PostgreSQL service
```powershell
# Windows
net start postgresql-x64-VERSION

# Or start PostgreSQL desktop app
```

#### Issue 3: Backend returns 500 error
**Check:** Backend logs
```powershell
# View server error logs
Get-Content C:\Users\HP\pawn-flow\server_err.log -Tail 50
```

**Common causes:**
- Database not running
- Invalid environment variables
- Invalid request payload format
- Database schema missing

---

### Database Verification

#### Check Database Connection
```sql
-- Run this in psql or pgAdmin
SELECT version();
-- Should return PostgreSQL version info
```

#### Check Customer Table
```sql
-- View table structure
\d customers;

-- View all customers
SELECT * FROM customers;

-- Count customers
SELECT COUNT(*) FROM customers;
```

#### Check Loan Table
```sql
-- View all loans
SELECT id, customer_id, first_name, last_name, loan_amount, status FROM loans;

-- Count loans
SELECT COUNT(*) FROM loans;
```

---

### Workflow Diagram

```
Frontend (http://localhost:3001)
    ↓
    ├─→ 1. Create Customer
    │       POST /customers
    │       ↓ Returns Customer ID
    │
    ├─→ 2. Search Customer
    │       GET /customers/search-phone
    │       GET /customers/search-name
    │       ↓ Returns Customer Details
    │
    ├─→ 3. Create Loan (for selected customer)
    │       POST /customers/{customerId}/loans
    │       ↓ Returns Loan Details
    │
    ├─→ 4. View Customer Loans
    │       GET /customers/{customerId}/loans
    │       ↓ Returns All Loans
    │
    └─→ 5. Loan Operations (payment, extend, redeem, forfeit)
            POST /customers/{customerId}/loans/{loanId}/*

Backend (http://localhost:5000)
PostgreSQL Database (localhost:5432)
```

---

### Backend API Configuration

**Environment Variables (.env):**
```
DATABASE_URL=postgresql://postgres:1234@localhost:5432/pawn_shop
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**CORS Settings:**
```javascript
// server.js line 12
app.use(cors());  // Allows requests from frontend
```

**Database Pool:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false  // For development
});
```

---

### Testing the API Directly

#### Test 1: Create Customer (Backend test)
```powershell
$body = @{
    firstName = "John"
    lastName = "Doe"
    email = "john@example.com"
    homePhone = "555-1111"
    createdByUserId = "1"
    createdByUsername = "admin"
} | ConvertTo-Json

curl -X POST http://localhost:5000/customers `
  -H "Content-Type: application/json" `
  -d $body
```

**Expected Response:**
```json
{
  "message": "Customer created successfully",
  "customer": {
    "id": 6,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    ...
  }
}
```

#### Test 2: Get Customer
```powershell
curl http://localhost:5000/customers/2
```

**Expected Response:**
```json
{
  "id": 2,
  "first_name": "Susan",
  "last_name": "Johnson",
  "email": "susan@example.com",
  ...
}
```

#### Test 3: Create Loan for Customer
```powershell
$body = @{
    loanAmount = 500
    interestRate = 5
    itemDescription = "Diamond Ring"
    loanTerm = 30
    loanIssuedDate = "2025-11-24"
    dueDate = "2025-12-24"
    createdByUserId = "1"
    createdByUsername = "admin"
} | ConvertTo-Json

curl -X POST http://localhost:5000/customers/2/loans `
  -H "Content-Type: application/json" `
  -d $body
```

**Expected Response:**
```json
{
  "message": "Loan created successfully for customer",
  "loan": {
    "id": 1,
    "customer_id": 2,
    "loan_amount": 500,
    "interest_rate": 5,
    "status": "active",
    ...
  }
}
```

---

### Quick Start Commands

```powershell
# 1. Navigate to backend
cd C:\Users\HP\pawn-flow

# 2. Check if dependencies are installed
npm list | Select-Object -First 20

# 3. Verify backend is running
curl http://localhost:5000

# 4. Create test customers (Option 1: SQL)
# Use PostgreSQL client to run seed-test-data.sql

# 5. Test frontend-backend integration
# Go to http://localhost:3001 and follow workflow

# 6. Check logs
Get-Content .\server_err.log -Tail 20
Get-Content .\server_out.log -Tail 20
```

---

### Files to Reference

1. **Backend Code:** `C:\Users\HP\pawn-flow\server.js`
   - Endpoints: Lines 1-2200+
   - Customer endpoints: Lines 1071-1472
   - Loan endpoints: Lines 1569-2156

2. **Validators:** `C:\Users\HP\pawn-flow\validators.js`
   - Field mapping and validation logic

3. **Database Schema:** `C:\Users\HP\pawn-flow\pawn_shop_schema.sql`
   - Table definitions and structure

4. **Test Data Script:** `C:\Users\HP\pawn-flow\seed-test-data.sql`
   - Sample customer data for testing

5. **Environment Config:** `C:\Users\HP\pawn-flow\.env`
   - Database connection and server settings

---

### Next Steps

1. ✅ **Understand the issue** - Customer 2 doesn't exist
2. **Create test customers** - Use SQL script or frontend
3. **Test complete workflow** - Create customer → Create loan → View loans
4. **Verify success** - No more 404 errors
5. **Check logs** - Ensure all operations complete successfully

Backend is working correctly. The issue is simply that you need to follow the proper workflow:
**Create Customer First → Then Create Loan**

