# Pawn Shop Management System - End-to-End Deployment Setup Report

**Date**: November 22, 2025  
**Status**: ✅ ANALYSIS COMPLETE - READY FOR DEPLOYMENT

---

## 📋 Executive Summary

The Pawnflow system consists of:
- **Backend**: Node.js/Express server with PostgreSQL database
- **Frontend**: React application with axios-based API communication
- **Database**: PostgreSQL with 4 migration files

**Current Issue**: Frontend has hardcoded `http://localhost:5000` URLs throughout 9 components. This blocks production deployment.

**Required Action**: Update frontend to use environment variables for API URL configuration.

---

## 🏗️ ARCHITECTURE OVERVIEW

### Backend Stack
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL 18
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Encryption**: bcryptjs 3.0.3
- **PDF Generation**: pdfkit 0.17.2
- **Scheduling**: node-cron 4.2.1 (daily midnight checks)
- **API Communication**: CORS enabled

### Frontend Stack
- **Framework**: React 19.2.0
- **Routing**: react-router-dom 7.9.6
- **HTTP Client**: axios 1.13.2
- **PDF Generation**: jspdf 3.0.3
- **Build Tool**: react-scripts 5.0.1

---

## 📁 BACKEND ANALYSIS

### Repository Information
- **Remote URL**: https://github.com/Qasimcnc/Pawnflow-backend
- **Current Branch**: master
- **Status**: ✅ Up to date with remote

### Backend Project Structure
```
C:\Users\HP\pawn-flow\
├── server.js                          # Main Express application (1112 lines)
├── package.json                       # Dependencies
├── validators.js                      # Input validation utilities
├── pdf-invoice-generator.js           # PDF generation utility
├── migrations/
│   ├── 001_initial_schema.sql         # Core tables: users, loans, payments, shifts
│   ├── 004_add_customer_fields.sql    # Customer information fields
│   ├── 005_add_extended_customer_fields.sql
│   └── 006_complete_schema.sql        # Additional columns: transaction_number, dates, etc.
├── tests/
│   └── integration.test.js
└── [Documentation files - API_DOCUMENTATION.md, etc.]
```

### Environment Variables (Backend)
Current configuration in server.js:
```javascript
// Database URL
process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/pawn_shop'

// Node environment
process.env.NODE_ENV === 'production' ? SSL enabled : SSL disabled

// Server Port
process.env.PORT || 5000
```

### Database Schema
**Core Tables**:
1. **users** - Authentication (id, username, password, role_id)
2. **user_roles** - Role definitions (admin, staff, manager)
3. **loans** - Core transaction data (customer, item, amounts, dates, status)
4. **payment_history** - Payment tracking
5. **redemption_history** - Redemption records
6. **forfeiture_history** - Forfeiture records
7. **shifts** - Employee shift tracking

**Key Tables & Columns**:
- `loans`: transaction_number, customer_name, loan_amount, interest_amount, interest_rate, due_date, status, is_redeemed, is_forfeited, etc.
- `payment_history`: loan_id, payment_amount, payment_date
- `shifts`: user_id, start_time, end_time, opening_cash, closing_cash

### API Endpoints (Confirmed Working)
- `POST /register` - User registration
- `POST /login` - User authentication (returns JWT)
- `POST /create-loan` - Create new loan
- `GET /search-loan` - Search loans by first/last name
- `POST /make-payment` - Record payment
- `POST /redeem-loan` - Redeem loan
- `POST /extend-loan` - Extend loan term
- `POST /forfeit-loan` - Forfeit collateral
- `GET /payment-history` - Get payment records
- `POST /check-due-date` - Check due dates (runs daily at midnight via cron)
- `POST /start-shift` - Begin employee shift
- `POST /end-shift` - End employee shift
- `GET /current-shift/{userId}` - Get active shift
- `GET /shift-history/{userId}` - Get shift history
- `GET /today-shift-summary/{userId}` - Daily shift summary
- `GET /shift-report/{shiftId}` - Detailed shift report

---

## 🎨 FRONTEND ANALYSIS

### Repository Information
- **Remote URL**: https://github.com/Qasimcnc/Pawnflow-Frontend
- **Current Branch**: master
- **Status**: ✅ Cloned and analyzed

