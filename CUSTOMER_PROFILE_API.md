# Customer Profile API - Restructured Endpoints

## Overview
All loan operations are now organized through the customer profile. Everything flows through a customer context.

---

## Customer Profile Management

### Create Customer Profile
**POST** `/customers`
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "homePhone": "555-1234",
  "mobilePhone": "555-5678",
  "birthDate": "1980-01-15",
  "idType": "drivers_license",
  "idNumber": "D1234567"
}
```

### Search Customers by Phone
**GET** `/customers/search-phone?phone=5555678`

### Search Customers by Name
**GET** `/customers/search-name?firstName=John&lastName=Doe`

### Get Customer Profile
**GET** `/customers/{customerId}`

### View All Loans for Customer
**GET** `/customers/{customerId}/loans`
Returns: active loans, redeemed loans, forfeited loans, payment history, summary

### Update Customer Profile
**PUT** `/customers/{customerId}`
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "newemail@example.com",
  "mobilePhone": "555-9999"
}
```

---

## Loan Operations (All Through Customer Profile)

### Create Loan for Customer
**POST** `/customers/{customerId}/loans`
```json
{
  "loanAmount": 500,
  "interestRate": 15,
  "loanTerm": 90,
  "itemDescription": "Gold Ring",
  "itemCondition": "good",
  "userId": 1,
  "username": "admin"
}
```

### Search Loans for Customer
**GET** `/customers/{customerId}/loans/search?status=active&minAmount=100&maxAmount=1000`

Query params:
- `status`: active, redeemed, forfeited
- `transactionNumber`: exact match
- `minAmount`: minimum loan amount
- `maxAmount`: maximum loan amount

### Get Loan Details
**GET** `/customers/{customerId}/loans/{loanId}`
Returns: loan details, payment history, PDF URL

### Make Payment for Loan
**POST** `/customers/{customerId}/loans/{loanId}/payment`
```json
{
  "paymentMethod": "cash",
  "paymentAmount": 150,
  "userId": 1
}
```

### Redeem Loan
**POST** `/customers/{customerId}/loans/{loanId}/redeem`
```json
{
  "userId": 1
}
```

### Forfeit Loan
**POST** `/customers/{customerId}/loans/{loanId}/forfeit`
```json
{
  "userId": 1
}
```

### Reactivate Forfeited Loan
**POST** `/customers/{customerId}/loans/{loanId}/reactivate`
```json
{
  "reactivatedByUserId": 1,
  "reactivatedByUsername": "admin"
}
```

### Extend Due Date
**POST** `/customers/{customerId}/loans/{loanId}/extend-due-date`
```json
{
  "extendDays": 30,
  "extendedByUserId": 1,
  "extendedByUsername": "admin"
}
```

### Add Money to Loan
**POST** `/customers/{customerId}/loans/{loanId}/add-money`
```json
{
  "amount": 100
}
```

---

## Example Workflow

### 1. Create a Customer Profile
```bash
POST /customers
{
  "firstName": "John",
  "lastName": "Doe",
  "mobilePhone": "555-5678",
  "email": "john@example.com"
}
# Response: customer with ID 42
```

### 2. Create Multiple Loans Against the Same Profile
```bash
# First Loan
POST /customers/42/loans
{
  "loanAmount": 500,
  "interestRate": 15,
  "loanTerm": 90,
  "itemDescription": "Gold Ring"
}

# Second Loan (same customer)
POST /customers/42/loans
{
  "loanAmount": 300,
  "interestRate": 15,
  "loanTerm": 90,
  "itemDescription": "Silver Watch"
}
```

### 3. Search Customer's Loans
```bash
GET /customers/42/loans/search?status=active
# Response: All active loans for customer 42
```

### 4. Make Payment
```bash
POST /customers/42/loans/1/payment
{
  "paymentMethod": "cash",
  "paymentAmount": 500
}
```

### 5. Extend Due Date
```bash
POST /customers/42/loans/1/extend-due-date
{
  "extendDays": 30,
  "extendedByUserId": 1,
  "extendedByUsername": "admin"
}
```

### 6. Redeem Loan (when fully paid)
```bash
POST /customers/42/loans/1/redeem
{
  "userId": 1
}
```

### 7. View Complete Loan History
```bash
GET /customers/42/loans
# Response: 
# {
#   "activeLoans": [...],
#   "redeemedLoans": [...],
#   "forfeitedLoans": [...],
#   "paymentHistory": [...],
#   "summary": {
#     "totalActiveLoans": 1,
#     "totalRedeemedLoans": 1,
#     "totalForfeitedLoans": 0,
#     "totalPayments": 5,
#     "totalOutstanding": 0
#   }
# }
```

---

## Additional Features Still Available

- **Shift Management**: `/start-shift`, `/end-shift`, `/shift-history`, etc.
- **Cash Reporting**: `/cash-report?date=2025-11-24`
- **PDF Generation**: `/loan-pdf/{loanId}`
- **Authentication**: `/register`, `/login`

---

## Notes

- All loan operations are scoped to a customer
- Customer data is stored once and reused across multiple loans
- Complete audit trail maintained for all operations
- Payment history tracked per loan
- Search capabilities built in for finding loans by status, amount, and transaction number
