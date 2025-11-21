# PawnFlow Backend

A comprehensive pawn shop management system backend built with Node.js, Express, and PostgreSQL. Complete support for extended customer information fields with automatic interest calculation, flexible search, and shift management.

## Features

✅ **Loan Management**
- Create loans with extended customer fields (name, email, phone, birthdate, address, etc.)
- Server-side interest amount and total payable amount calculation
- Search loans by multiple criteria (firstName, lastName, email, phone, city, state, zipcode)
- Add money to existing loans with automatic recalculation
- Support for transaction numbers and customer notes

✅ **Customer Information**
- 12 new customer fields including email, phone, birthdate, address components
- Flexible input: accepts both camelCase and snake_case in requests
- All responses in consistent snake_case format
- Safe database migration from legacy customer_name field

✅ **Payment Tracking**
- Record customer payments with method tracking
- Track payment history by loan
- Automatic loan status updates based on payments
- Support for multiple payment methods (cash, card, check, etc.)

✅ **Loan Lifecycle**
- Active loans with automatic due date tracking
- Redeem loans (return collateral to customer)
- Forfeit loans (keep collateral)
- Automatic overdue marking when interest not paid

✅ **Shift Management**
- Start/end shifts with cash balance verification
- Automatic cash reconciliation (Opening + Payments - New Loans)
- Real-time shift summaries by user
- Detailed transaction reports per shift

✅ **User Authentication**
- JWT-based authentication with 1-hour expiration
- Secure password storage with bcryptjs
- User role management

✅ **Data Validation**
- Email format validation
- Phone number format validation (7-20 characters)
- Loan amount and term validation
- ISO 8601 date validation

## Tech Stack

- **Runtime**: Node.js v14+
- **Framework**: Express.js v5.1
- **Database**: PostgreSQL v12+
- **ORM**: Raw SQL with pg connection pooling
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Utilities**: node-cron (scheduled tasks), CORS

## Prerequisites

- Node.js v14 or higher
- PostgreSQL v12 or higher
- npm or yarn
- Git (optional, for cloning)

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/mateeque39/PawnFlow-Backend.git
cd PawnFlow-Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:
```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=pawn_shop
DB_PASSWORD=1234
DB_PORT=5432

# JWT Secret
JWT_SECRET=your_super_secret_key_here

# Server Port
PORT=5000
```

### 4. Create PostgreSQL Database

```sql
CREATE DATABASE pawn_shop;

-- Connect to the database
\c pawn_shop

-- Create necessary tables (see below)
```

### 5. Set Up Database Schema

Run the migration scripts to set up the database tables:

```bash
# Using psql command line
psql -U postgres -d pawn_shop -f migrations/001_add_shift_management.sql
psql -U postgres -d pawn_shop -f migrations/002_add_created_by_payment_history.sql
psql -U postgres -d pawn_shop -f migrations/003_add_created_by_loans.sql
psql -U postgres -d pawn_shop -f migrations/004_add_customer_fields.sql
```

Or create tables manually using the SQL commands below:

```sql
-- Users table
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO user_roles (role_name) VALUES ('admin'), ('staff'), ('manager');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES user_roles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table with customer fields
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
  status VARCHAR(50) DEFAULT 'active',
  remaining_balance DECIMAL(12, 2),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment history table
CREATE TABLE payment_history (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_method VARCHAR(50),
  payment_amount DECIMAL(12, 2),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Redeem history table
CREATE TABLE redeem_history (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  redeemed_by INTEGER REFERENCES users(id),
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shift management table
CREATE TABLE shift_management (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shift_end_time TIMESTAMP,
  opening_balance DECIMAL(12, 2),
  closing_balance DECIMAL(12, 2),
  total_payments_received DECIMAL(12, 2) DEFAULT 0,
  total_loans_given DECIMAL(12, 2) DEFAULT 0,
  expected_balance DECIMAL(12, 2),
  difference DECIMAL(12, 2),
  is_balanced BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_loans_first_name ON loans(first_name);
CREATE INDEX idx_loans_last_name ON loans(last_name);
CREATE INDEX idx_loans_email ON loans(email);
CREATE INDEX idx_loans_mobile_phone ON loans(mobile_phone);
CREATE INDEX idx_loans_transaction_number ON loans(transaction_number);
CREATE INDEX idx_shift_user_id ON shift_management(user_id);
CREATE INDEX idx_payment_created_by ON payment_history(created_by);
CREATE INDEX idx_loans_created_by ON loans(created_by);
```

### 6. Start the Server

