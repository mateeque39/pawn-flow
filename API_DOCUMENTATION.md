# PawnFlow Backend API Documentation

## Overview
PawnFlow is a comprehensive pawn shop management system backend built with Node.js, Express, and PostgreSQL. This document covers all API endpoints with complete request/response examples including the extended customer fields implementation.

## Base URL
```
http://localhost:5000
```

## Table of Contents
- [Authentication](#authentication)
- [Loans](#loans)
  - [Create Loan](#create-loan)
  - [Search Loans](#search-loans)
  - [Add Money to Loan](#add-money-to-loan)
- [Payments](#payments)
- [Shift Management](#shift-management)
- [Error Handling](#error-handling)
- [Database Schema](#database-schema)

---

## Authentication

### Register User
**POST** `/register`

Create a new user account.

**Request:**
```json
{
  "username": "john_admin",
  "password": "secure_password",
  "role": "admin"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "john_admin",
    "role_id": 1
  }
}
```

### Login
**POST** `/login`

Authenticate user and get JWT token.

**Request:**
```json
{
  "username": "john_admin",
  "password": "secure_password"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Loans

### Create Loan
**POST** `/create-loan`

Create a new loan with comprehensive customer information and automatic interest calculation.

**Request (camelCase):**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "homePhone": "555-1111",
  "mobilePhone": "555-2222",
  "birthdate": "1980-01-01",
  "referral": "friend",
  "identificationInfo": "Passport 12345",
  "streetAddress": "123 Main St Apt 4",
  "city": "Boston",
  "state": "MA",
  "zipcode": "02111",
  "loanAmount": 100,
  "interestRate": 10,
  "loanTerm": 30,
  "loanIssuedDate": "2025-11-21",
  "dueDate": "2025-12-21",
  "transactionNumber": "987654321",
  "collateralDescription": "Gold watch",
  "customerNote": "VIP customer",
  "createdByUserId": 1,
  "createdByUsername": "admin"
}
```

**Request (snake_case - also accepted):**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@example.com",
  "mobile_phone": "555-2222",
  "street_address": "123 Main St",
  "city": "Boston",
  "loan_amount": 100,
  "interest_rate": 10,
  "loan_term": 30
}
```

**Validation Rules:**
| Field | Required | Type | Rules |
|-------|----------|------|-------|
| first_name | Yes | String | Non-empty |
| last_name | Yes | String | Non-empty |
| email | No | String | Valid email format if provided |
| home_phone | No | String | Phone format (7-20 chars) if provided |
| mobile_phone | No | String | Phone format (7-20 chars) if provided |
| birthdate | No | Date | ISO 8601 format (YYYY-MM-DD) if provided |
| street_address | No | String | Free text |
| city | No | String | Free text |
| state | No | String | Free text |
| zipcode | No | String | Free text |
| loan_amount | Yes | Number | Must be > 0 |
| interest_rate | Yes | Number | Must be >= 0 |
| loan_term | Yes | Integer | Must be >= 0 (in days) |

**Response:** `201 Created`
```json
{
  "loan": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "home_phone": "555-1111",
    "mobile_phone": "555-2222",
    "birthdate": "1980-01-01",
    "referral": "friend",
    "identification_info": "Passport 12345",
    "street_address": "123 Main St Apt 4",
    "city": "Boston",
    "state": "MA",
    "zipcode": "02111",
    "customer_number": null,
    "loan_amount": 100,
    "interest_rate": 10,
    "interest_amount": 10,
    "total_payable_amount": 110,
    "collateral_description": "Gold watch",
    "customer_note": "VIP customer",
    "transaction_number": "987654321",
    "loan_issued_date": "2025-11-21",
    "loan_term": 30,
    "due_date": "2025-12-21",
    "status": "active",
    "remaining_balance": 110,
    "created_by": 1,
    "created_by_user_id": 1,
    "created_by_username": "admin",
    "customer_name": "Jane Doe"
  }
}
```

**Key Features:**
- Accepts both `camelCase` and `snake_case` input fields
- Automatic calculation: `interest_amount = (loan_amount * interest_rate) / 100`
- Automatic calculation: `total_payable_amount = loan_amount + interest_amount`
- All response fields returned in `snake_case`
- `customer_name` field automatically populated with "FirstName LastName" for backward compatibility

### Search Loans
**GET** `/search-loan`

Search for loans by customer information with flexible query parameters.

**Query Parameters (all optional, at least one required):**
```
?firstName=Jane              # Search by first name (partial/ILIKE match)
?lastName=Doe               # Search by last name (partial/ILIKE match)
?email=jane@example.com     # Search by email (partial/ILIKE match)
?mobilePhone=555            # Search by mobile phone (partial/ILIKE match)
?homePhone=555              # Search by home phone (partial/ILIKE match)
?city=Boston                # Search by city (partial/ILIKE match)
?state=MA                   # Search by state (partial/ILIKE match)
?zipcode=02111              # Search by zipcode (partial/ILIKE match)
?customerNumber=CUST001     # Search by customer number (partial/ILIKE match)
?transactionNumber=123456   # Search by transaction (exact match)
?customerName=Jane          # Search by legacy customer_name (partial/ILIKE match)
```

**Example Requests:**
```
GET /search-loan?firstName=Jane&lastName=Doe
GET /search-loan?email=jane@example.com
GET /search-loan?mobilePhone=555
GET /search-loan?city=Boston&state=MA
```

**Response:** `200 OK` (if found)
```json
[
  {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "mobile_phone": "555-2222",
    "street_address": "123 Main St Apt 4",
    "city": "Boston",
    "state": "MA",
    "zipcode": "02111",
    "loan_amount": 100,
    "interest_rate": 10,
    "interest_amount": 10,
    "total_payable_amount": 110,
    "loan_issued_date": "2025-11-21",
    "due_date": "2025-12-21",
    "status": "active",
    "remaining_balance": 110,
    "transaction_number": "987654321"
  }
]
```

**Response:** `404 Not Found`
```json
{
  "message": "No loans found"
}
```

**Response:** `400 Bad Request` (no search criteria)
```json
{
  "message": "At least one search criteria is required"
}
```

### Add Money to Loan
**POST** `/add-money`

Add additional money to an existing loan.

**Request:**
```json
{
  "loanId": 1,
  "amount": 50
}
```

**Response:** `200 OK`
```json
{
  "message": "Money added successfully",
  "loan": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "loan_amount": 150,
    "total_payable_amount": 165,
    "remaining_balance": 165,
    "status": "active"
  }
}
```
?mobilePhone=555-5678       # Search by mobile phone (partial match)
?customerNumber=CUST001     # Search by customer number (exact match)
?transactionNumber=123456   # Search by transaction number (exact match)
?customerName=Jane%20Doe    # Search by full name (backward compatible)
```

**Examples:**
```
GET /search-loan?firstName=Jane&lastName=Doe
GET /search-loan?email=jane@example.com
GET /search-loan?mobilePhone=555-5678
GET /search-loan?transactionNumber=987654321
```

**Response:** `200 OK`
```json
[
  {
    "id": 123,
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "home_phone": "555-1234",
    "mobile_phone": "555-5678",
    "birthdate": "1980-01-15",
    "referral": "friend",
    "identification_info": "Passport: ABC123456",
    "address": "123 Main Street, City, State 12345",
    "customer_number": "CUST001",
    "loan_amount": 500,
    "interest_rate": 10,
    "interest_amount": 50,
    "total_payable_amount": 550,
    "loan_issued_date": "2025-11-21",
    "due_date": "2025-12-21",
    "transaction_number": "987654321",
    "status": "active",
    "remaining_balance": 550
  }
]
```

### Add Money to Loan
**POST** `/add-money`

Add additional funds to an existing loan.

**Request:**
```json
{
  "loanId": 123,
  "amount": 200
}
```

**Response:** `200 OK`
```json
{
  "message": "Money added successfully and loan recalculated",
  "loan": {
    "id": 123,
    "first_name": "Jane",
    "last_name": "Doe",
    "loan_amount": 700,
    "interest_amount": 70,
    "total_payable_amount": 770,
    "remaining_balance": 770
  }
}
```

---

## Payments

### Make Payment
**POST** `/make-payment`

Record a payment for a loan.

**Request:**
```json
{
  "loanId": 123,
  "paymentMethod": "cash",
  "paymentAmount": 275,
  "userId": 1
}
```

**Response:** `200 OK`
```json
{
  "message": "Payment successfully processed!",
  "loan": {
    "id": 123,
    "first_name": "Jane",
    "last_name": "Doe",
    "remaining_balance": 495,
    "total_payable_amount": 770
  },
  "paymentHistory": {
    "id": 45,
    "loan_id": 123,
    "payment_method": "cash",
    "payment_amount": 275,
    "payment_date": "2025-11-21T11:00:00.000Z"
  }
}
```

### Get Payment History
**GET** `/payment-history?loanId=123`

Get all payments for a specific loan.

**Response:** `200 OK`
```json
[
  {
    "id": 45,
    "loan_id": 123,
    "payment_method": "cash",
    "payment_amount": 275,
    "payment_date": "2025-11-21T11:00:00.000Z",
    "created_by": 1
  },
  {
    "id": 46,
    "loan_id": 123,
    "payment_method": "cheque",
    "payment_amount": 220,
    "payment_date": "2025-11-21T14:30:00.000Z",
    "created_by": 1
  }
]
```

### Redeem Loan
**POST** `/redeem-loan`

Redeem a fully paid loan (return collateral).

**Request:**
```json
{
  "loanId": 123,
  "userId": 1
}
```

**Response:** `200 OK`
```json
{
  "message": "Loan redeemed successfully!",
  "loan": {
    "id": 123,
    "status": "redeemed",
    "remaining_balance": 0
  },
  "redeemHistory": {
    "id": 10,
    "loan_id": 123,
    "redeemed_by": 1,
    "redeemed_at": "2025-11-21T15:00:00.000Z"
  }
}
```

### Forfeit Loan
**POST** `/forfeit-loan`

Mark a fully paid loan as forfeited (keep collateral).

**Request:**
```json
{
  "loanId": 123,
  "userId": 1
}
```

**Response:** `200 OK`
```json
{
  "message": "Loan forfeited successfully!",
  "loan": {
    "id": 123,
    "status": "forfeited",
    "remaining_balance": 0
  },
  "forfeitHistory": {
    "id": 10,
    "loan_id": 123,
    "redeemed_by": 1
  }
}
```

---

## Shift Management

### Start Shift
**POST** `/start-shift`

Begin a new work shift with opening cash balance.

**Request:**
```json
{
  "userId": 1,
  "openingBalance": 5000
}
```

**Response:** `201 Created`
```json
{
  "message": "Shift started successfully",
  "shift": {
    "id": 15,
    "user_id": 1,
    "shift_start_time": "2025-11-21T09:00:00.000Z",
    "opening_balance": 5000,
    "shift_end_time": null,
    "is_balanced": false
  }
}
```

### Get Current Shift
**GET** `/current-shift?userId=1`

Get the active shift for a user.

**Response:** `200 OK`
```json
{
  "id": 15,
  "user_id": 1,
  "shift_start_time": "2025-11-21T09:00:00.000Z",
  "opening_balance": 5000,
  "shift_end_time": null,
  "is_balanced": false
}
```

### End Shift
**POST** `/end-shift`

Close a shift and verify cash balance.

**Request:**
```json
{
  "userId": 1,
  "closingBalance": 5500,
  "notes": "All transactions verified"
}
```

**Response:** `200 OK`
```json
{
  "message": "Shift closed successfully and cash is balanced!",
  "shift": {
    "id": 15,
    "user_id": 1,
    "shift_start_time": "2025-11-21T09:00:00.000Z",
    "shift_end_time": "2025-11-21T17:00:00.000Z",
    "opening_balance": 5000,
    "closing_balance": 5500,
    "total_payments_received": 1200,
    "total_loans_given": 700,
    "expected_balance": 5500,
    "difference": 0,
    "is_balanced": true
  },
  "summary": {
    "openingBalance": 5000,
    "closingBalance": 5500,
    "totalPaymentsReceived": 1200,
    "totalLoansGiven": 700,
    "expectedBalance": 5500,
    "actualDifference": 0,
    "isBalanced": true,
    "status": "BALANCED"
  }
}
```

### Get Shift Report
**GET** `/shift-report/:shiftId`

Get detailed summary of transactions during a shift.

**Response:** `200 OK`
```json
{
  "shift": {
    "id": 15,
    "user_id": 1,
    "shift_start_time": "2025-11-21T09:00:00.000Z",
    "shift_end_time": "2025-11-21T17:00:00.000Z",
    "opening_balance": 5000,
    "closing_balance": 5500,
    "is_balanced": true
  },
  "payments": [
    {
      "id": 45,
      "loan_id": 123,
      "payment_method": "cash",
      "payment_amount": 275,
      "customer_name": "Jane Doe",
      "transaction_number": "987654321"
    }
  ],
  "loansCreated": [
    {
      "id": 123,
      "customer_name": "Jane Doe",
      "loan_amount": 500,
      "transaction_number": "987654321"
    }
  ],
  "summary": {
    "totalTransactions": 2,
    "totalPaymentTransactions": 1,
    "totalLoansCreated": 1
  }
}
```

### Get Shift History
**GET** `/shift-history?userId=1`

Get all shifts for a user.

**Response:** `200 OK`
```json
[
  {
    "id": 15,
    "user_id": 1,
    "shift_start_time": "2025-11-21T09:00:00.000Z",
    "shift_end_time": "2025-11-21T17:00:00.000Z",
    "opening_balance": 5000,
    "closing_balance": 5500,
    "is_balanced": true
  },
  {
    "id": 14,
    "user_id": 1,
    "shift_start_time": "2025-11-20T09:00:00.000Z",
    "shift_end_time": "2025-11-20T17:00:00.000Z",
    "opening_balance": 4800,
    "closing_balance": 5000,
    "is_balanced": true
  }
]
```

---

## Error Handling

All errors follow this format:

```json
{
  "message": "Error description",
  "error": "Detailed error information (if available)"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request parameters |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

### Common Error Examples

**Missing Required Fields:**
```json
{
  "message": "first_name is required and must be a non-empty string"
}
```

**Invalid Email:**
```json
{
  "message": "Invalid email format"
}
```

**Invalid Phone:**
```json
{
  "message": "Invalid mobile_phone format"
}
```

**Loan Not Found:**
```json
{
  "message": "No loans found"
}
```

---

## Database Schema

### Loans Table
```sql
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  home_phone VARCHAR(20),
  mobile_phone VARCHAR(20),
  birthdate DATE,
  referral VARCHAR(255),
  identification_info TEXT,
  address TEXT,
  customer_name VARCHAR(255),
  customer_number VARCHAR(100),
  loan_amount DECIMAL(12, 2),
  interest_rate DECIMAL(5, 2),
  interest_amount DECIMAL(12, 2),
  total_payable_amount DECIMAL(12, 2),
  collateral_description TEXT,
  customer_note TEXT,
  transaction_number VARCHAR(100) UNIQUE,
  loan_issued_date DATE,
  loan_term INTEGER,
  due_date DATE,
  status VARCHAR(50),
  remaining_balance DECIMAL(12, 2),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Installation & Setup

### Prerequisites
- Node.js v14 or higher
- PostgreSQL v12 or higher
- npm or yarn

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pawn_shop
DB_PASSWORD=1234
DB_PORT=5432
JWT_SECRET=your_secret_key
PORT=5000
```

### Run Migrations
```bash
# Apply migrations manually using psql
psql -U postgres -d pawn_shop -f migrations/001_add_shift_management.sql
psql -U postgres -d pawn_shop -f migrations/002_add_created_by_payment_history.sql
psql -U postgres -d pawn_shop -f migrations/003_add_created_by_loans.sql
psql -U postgres -d pawn_shop -f migrations/004_add_customer_fields.sql
```

### Start Server
```bash
node server.js
```

Server runs on `http://localhost:5000`

---

## Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

---

## Version History

### v1.0.0 (2025-11-21)
- Initial release
- Core loan management system
- Shift management and cash balancing
- Comprehensive customer information fields
- Payment tracking
- Loan redemption/forfeiture

---

## Support

For issues or questions, contact the development team.
