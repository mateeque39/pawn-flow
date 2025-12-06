# PawnFlow Reporting API Documentation

## Overview

This document provides complete API reference for PawnFlow reporting endpoints. All reporting endpoints require JWT authentication and role-based authorization.

---

## Base URL

```
http://localhost:5000  (Development)
https://api.pawnshop.com  (Production)
```

## Authentication

All endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

```bash
POST /login
Content-Type: application/json

{
  "username": "admin@pawnshop.com",
  "password": "your_password"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin@pawnshop.com",
    "role_id": 1
  }
}
```

---

## API Endpoints

### 1. Daily Cash Report

**Endpoint:** `GET /cash-report`

**Authentication Required:** Yes (Admin, Manager)

**Description:** Generate daily cash report for a specific date including pawn activity, in-store transactions, and reconciliation data.

**Parameters:**

| Name | Type | Required | Format | Description |
|------|------|----------|--------|-------------|
| date | string | Yes | YYYY-MM-DD | Report date |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/cash-report?date=2025-12-01" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Example Response (200 OK):**

```json
{
  "pawnActivity": {
    "newLoans": {
      "qty": 5,
      "amount": 2500.00
    },
    "buys": {
      "qty": 2,
      "amount": 1000.00
    },
    "buyouts": {
      "qty": 1,
      "amount": 500.00
    },
    "inStoreTotal": {
      "qty": 8,
      "amount": 4000.00
    }
  },
  "inStoreTxns": {
    "renewals": {
      "qty": 3,
      "principal": 1500.00,
      "interest": 150.00,
      "fees": 0.00,
      "total": 1650.00
    },
    "partialPayments": {
      "qty": 10,
      "principal": 2000.00,
      "interest": 200.00,
      "fees": 0.00,
      "total": 2200.00
    },
    "extensions": {
      "qty": 2,
      "principal": 800.00,
      "interest": 80.00,
      "fees": 0.00,
      "total": 880.00
    },
    "redemptions": {
      "qty": 1,
      "principal": 500.00,
      "interest": 50.00,
      "fees": 0.00,
      "total": 550.00
    },
    "subtotal": {
      "qty": 16,
      "principal": 4800.00,
      "interest": 480.00,
      "fees": 0.00,
      "total": 5280.00
    }
  },
  "openStore": {
    "online": {
      "expected": 1000.00,
      "actual": 1050.00,
      "difference": 50.00
    },
    "till01": {
      "expected": 5000.00,
      "actual": 4950.00,
      "difference": -50.00
    }
  },
  "todayOpeningTotal": 8000.00,
  "todayClosingTotal": 8000.00,
  "activeLoanCount": 45,
  "overdueLoanCount": 3
}
```

---

### 2. Daily Cash Balancing Report

**Endpoint:** `GET /reports/daily-cash-balancing`

**Authentication Required:** Yes (Admin, Manager)

**Description:** Get summary of active loans, due loans, and payments within a date range for balancing purposes.

**Parameters:**

| Name | Type | Required | Format | Description |
|------|------|----------|--------|-------------|
| startDate | string | Yes | YYYY-MM-DD | Range start date |
| endDate | string | Yes | YYYY-MM-DD | Range end date |

**Example Request:**

```bash
curl -X GET "http://localhost:5000/reports/daily-cash-balancing?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <token>"
```

**Example Response (200 OK):**

```json
{
  "date_range": {
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  },
  "active_loans": {
    "count": 24,
    "total_loaned_amount": 12000.00,
    "total_payable_amount": 13200.00,
    "total_interest_amount": 1200.00,
    "average_loan_amount": 500.00
  },
  "due_loans": {
    "count": 3,
    "total_loan_amount": 1500.00,
    "total_payable_amount": 1650.00,
    "total_interest_amount": 150.00,
    "total_remaining_balance": 1500.00,
    "average_remaining_balance": 500.00
  },
  "payments": {
    "count": 15,
    "total_amount": 5250.00
  }
}
```

---

### 3. Active Loans Breakdown

**Endpoint:** `GET /reports/active-loans-breakdown`

**Authentication Required:** Yes (Admin, Manager)

**Description:** Get detailed breakdown of all active loans within a date range.

**Parameters:**

| Name | Type | Required | Format | Description |
|------|------|----------|--------|-------------|
| startDate | string | Yes | YYYY-MM-DD | Loan creation date range start |
| endDate | string | Yes | YYYY-MM-DD | Loan creation date range end |

**Example Response:**

```json
{
  "count": 2,
  "loans": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "transaction_number": "TXN-2024-001",
      "loan_amount": 1000.00,
      "interest_amount": 100.00,
      "total_payable": 1100.00,
      "remaining_balance": 500.00,
      "issued_date": "2024-01-15",
      "due_date": "2024-02-15",
      "status": "active"
    }
  ]
}
```

---

### 4. Due Loans Breakdown

**Endpoint:** `GET /reports/due-loans-breakdown`

**Authentication Required:** Yes (Admin, Manager)

**Description:** Get detailed breakdown of all due/overdue loans within a date range.

**Parameters:**

| Name | Type | Required | Format | Description |
|------|------|----------|--------|-------------|
| startDate | string | Yes | YYYY-MM-DD | Due date range start |
| endDate | string | Yes | YYYY-MM-DD | Due date range end |

**Example Response:**

```json
{
  "count": 1,
  "loans": [
    {
      "id": 3,
      "customer_name": "Michael Johnson",
      "transaction_number": "TXN-2024-003",
      "loan_amount": 1500.00,
      "interest_amount": 150.00,
      "total_payable": 1650.00,
      "remaining_balance": 1650.00,
      "issued_date": "2024-10-15",
      "due_date": "2024-11-15",
      "days_overdue": 16,
      "status": "active"
    }
  ]
}
```

---

## Rate Limiting

API endpoints are rate limited:
- **Limit:** 100 requests per 15 minutes per IP
- **Status:** 429 when limit exceeded

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-01 | Initial API documentation |

---

**Last Updated:** 2025-12-01