```bash
npm start
# or
node server.js
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login and get JWT token

### Loans
- `POST /create-loan` - Create new loan
- `GET /search-loan` - Search loans
- `POST /add-money` - Add money to loan

### Payments
- `POST /make-payment` - Record payment
- `GET /payment-history` - Get payment history

### Loan Actions
- `POST /redeem-loan` - Redeem fully paid loan
- `POST /forfeit-loan` - Forfeit fully paid loan
- `POST /extend-loan` - Extend loan due date

### Shift Management
- `POST /start-shift` - Start work shift
- `GET /current-shift` - Get active shift
- `POST /end-shift` - End shift with balance verification
- `GET /shift-history` - Get all shifts
- `GET /shift-report/:shiftId` - Get shift details

## Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123",
    "role": "admin"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

### Create Loan
```bash
curl -X POST http://localhost:5000/create-loan \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "mobilePhone": "555-5678",
    "loanAmount": 500,
    "interestRate": 10,
    "loanTerm": 30,
    "loanIssuedDate": "2025-11-21",
    "userId": 1
  }'
```

### Search Loan
```bash
curl -X GET "http://localhost:5000/search-loan?firstName=Jane&lastName=Doe"
```

### Make Payment
```bash
curl -X POST http://localhost:5000/make-payment \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": 1,
    "paymentMethod": "cash",
    "paymentAmount": 250,
    "userId": 1
  }'
```

### Start Shift
```bash
curl -X POST http://localhost:5000/start-shift \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "openingBalance": 5000
  }'
```

## API Documentation

Complete API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Database Schema

### Users
```
id (PK) | username | password | role_id | created_at
```

### Loans
```
id (PK) | first_name | last_name | email | mobile_phone | loan_amount | 
interest_rate | total_payable_amount | due_date | status | created_by | created_at
```

### Payments
```
id (PK) | loan_id (FK) | payment_method | payment_amount | payment_date | created_by
```

### Shifts
```
id (PK) | user_id (FK) | shift_start_time | shift_end_time | opening_balance | 
closing_balance | is_balanced | created_at
```

## Project Structure

```
pawn-flow/
├── server.js                 # Main application file
├── validators.js             # Validation and utility functions
├── package.json              # Dependencies
├── .env                       # Environment variables (create this)
├── migrations/               # Database migrations
│   ├── 001_add_shift_management.sql
│   ├── 002_add_created_by_payment_history.sql
│   ├── 003_add_created_by_loans.sql
│   └── 004_add_customer_fields.sql
├── API_DOCUMENTATION.md      # Full API docs
└── README.md                 # This file
```

## Key Features Explained

### Automatic Cash Balance Verification
When closing a shift, the system automatically calculates:
- Expected Balance = Opening Balance + Payments Received - Loans Given
- Compares with actual closing balance entered by user
- Flags discrepancies for investigation

### Flexible Search
Search by:
- First/Last Name (partial match)
- Email (partial match)
- Mobile/Home Phone (partial match)
- Customer Number (exact match)
- Transaction Number (exact match)
- Full Customer Name (backward compatible)

### Customer Field Mapping
Requests accept both camelCase and snake_case:
- `firstName` or `first_name` → stored as `first_name`
- `lastName` or `last_name` → stored as `last_name`
- `mobilePhone` or `mobile_phone` → stored as `mobile_phone`

Responses always return snake_case for consistency.

### Data Validation
- **Names**: Required, non-empty strings
- **Email**: Valid email format if provided
- **Phone**: Valid phone format if provided
- **Amounts**: Positive numbers
- **Dates**: Valid date format
- **Term**: Non-negative integer

## Cron Jobs

### Automatic Due Date Checking
Runs every day at midnight (00:00):
- Checks all active loans with due dates passed
- If interest is paid → extends due date by 30 days
- If interest not paid → marks as overdue

## Error Handling

All errors return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Server Error

## Testing

```bash
# Run tests (if implemented)
npm test

# Run with coverage
npm run test:coverage
```

## Performance Optimization

- Database indexes on frequently searched fields
- Connection pooling via pg package
- Efficient query construction with parameterized queries
- Cron jobs for automated tasks

## Security

✅ **Password Security**: bcryptjs with salt rounds
✅ **SQL Injection Prevention**: Parameterized queries
✅ **Authentication**: JWT tokens with expiration
✅ **CORS**: Configured for frontend communication
✅ **Input Validation**: All inputs validated before processing

## Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL is running and credentials in `.env` are correct

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in `.env` or kill process using port 5000

### Database Not Found
```
Error: database "pawn_shop" does not exist
```
**Solution**: Run the SQL commands to create the database and tables

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC

## Contact

For questions or issues, please open an issue on GitHub.

---

## Version History

### v1.0.0 (2025-11-21)
- Initial release
- Core pawn shop management system
- Shift management with cash balancing
- Comprehensive customer information support
- Payment tracking and loan lifecycle management