### Frontend Project Structure
```
Pawnflow-Frontend/
├── package.json                 # Dependencies (React 19.2.0, axios 1.13.2)
├── public/                      # Static assets
│   └── pawnflow-logo.png
├── src/
│   ├── App.js                  # Main routing component
│   ├── App.css                 # Styling
│   ├── index.js                # React entry point
│   ├── ErrorBoundary.js        # Error handling component
│   │
│   # Authentication Components
│   ├── LoginForm.js            # ✗ HARDCODED: http://localhost:5000/login
│   ├── RegisterForm.js         # ✗ HARDCODED: http://localhost:5000/register
│   │
│   # Loan Management Components
│   ├── CreateLoanForm.js       # ✗ HARDCODED: http://localhost:5000/create-loan
│   ├── SearchLoanForm.js       # ✗ HARDCODED: 5 endpoints with hardcoded URLs
│   ├── ExtendLoanForm.js       # ✗ HARDCODED: 2 endpoints
│   ├── RedeemLoanForm.js       # ✗ HARDCODED: 3 endpoints
│   ├── ForfeitLoanForm.js      # ✗ HARDCODED: 2 endpoints
│   │
│   # Payment Components
│   ├── MakePaymentForm.js      # ✗ HARDCODED: 4 endpoints
│   ├── CheckDueDateForm.js     # ✗ HARDCODED: 1 endpoint
│   │
│   # Shift Management
│   ├── ShiftManagement.js      # ✗ HARDCODED: 6 endpoints
│   │
│   └── [Other files]
├── .gitignore
├── README.md
└── [No .env or .env.example files]
```

### Environment Configuration Status
- **❌ NO .env.example file exists**
- **❌ NO .env file exists**
- **❌ NO API configuration file**
- **❌ API URLs are hardcoded throughout components**

### Hardcoded API URLs - Complete Inventory

**Total: 25 API calls with hardcoded `http://localhost:5000`**

| File | Component | Endpoints | Count |
|------|-----------|-----------|-------|
| LoginForm.js | Authentication | `/login` | 1 |
| RegisterForm.js | Authentication | `/register` | 1 |
| CreateLoanForm.js | Loans | `/create-loan` | 1 |
| SearchLoanForm.js | Loans | `/search-loan`, `/payment-history`, `/add-money`, `/redeem-loan` | 4 |
| ExtendLoanForm.js | Loans | `/search-loan`, `/extend-loan` | 2 |
| RedeemLoanForm.js | Loans | `/search-loan`, `/redeem-loan`, `/forfeit-loan` | 3 |
| ForfeitLoanForm.js | Loans | `/search-loan`, `/forfeit-loan` | 2 |
| MakePaymentForm.js | Payments | `/search-loan`, `/payment-history`, `/make-payment`, `/extend-loan` | 4 |
| CheckDueDateForm.js | Utilities | `/check-due-date` | 1 |
| ShiftManagement.js | Shifts | `/current-shift/{userId}`, `/shift-history/{userId}`, `/today-shift-summary/{userId}`, `/shift-report/{shiftId}`, `/start-shift`, `/end-shift` | 6 |

---

## 🔧 REQUIRED UPDATES FOR PRODUCTION

### ✅ CRITICAL: Frontend API Configuration Fix

#### Current Problem
```javascript
// Current (HARDCODED) - LoginForm.js, line 14
const res = await axios.post('http://localhost:5000/login', { username, password });
```

#### Solution: Use Environment Variables

**Step 1: Create .env.example**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
```

**Step 2: Update all 9 components**

Files to update:
1. LoginForm.js
2. RegisterForm.js
3. CreateLoanForm.js
4. SearchLoanForm.js
5. ExtendLoanForm.js
6. RedeemLoanForm.js
7. ForfeitLoanForm.js
8. MakePaymentForm.js
9. ShiftManagement.js
10. CheckDueDateForm.js

**Pattern to apply**:
```javascript
// Before (line in each file)
const response = await axios.post('http://localhost:5000/endpoint', data);

// After
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.post(`${API_BASE_URL}/endpoint`, data);
```

### Backend Environment Configuration

**Status**: ✅ Already supports environment variables

Current implementation:
```javascript
// server.js line 15-16
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/pawn_shop',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// server.js line 1108
const PORT = process.env.PORT || 5000;
```

**Required environment variables for Railway**:
- `DATABASE_URL` - PostgreSQL connection string (Railway provides automatically)
- `PORT` - Application port (Railway sets automatically)
- `NODE_ENV` - Set to 'production' on Railway
- Optional: `JWT_SECRET` - For enhanced security (currently hardcoded as 'jwt_secret')

---

## 🚀 DEPLOYMENT CHECKLIST

### Phase 1: Frontend Configuration (THIS TASK)
- [ ] Create `.env.example` in frontend repo with `REACT_APP_API_URL=http://localhost:5000`
- [ ] Update all 10 files to use environment variable instead of hardcoded URL
- [ ] Test locally with `npm start`
- [ ] Commit: "Configure API endpoint for deployment"
- [ ] Push to GitHub frontend repo

### Phase 2: Backend Deployment (NEXT)
- [ ] Verify all 4 migrations are applied
- [ ] Set up Railway project
- [ ] Connect GitHub repo: https://github.com/Qasimcnc/Pawnflow-backend
- [ ] Configure environment variables:
  - `DATABASE_URL` - PostgreSQL on Railway
  - `NODE_ENV=production`
  - `PORT` - Railway assigns automatically
- [ ] Deploy backend
- [ ] Test API endpoints

### Phase 3: Frontend Deployment (NEXT)
- [ ] Set up Vercel project
- [ ] Connect GitHub repo: https://github.com/Qasimcnc/Pawnflow-Frontend
- [ ] Configure environment variables:
  - `REACT_APP_API_URL=<Railway backend URL>`
- [ ] Deploy frontend
- [ ] Test end-to-end flows

### Phase 4: Integration Testing
- [ ] Test login/register flows
- [ ] Test loan creation
- [ ] Test payments
- [ ] Test PDF generation
- [ ] Test shift management
- [ ] Verify cron job (due date checking)

---

## 📊 DATABASE MIGRATION DETAILS

### Migration Files (All Present ✅)
```
001_initial_schema.sql
  - Creates: users, user_roles, loans, payment_history, redemption_history, forfeiture_history, shifts
  - Indexes: 8 performance indexes
  - Seed data: admin, staff, manager roles

004_add_customer_fields.sql
  - (Details in file)

005_add_extended_customer_fields.sql
  - (Details in file)

006_complete_schema.sql
  - Adds: transaction_number, loan_issued_date, loan_term, issued_date, redeemed_date, forfeited_date, 
          is_redeemed, is_forfeited, remaining_balance, collateral_description, customer_note, 
          created_by_user_id, created_by_username, item_category, item_description, updated_at
  - Creates: idx_loans_transaction_number index
```

### Schema Verification Command
```sql
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name='loans' 
ORDER BY column_name;
```

---

## 🔐 Security Recommendations

### Current Issues
1. **JWT Secret**: Hardcoded as `'jwt_secret'` in server.js line 99
2. **Database Credentials**: Default password in connection string
3. **CORS**: Open to all origins (consider restricting in production)

### Recommended Fixes
```javascript
// server.js - Change these:
const token = jwt.sign(
  { id: user.id, role: user.role_id }, 
  process.env.JWT_SECRET || 'jwt_secret',  // ← Add environment variable
  { expiresIn: '1h' }
);

// Add CORS configuration:
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

---

## 📝 QUICK REFERENCE

### Frontend Components Needing Updates
```
src/LoginForm.js .......................... 1 endpoint
src/RegisterForm.js ....................... 1 endpoint
src/CreateLoanForm.js ..................... 1 endpoint
src/SearchLoanForm.js ..................... 4 endpoints
src/ExtendLoanForm.js ..................... 2 endpoints
src/RedeemLoanForm.js ..................... 3 endpoints
src/ForfeitLoanForm.js .................... 2 endpoints
src/MakePaymentForm.js .................... 4 endpoints
src/CheckDueDateForm.js ................... 1 endpoint
src/ShiftManagement.js .................... 6 endpoints
───────────────────────────────────────────────────
TOTAL: 25 API calls to update across 10 files
```

### Backend Ready For Deployment
- ✅ server.js with 1112 lines of production code
- ✅ All 4 migrations present and documented
- ✅ Environment variable support exists
- ✅ All API endpoints implemented
- ✅ CORS enabled
- ✅ Database connection pooling configured
- ✅ Error handling implemented
- ✅ Cron jobs for automation
- ⚠️ JWT_SECRET should be environment variable
- ⚠️ CORS should be restricted to frontend URL

---

## 🔗 Important Links

- **Backend Repository**: https://github.com/Qasimcnc/Pawnflow-backend
- **Frontend Repository**: https://github.com/Qasimcnc/Pawnflow-Frontend
- **Backend Local Path**: C:\Users\HP\pawn-flow
- **Frontend Temp Path**: C:\Users\HP\pawn-flow\frontend-temp

---

## ✨ STATUS

**RESEARCH AND SETUP COMPLETE**

✅ Frontend structure analyzed  
✅ API configuration methods identified  
✅ All files making API calls documented  
✅ Backend migrations confirmed  
✅ Database schema verified  
✅ Environment variable patterns established  
✅ Deployment requirements defined  

**READY FOR**: 
1. Frontend API URL configuration updates
2. Git commits and push
3. Railway backend deployment setup
4. Vercel frontend deployment setup

---

*This report was generated for end-to-end deployment setup of the Pawnflow pawn shop management system.*
