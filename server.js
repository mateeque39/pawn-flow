const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');
const validators = require('./validators');
const { generateLoanPDF } = require('./pdf-invoice-generator');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure CORS origins from environment or default to localhost for development
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:5000',
      'https://pawn-flow-frontend-production.up.railway.app',
      'https://pawnflowsoftware.com',
      'https://www.pawnflowsoftware.com'
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Environment', 'X-Client-Version'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// Global request timeout middleware (60 seconds for most requests, 120 for PDF operations)
app.use((req, res, next) => {
  // Set timeout based on endpoint type
  const timeout = req.path.includes('pdf') || req.path.includes('receipt') ? 120000 : 60000;
  req.setTimeout(timeout, () => {
    console.error(`⏱️  Request timeout for ${req.method} ${req.path} after ${timeout}ms`);
    res.status(408).json({ message: 'Request timeout' });
  });
  next();
});

// Configure JWT secret
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // If no JWT_SECRET is provided, generate one (for development/testing only)
  console.warn('⚠️  JWT_SECRET not set in environment. Using fallback secret (NOT SECURE FOR PRODUCTION)');
  JWT_SECRET = 'default-fallback-secret-key-this-should-be-changed-in-production-12345';
}
console.log(`✅ JWT_SECRET configured: ${JWT_SECRET.length} characters`);

// Configure port
const PORT = process.env.PORT || 5000;

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ FATAL: DATABASE_URL environment variable is not set!');
  console.error('Please configure DATABASE_URL in your environment.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,                           // Maximum pool size (reduced for stability)
  idleTimeoutMillis: 45000,         // Close idle connections after 45 seconds
  connectionTimeoutMillis: 20000,   // Fail connection attempt after 20 seconds
  statement_timeout: 20000,         // SQL statement timeout (20 seconds)
});

// Add pool error handlers
pool.on('error', (err) => {
  console.error('❌ Unexpected pool error:', err);
});

pool.on('connect', () => {
  console.log('✅ Database pool connected');
});

const cron = require('node-cron');

// This cron job will run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {  
  try {
    const result = await pool.query(
      'SELECT * FROM loans WHERE due_date <= CURRENT_DATE AND status = $1',
      ['active']
    );

    const loansDue = result.rows;

    for (let loan of loansDue) {
      const paymentResult = await pool.query(
        'SELECT SUM(payment_amount) AS total_paid FROM payment_history WHERE loan_id = $1',
        [loan.id]
      );
      const totalPaid = paymentResult.rows[0].total_paid || 0;

      if (totalPaid >= loan.interest_amount) {
        // Extend the due date by 30 days if interest is paid
        const extendedDueDate = new Date(loan.due_date);
        extendedDueDate.setDate(extendedDueDate.getDate() + 30);  // Extend by 30 days

        await pool.query(
          'UPDATE loans SET due_date = $1 WHERE id = $2 RETURNING *',
          [extendedDueDate.toISOString().slice(0, 10), loan.id]
        );
      } else {
        // If interest is not paid, mark the loan as overdue
        await pool.query(
          'UPDATE loans SET status = $1 WHERE id = $2 RETURNING *',
          ['overdue', loan.id]
        );
      }
    }
  } catch (err) {
    console.error('Error checking due date:', err);
  }
});

// ======================== MIDDLEWARE DEFINITIONS ========================

// Timeouts are managed at the pool level via connection configuration
// No per-query timeout wrapper needed

// Verify JWT token and extract user info
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.warn('⚠️  Unauthorized access attempt - no token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Use the configured JWT_SECRET from app startup, not environment variable
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET not properly configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log(`✅ Token verified for user ID: ${decoded.user_id || decoded.id}`);
    next();
  } catch (err) {
    console.warn('⚠️  Invalid token:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Check if user has admin or manager role
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // For now, we'll allow all authenticated users to access reports
    // In production, you might check req.user.role against allowedRoles
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Log the access
    console.log(`📊 Report access by user ${req.user.id} to ${req.path}`);
    next();
  };
};

// Check if user has an active shift - required for all loan/payment activities
const requireActiveShift = async (req, res, next) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user has an active shift (shift_end_time is NULL)
    // Retry up to 3 times with small delay to handle transaction delays
    let shiftCheck = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        shiftCheck = await pool.query(
          'SELECT id, shift_start_time, shift_end_time FROM shift_management WHERE user_id = $1 AND shift_end_time IS NULL ORDER BY id DESC LIMIT 1',
          [userId]
        );
        
        if (shiftCheck.rows.length > 0) {
          console.log(`✅ Active shift verified for user ${userId} - Shift ID: ${shiftCheck.rows[0].id}, Started: ${shiftCheck.rows[0].shift_start_time}`);
          return next();
        }
        
        // If no shift found and this isn't the last attempt, wait a bit and retry
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      } catch (queryErr) {
        console.error(`Query attempt ${attempt + 1} failed:`, queryErr.message);
        if (attempt === 2) throw queryErr; // Throw on final attempt
      }
    }

    // After all retries, still no shift found
    if (shiftCheck.rows.length === 0) {
      // Debug: Log recent shifts to understand why none are active
      try {
        const recentShifts = await pool.query(
          'SELECT id, shift_start_time, shift_end_time FROM shift_management WHERE user_id = $1 ORDER BY id DESC LIMIT 3',
          [userId]
        );
        console.warn(`⚠️  No active shift for user ${userId} (after 3 retries). Recent shifts:`, recentShifts.rows);
      } catch (err) {
        console.warn(`⚠️  No active shift for user ${userId} (after 3 retries). Could not fetch recent shifts:`, err.message);
      }
      
      return res.status(403).json({ 
        message: 'No active shift. Please start a shift before performing any activities.',
        code: 'NO_ACTIVE_SHIFT'
      });
    }
    
    next();
  } catch (err) {
    console.error('Error checking active shift:', err);
    res.status(500).json({ message: 'Error verifying shift status' });
  }
};

// ======================== END MIDDLEWARE DEFINITIONS ========================




// ---------------------------- REGISTER ----------------------------
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('📝 Attempting to register user:', username);
    
    // Find first available role ID (sorted ascending, so we get the lowest available)
    const rolesResult = await pool.query('SELECT id FROM user_roles ORDER BY id ASC LIMIT 1');
    let roleId = 1; // Default fallback to admin role
    
    if (rolesResult.rows.length > 0) {
      roleId = rolesResult.rows[0].id;
    }
    
    console.log(`Using role_id: ${roleId}`);
    
    const result = await pool.query(
      `INSERT INTO users (username, password, role_id) 
       VALUES ($1, $2, $3)
       RETURNING id, username, role_id`,
      [username, hashedPassword, roleId]
    );

    console.log('✅ New user registered:', { id: result.rows[0].id, username: result.rows[0].username, role_id: roleId });
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    console.error('Error details:', err);
    res.status(500).json({ message: `Error creating user: ${err.message}` });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ---------------------------- LOGIN ----------------------------
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    console.log(`📝 Login successful for user: ${username}`);
    
    const token = jwt.sign({ id: user.id, role: user.role_id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      token,
      id: user.id,
      username: user.username,
      role: user.role_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// ---------------------------- EXTEND LOAN DUE DATE ----------------------------
app.post('/extend-loan', async (req, res) => {
  const { loanId } = req.body;

  try {
    // Fetch the loan details
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1', [loanId]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const currentDate = new Date();
    const dueDate = new Date(loan.due_date);

    // Check if due date has passed
    if (currentDate > dueDate) {
      // Check if at least interest amount has been paid
      const paymentResult = await pool.query(
        'SELECT SUM(payment_amount) AS total_paid FROM payment_history WHERE loan_id = $1',
        [loanId]
      );
      const totalPaid = paymentResult.rows[0].total_paid || 0;

      if (totalPaid >= loan.interest_amount) {
        // Extend the due date by 30 days and add new interest
        dueDate.setDate(dueDate.getDate() + 30);

        // Update the loan with the new due date
        const updateQuery = `
          UPDATE loans
          SET due_date = $1
          WHERE id = $2
          RETURNING *;
        `;
        const updatedLoan = await pool.query(updateQuery, [dueDate, loanId]);

        res.status(200).json({
          message: 'Loan extended by 30 days!',
          loan: updatedLoan.rows[0],
        });
      } else {
        res.status(400).json({ message: 'Interest not paid, cannot extend loan.' });
      }
    } else {
      res.status(400).json({ message: 'Due date has not passed, no need to extend.' });
    }
  } catch (err) {
    console.error('Error extending loan:', err);
    res.status(500).json({ message: 'Error extending loan' });
  }
});



// ---------------------------- ADD MONEY TO LOAN ----------------------------
app.post('/add-money', async (req, res) => {
  const { loanId, amount } = req.body;

  try {
    // Get current loan details
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1', [loanId]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Get total payments made so far
    const paymentsResult = await pool.query(
      'SELECT SUM(payment_amount) AS total_paid FROM payment_history WHERE loan_id = $1',
      [loanId]
    );
    const totalPaid = paymentsResult.rows[0].total_paid || 0;

    // Update loan amount, recalculate interest, and total payable amount
    const newLoanAmount = parseFloat(loan.loan_amount) + parseFloat(amount);
    const newInterestAmount = (newLoanAmount * parseFloat(loan.interest_rate)) / 100;
    const newTotalPayableAmount = newLoanAmount + newInterestAmount;
    const newRemainingBalance = newTotalPayableAmount - totalPaid;

    // Update loan details in the database
    const updateLoanResult = await pool.query(
      'UPDATE loans SET loan_amount = $1, interest_amount = $2, total_payable_amount = $3, remaining_balance = $4 WHERE id = $5 RETURNING *',
      [
        newLoanAmount,
        newInterestAmount,
        newTotalPayableAmount,
        newRemainingBalance,
        loanId
      ]
    );

    res.status(200).json({
      message: 'Money added successfully and loan recalculated',
      loan: updateLoanResult.rows[0],
    });
  } catch (err) {
    console.error('Error adding money:', err);
    res.status(500).json({ message: 'Error adding money to the loan' });
  }
});



// ---------------------------- CHECK DUE DATE ----------------------------

app.post('/check-due-date', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM loans WHERE due_date <= CURRENT_DATE AND status = $1',
      ['active']
    );

    const loansDue = result.rows;

    for (let loan of loansDue) {
      const paymentResult = await pool.query(
        'SELECT SUM(payment_amount) AS total_paid FROM payment_history WHERE loan_id = $1',
        [loan.id]
      );
      const totalPaid = paymentResult.rows[0].total_paid || 0;

      if (totalPaid >= loan.interest_amount) {
        // If interest is paid, extend due date by 30 days
        const extendedDueDate = new Date(loan.due_date);
        extendedDueDate.setDate(extendedDueDate.getDate() + 30);

        await pool.query(
          'UPDATE loans SET due_date = $1 WHERE id = $2 RETURNING *',
          [extendedDueDate.toISOString().slice(0, 10), loan.id]
        );
      } else {
        // If interest is not paid, mark the loan as overdue
        await pool.query(
          'UPDATE loans SET status = $1 WHERE id = $2 RETURNING *',
          ['overdue', loan.id]
        );
      }
    }

    res.status(200).json({ message: 'Due date check completed successfully' });
  } catch (err) {
    console.error('Error checking due date:', err);
    res.status(500).json({ message: 'Error checking due date' });
  }
});

// ---------------------------- PAYMENT HISTORY ----------------------------

// ---------------------------- PAYMENT HISTORY ----------------------------
// ---------------------------- PAYMENT HISTORY ----------------------------
app.get('/payment-history', async (req, res) => {
  const { loanId } = req.query;  // Expect loanId as a query parameter

  try {
    // Check if loanId is provided
    if (!loanId || loanId.trim() === '') {
      return res.status(400).json({ message: 'Loan ID is required' });
    }

    // Validate that loanId is a valid number
    const parsedLoanId = parseInt(loanId, 10);
    if (isNaN(parsedLoanId)) {
      return res.status(400).json({ message: 'Loan ID must be a valid number' });
    }

    // Query the payment history for the specified loan
    const result = await pool.query(
      'SELECT * FROM payment_history WHERE loan_id = $1 ORDER BY payment_date DESC',
      [parsedLoanId]
    );

    // If no payments found, return an empty array instead of throwing a 404 error
    if (result.rows.length === 0) {
      return res.json([]);  // Return an empty array
    }

    // Return the payment history
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching payment history:', err);
    res.status(500).json({ message: 'Error fetching payment history', error: err.message });
  }
});








// ---------------------------- CREATE LOAN ----------------------------
app.post('/create-loan', authenticateToken, requireActiveShift, async (req, res) => {
  try {
    // Map request body (handles both camelCase and snake_case)
    const mapped = validators.mapRequestToDb(req.body);
    
    console.log('📝 [/create-loan] Mapped request body:');
    console.log('   first_name:', mapped.first_name);
    console.log('   last_name:', mapped.last_name);
    console.log('   email:', mapped.email);

    // Extract all customer and loan fields
    const {
      first_name,
      last_name,
      email,
      home_phone,
      mobile_phone,
      birthdate,
      id_type,
      id_number,
      referral,
      identification_info,
      street_address,
      city,
      state,
      zipcode,
      customer_number,
      loan_amount: loanAmount,
      interest_rate: interestRate,
      interest_amount: inputInterestAmount,
      total_payable_amount: inputTotalPayableAmount,
      recurring_fee: recurringFee,
      item_category,
      item_description,
      collateral_description,
      customer_note,
      collateral_image,
      loan_issued_date: loanIssuedDate,
      due_date: inputDueDate,
      loan_term: loanTerm,
      transaction_number: inputTransactionNumber,
      previous_loan_amount: previousLoanAmount,
      user_id: userId,
      created_by_user_id: createdByUserId,
      created_by_username: createdByUsername,
    } = mapped;

    // Validate required customer fields
    const nameValidation = validators.validateNames(first_name, last_name);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.error });
    }

    // Validate loan amounts
    const amountValidation = validators.validateLoanAmounts(loanAmount, interestRate, loanTerm);
    if (!amountValidation.valid) {
      return res.status(400).json({ message: amountValidation.error });
    }

    // Validate optional customer fields
    const customerFieldsValidation = validators.validateCustomerFields({
      email,
      home_phone,
      mobile_phone,
      birthdate,
      loan_issued_date: loanIssuedDate,
      due_date: inputDueDate,
    });

    if (!customerFieldsValidation.valid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: customerFieldsValidation.errors 
      });
    }

    // Calculate loan totals
    const totalLoanAmount = parseFloat(previousLoanAmount || 0) + parseFloat(loanAmount);
    const calculatedInterestAmount = parseFloat(inputInterestAmount) || 
      (totalLoanAmount * parseFloat(interestRate)) / 100;
    const calculatedRecurringFee = parseFloat(recurringFee) || 0;
    const calculatedTotalPayableAmount = parseFloat(inputTotalPayableAmount) || 
      (totalLoanAmount + calculatedInterestAmount + calculatedRecurringFee);

    // Calculate or use provided due date
    let dueDate;
    if (inputDueDate) {
      dueDate = inputDueDate;
    } else {
      const issued = new Date(loanIssuedDate || new Date());
      const due = new Date(issued);
      due.setDate(due.getDate() + parseInt(loanTerm));
      dueDate = due.toISOString().slice(0, 10);
    }

    // Generate or use provided transaction number
    const transactionNumber = inputTransactionNumber || Math.floor(Math.random() * 1000000000).toString();

    // Step 1: Find or create customer
    let customerId = null;
    
    // Try to find existing customer by email (most reliable)
    if (email) {
      const existingCustomer = await pool.query(
        'SELECT id FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [email]
      );
      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
        console.log('✅ Found existing customer by email:', customerId);
      }
    }
    
    // If not found by email, try mobile phone
    if (!customerId && mobile_phone) {
      const existingCustomer = await pool.query(
        'SELECT id FROM customers WHERE mobile_phone = $1 LIMIT 1',
        [mobile_phone]
      );
      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
        console.log('✅ Found existing customer by mobile phone:', customerId);
      }
    }

    // If customer not found, create a new one
    if (!customerId) {
      console.log('📝 Creating new customer for loan...');
      const newCustomer = await pool.query(
        `INSERT INTO customers (
          first_name, last_name, email, home_phone, mobile_phone, birthdate,
          id_type, id_number, referral, identification_info, street_address, city, state, zipcode,
          customer_number, created_by_user_id, created_by_username
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id`,
        [
          first_name,
          last_name,
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
          createdByUserId || userId || null,
          createdByUsername || null
        ]
      );
      customerId = newCustomer.rows[0].id;
      console.log('✅ Created new customer:', customerId);
    }

    // Step 2: Insert loan with customer_id
    const generatedCustomerName = `${first_name} ${last_name}`;
    console.log('✅ Inserting loan with customer_name:', generatedCustomerName);
    
    const result = await pool.query(
      `INSERT INTO loans (
        customer_id, first_name, last_name, email, home_phone, mobile_phone, birthdate,
        id_type, id_number, referral, identification_info, street_address, city, state, zipcode,
        customer_number, loan_amount, interest_rate, interest_amount, total_payable_amount, recurring_fee,
        item_category, item_description, collateral_description, customer_note, collateral_image, transaction_number,
        loan_issued_date, loan_term, due_date,
        status, remaining_balance, created_by, created_by_user_id, created_by_username, customer_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37)
      RETURNING *`,
      [
        customerId,
        first_name,
        last_name,
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
        totalLoanAmount,
        interestRate,
        calculatedInterestAmount,
        calculatedTotalPayableAmount,
        calculatedRecurringFee,
        item_category || null,
        item_description || null,
        collateral_description || null,
        customer_note || null,
        collateral_image || null,
        transactionNumber,
        loanIssuedDate || new Date().toISOString().slice(0, 10),
        loanTerm,
        dueDate,
        'active',
        calculatedTotalPayableAmount,
        userId || createdByUserId || null,
        createdByUserId || userId || null,
        createdByUsername || null,
        generatedCustomerName
      ]
    );

    const loan = result.rows[0]; // Bypass formatter for now

    res.status(201).json({ 
      loan,
      pdf_url: `/loan-pdf/${result.rows[0].id}`
    });
  } catch (err) {
    console.error('Error creating loan:', err);
    res.status(500).json({ message: 'Error creating loan', error: err.message });
  }
});



// ---------------------------- SEARCH LOAN ----------------------------
app.get('/search-loan', async (req, res) => {
  try {
    // Accept both camelCase and snake_case query parameters
    const firstName = req.query.firstName || req.query.first_name;
    const lastName = req.query.lastName || req.query.last_name;
    const customerNumber = req.query.customerNumber || req.query.customer_number;
    const email = req.query.email;
    const transactionNumber = req.query.transactionNumber || req.query.transaction_number;
    const mobilePhone = req.query.mobilePhone || req.query.mobile_phone;
    const homePhone = req.query.homePhone || req.query.home_phone;
    const customerName = req.query.customerName || req.query.customer_name;
    const city = req.query.city;
    const state = req.query.state;
    const zipcode = req.query.zipcode;

    // Build dynamic query
    let query = 'SELECT * FROM loans WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Search by first name
    if (firstName) {
      params.push(`%${firstName}%`);
      query += ` AND first_name ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Search by last name
    if (lastName) {
      params.push(`%${lastName}%`);
      query += ` AND last_name ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Search by customer number
    if (customerNumber) {
      params.push(`%${customerNumber}%`);
      query += ` AND customer_number ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Search by email
    if (email) {
      params.push(`%${email}%`);
      query += ` AND email ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Search by transaction number (exact match)
    if (transactionNumber) {
      params.push(transactionNumber);
      query += ` AND transaction_number = $${paramIndex}`;
      paramIndex++;
    }

    // Search by mobile phone
    if (mobilePhone) {
      params.push(`%${mobilePhone}%`);
      query += ` AND mobile_phone ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Search by home phone
    if (homePhone) {
      params.push(`%${homePhone}%`);
      query += ` AND home_phone ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Search by city
    if (city) {
      params.push(`%${city}%`);
      query += ` AND city ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Search by state
    if (state) {
      params.push(`%${state}%`);
      query += ` AND state ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Search by zipcode
    if (zipcode) {
      params.push(`%${zipcode}%`);
      query += ` AND zipcode ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // Fallback: search by full customer_name (backward compatibility)
    if (customerName && !firstName && !lastName) {
      params.push(`%${customerName}%`);
      query += ` AND customer_name ILIKE $${paramIndex}`;
      paramIndex++;
    }

    // If no search criteria provided, return error
    if (params.length === 0) {
      return res.status(400).json({ message: 'At least one search criteria is required' });
    }

    // Execute query
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No loans found' });
    }

    // Format response with snake_case fields and add PDF links
    const formattedLoans = result.rows.map(loan => ({
      ...validators.formatLoanResponse(loan),
      pdf_url: `/loan-pdf/${loan.id}`
    }));

    res.json(formattedLoans);
  } catch (err) {
    console.error('Error searching loans:', err);
    res.status(500).json({ message: 'Error searching loans', error: err.message });
  }
});


// ---------------------------- MAKE PAYMENT ----------------------------
app.post('/make-payment', authenticateToken, requireActiveShift, async (req, res) => {
  const { loanId, paymentMethod, paymentAmount, userId } = req.body;

  try {
    // Fetch the loan details
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1', [loanId]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Update remaining balance after payment
    const newRemainingBalance = parseFloat(loan.remaining_balance) - parseFloat(paymentAmount);

    // Update the loan details with the new remaining balance
    const updatedLoanResult = await pool.query(
      'UPDATE loans SET remaining_balance = $1 WHERE id = $2 RETURNING *',
      [Math.max(newRemainingBalance, 0), loanId]  // Ensure it doesn't go negative
    );

    // Insert payment history
    const paymentResult = await pool.query(
      'INSERT INTO payment_history (loan_id, payment_method, payment_amount, payment_date, created_by) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING *',
      [loanId, paymentMethod, paymentAmount, userId || null]
    );

    // Recalculate total payable amount (loan amount + interest)
    const newTotalPayableAmount = parseFloat(loan.loan_amount) + (parseFloat(loan.loan_amount) * parseFloat(loan.interest_rate) / 100);

    // Update total payable amount in the loan record
    await pool.query(
      'UPDATE loans SET total_payable_amount = $1 WHERE id = $2',
      [newTotalPayableAmount, loanId]
    );

    // Check if the loan is fully paid
    if (newRemainingBalance === 0) {
      res.status(200).json({
        message: 'Loan fully paid off! Ready for redemption.',
        loan: updatedLoanResult.rows[0],
        paymentHistory: paymentResult.rows[0],
      });
    } else {
      // If not fully paid, return the updated loan and payment details
      res.status(200).json({
        message: 'Payment successfully processed!',
        loan: updatedLoanResult.rows[0],
        paymentHistory: paymentResult.rows[0],
      });
    }
  } catch (err) {
    console.error('Error making payment:', err);
    res.status(500).json({ message: 'Error making payment' });
  }
});






// ---------------------------- REDEEM LOAN ----------------------------


app.post('/redeem-loan', requireActiveShift, async (req, res) => {
  const { loanId, userId } = req.body;

  try {
    // Get the loan details
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1', [loanId]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Log loan details for debugging
    console.log('Loan found:', loan);

    // Use the remaining balance that's maintained with each payment
    const remainingBalance = parseFloat(loan.remaining_balance || 0);

    // Log remaining balance calculation for debugging
    console.log(`Remaining Balance: ${remainingBalance}`);

    // If the remaining balance is greater than 0, return an error
    if (remainingBalance > 0) {
      return res.status(400).json({ message: 'Loan is not fully paid, cannot redeem.' });
    }

    // Ensure the loan is not already redeemed
    if (loan.status === 'redeemed') {
      return res.status(400).json({ message: 'Loan has already been redeemed.' });
    }

    // Redeem the loan (update status to 'redeemed')
    const updatedLoan = await pool.query(
      'UPDATE loans SET status = $1 WHERE id = $2 RETURNING *',
      ['redeemed', loanId]
    );

    // Add to redeem history (if table exists)
    try {
      await pool.query(
        'INSERT INTO redeem_history (loan_id, redeemed_by) VALUES ($1, $2) RETURNING *',
        [loanId, userId]
      );
    } catch (historyErr) {
      console.warn('Warning: Could not insert redeem history:', historyErr.message);
      // Continue even if history insert fails - the main redeem is successful
    }

    res.status(200).json({
      message: 'Loan redeemed successfully!',
      loan: updatedLoan.rows[0],
    });
  } catch (err) {
    console.error('Error redeeming loan:', err);
    res.status(500).json({ message: 'Error redeeming loan.' });
  }
});








// ---------------------------- FORFEIT LOAN ----------------------------


// Forfeit Loan route
app.post('/forfeit-loan', requireActiveShift, async (req, res) => {
  const { loanId, userId } = req.body;

  try {
    // Check if the loan exists and if it is active
    const loanQuery = 'SELECT * FROM loans WHERE id = $1';
    const loanResult = await pool.query(loanQuery, [loanId]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found.' });
    }

    if (loan.status === 'redeemed' || loan.status === 'forfeited') {
      return res.status(400).json({ message: 'Loan is already redeemed or forfeited.' });
    }

    // Check forfeit conditions:
    // 1. Due date must be passed (past today)
    // 2. Remaining balance must be less than interest amount OR equal to 0
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(loan.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const isDueDatePassed = dueDate < today;
    const remainingBalance = parseFloat(loan.remaining_balance || 0);
    const interestAmount = parseFloat(loan.interest_amount || 0);
    const isBalanceLessThanInterest = remainingBalance < interestAmount || remainingBalance === 0;
    
    if (!isDueDatePassed) {
      return res.status(400).json({ message: 'Cannot forfeit: Loan due date has not passed yet.' });
    }
    
    if (!isBalanceLessThanInterest) {
      return res.status(400).json({ message: 'Cannot forfeit: Remaining balance must be less than interest amount or zero.' });
    }

    // Update loan status to 'forfeited'
    const updateQuery = 'UPDATE loans SET status = $1 WHERE id = $2 RETURNING *';
    const updatedLoan = await pool.query(updateQuery, ['forfeited', loanId]);

    // Add to forfeit history (similar to redeem history)
    const forfeitHistoryQuery = 'INSERT INTO redeem_history (loan_id, redeemed_by) VALUES ($1, $2) RETURNING *';
    const forfeitHistory = await pool.query(forfeitHistoryQuery, [loanId, userId]);

    return res.status(200).json({
      message: 'Loan forfeited successfully!',
      loan: updatedLoan.rows[0],
      forfeitHistory: forfeitHistory.rows[0],
    });
  } catch (error) {
    console.error('Error forfeiting loan:', error);
    return res.status(500).json({ message: 'Error forfeiting loan.' });
  }
});


// ======================== LOAN REACTIVATION ========================

// REACTIVATE FORFEITED LOAN - Reactivate a forfeited loan back to active status
app.post('/loans/:loanId/reactivate', async (req, res) => {
  const { loanId } = req.params;
  const { reactivatedByUserId, reactivatedByUsername, reactivationDate } = req.body;

  try {
    // Validate loanId
    const loanIdNum = parseInt(loanId, 10);
    if (isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid loan ID' });
    }

    // Fetch the loan
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1', [loanIdNum]);
    
    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = loanResult.rows[0];

    // Check if loan is forfeited
    if (loan.status !== 'forfeited' && loan.status !== 'FORFEITED') {
      return res.status(400).json({ message: 'Loan is not forfeited and cannot be reactivated' });
    }

    // Update loan status to active and record reactivation metadata
    const reactivationTime = reactivationDate || new Date().toISOString();
    const updateQuery = `
      UPDATE loans 
      SET status = 'active',
          reactivated_at = $1,
          reactivated_by_user_id = $2,
          reactivated_by_username = $3
      WHERE id = $4
      RETURNING *
    `;

    const updatedLoanResult = await pool.query(updateQuery, [
      reactivationTime,
      reactivatedByUserId || null,
      reactivatedByUsername || null,
      loanIdNum
    ]);

    const updatedLoan = updatedLoanResult.rows[0];

    // Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_log (action_type, user_id, username, loan_id, timestamp, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'REACTIVATE_LOAN',
          reactivatedByUserId || null,
          reactivatedByUsername || null,
          loanIdNum,
          reactivationTime,
          JSON.stringify({ status: loan.status }),
          JSON.stringify({ status: 'active' })
        ]
      );
    } catch (auditErr) {
      console.warn('Failed to create audit log entry:', auditErr);
      // Don't fail the request if audit log fails
    }

    res.status(200).json({
      message: 'Loan reactivated successfully!',
      loan: validators.formatLoanResponse(updatedLoan),
      reactivationMetadata: {
        reactivatedAt: reactivationTime,
        reactivatedByUserId: reactivatedByUserId,
        reactivatedByUsername: reactivatedByUsername
      }
    });
  } catch (err) {
    console.error('Error reactivating loan:', err);
    res.status(500).json({ message: 'Error reactivating loan', error: err.message });
  }
});

// ======================== END LOAN REACTIVATION ========================

// ======================== LOAN VOID/DELETE ========================

// VOID LOAN - Delete a loan (for correcting mistakes during creation)
app.delete('/customers/:customerId/loans/:loanId/void', async (req, res) => {
  const { customerId, loanId } = req.params;
  const { voidedByUserId, voidedByUsername, voidDate } = req.body || {};

  try {
    // Validate IDs
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);
    if (isNaN(customerIdNum) || isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid customer ID or loan ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [customerIdNum]
    );
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch the loan
    const loanResult = await pool.query(
      'SELECT * FROM loans WHERE id = $1 AND customer_id = $2',
      [loanIdNum, customerIdNum]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    const loan = loanResult.rows[0];

    // Create audit log entry before deletion (optional - don't fail if it fails)
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO audit_log (action_type, user_id, username, loan_id, timestamp, old_values)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            'VOID_LOAN',
            voidedByUserId || null,
            voidedByUsername || null,
            loanIdNum,
            voidDate || new Date().toISOString(),
            JSON.stringify({
              id: loan.id,
              transaction_number: loan.transaction_number,
              customer_id: loan.customer_id,
              loan_amount: loan.loan_amount,
              status: loan.status,
              created_at: loan.created_at
            })
          ]
        );
      } catch (auditErr) {
        console.warn('Failed to create audit log entry for void (table may not exist):', auditErr.message);
        // Continue - audit_log is optional
      }
    }

    // Delete the loan (payment_history will cascade delete via foreign key)
    let deleteResult;
    try {
      deleteResult = await pool.query(
        'DELETE FROM loans WHERE id = $1 AND customer_id = $2 RETURNING *',
        [loanIdNum, customerIdNum]
      );
    } catch (deleteErr) {
      console.error('Error deleting loan:', deleteErr.message);
      return res.status(500).json({ message: 'Failed to delete loan: ' + deleteErr.message });
    }

    if (deleteResult.rows.length === 0) {
      return res.status(500).json({ message: 'Failed to delete loan' });
    }

    res.status(200).json({
      message: 'Loan voided and permanently deleted!',
      voidedLoan: {
        id: deleteResult.rows[0].id,
        transactionNumber: deleteResult.rows[0].transaction_number,
        loanAmount: deleteResult.rows[0].loan_amount,
        status: deleteResult.rows[0].status
      },
      voidMetadata: {
        voidedAt: voidDate || new Date().toISOString(),
        voidedByUserId: voidedByUserId,
        voidedByUsername: voidedByUsername
      }
    });
  } catch (err) {
    console.error('Error voiding loan:', err);
    res.status(500).json({ message: 'Error voiding loan', error: err.message });
  }
});

// ======================== END LOAN VOID/DELETE ========================

// GET CUSTOMER INFO - Retrieve customer information by transaction number
app.get('/loans/transaction/:transactionNumber', async (req, res) => {
  const { transactionNumber } = req.params;

  try {
    // Validate transactionNumber
    if (!transactionNumber || transactionNumber.trim() === '') {
      return res.status(400).json({ message: 'Transaction number is required' });
    }

    // Fetch the loan by transaction number
    const loanResult = await pool.query('SELECT * FROM loans WHERE transaction_number = $1', [transactionNumber]);

    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = loanResult.rows[0];

    res.json({
      id: loan.id,
      transactionNumber: loan.transaction_number,
      customerInfo: {
        firstName: loan.first_name || '',
        lastName: loan.last_name || '',
        homePhone: loan.home_phone || '',
        mobilePhone: loan.mobile_phone || '',
        email: loan.email || '',
        birthdate: loan.birthdate || '',
        referral: loan.referral || '',
        streetAddress: loan.street_address || '',
        city: loan.city || '',
        state: loan.state || '',
        zipcode: loan.zipcode || ''
      },
      loanDetails: {
        loanAmount: loan.loan_amount,
        interestRate: loan.interest_rate,
        interestAmount: loan.interest_amount,
        totalPayableAmount: loan.total_payable_amount,
        remainingBalance: loan.remaining_balance,
        status: loan.status,
        dueDate: loan.due_date,
        loanIssuedDate: loan.loan_issued_date
      }
    });
  } catch (err) {
    console.error('Error retrieving customer data:', err);
    res.status(500).json({ message: 'Error retrieving customer data', error: err.message });
  }
});

// UPDATE CUSTOMER INFO - Update customer information for a loan by transaction number
app.put('/loans/:transactionNumber/customer-info', async (req, res) => {
  const { transactionNumber } = req.params;
  const {
    firstName,
    lastName,
    homePhone,
    mobilePhone,
    email,
    birthdate,
    referral,
    streetAddress,
    city,
    state,
    zipcode,
    updatedByUserId,
    updatedByUsername,
    updatedAt
  } = req.body;

  try {
    // Validate transactionNumber
    if (!transactionNumber || transactionNumber.trim() === '') {
      return res.status(400).json({ message: 'Transaction number is required' });
    }

    // Fetch the loan by transaction number
    const loanResult = await pool.query('SELECT * FROM loans WHERE transaction_number = $1', [transactionNumber]);
    
    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = loanResult.rows[0];

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate birthdate format if provided
    if (birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return res.status(400).json({ message: 'Birthdate must be in YYYY-MM-DD format' });
    }

    // Validate state format if provided (2-letter code)
    if (state && !/^[A-Z]{2}$/.test(state)) {
      return res.status(400).json({ message: 'State must be a 2-letter code' });
    }

    const updateTime = updatedAt || new Date().toISOString();

    // Build update query dynamically
    const updateQuery = `
      UPDATE loans 
      SET first_name = $1,
          last_name = $2,
          home_phone = $3,
          mobile_phone = $4,
          email = $5,
          birthdate = $6,
          referral = $7,
          street_address = $8,
          city = $9,
          state = $10,
          zipcode = $11,
          customer_name = $12,
          updated_at = $13,
          updated_by_user_id = $14,
          updated_by_username = $15
      WHERE transaction_number = $16
      RETURNING *
    `;

    const updatedCustomerName = `${firstName} ${lastName}`;

    const updatedLoanResult = await pool.query(updateQuery, [
      firstName,
      lastName,
      homePhone || null,
      mobilePhone || null,
      email || null,
      birthdate || null,
      referral || null,
      streetAddress || null,
      city || null,
      state || null,
      zipcode || null,
      updatedCustomerName,
      updateTime,
      updatedByUserId || null,
      updatedByUsername || null,
      transactionNumber
    ]);

    const updatedLoan = updatedLoanResult.rows[0];

    // Create audit log entry
    try {
      const oldValues = {
        firstName: loan.first_name,
        lastName: loan.last_name,
        homePhone: loan.home_phone,
        mobilePhone: loan.mobile_phone,
        email: loan.email,
        birthdate: loan.birthdate,
        referral: loan.referral,
        streetAddress: loan.street_address,
        city: loan.city,
        state: loan.state,
        zipcode: loan.zipcode
      };

      const newValues = {
        firstName,
        lastName,
        homePhone: homePhone || null,
        mobilePhone: mobilePhone || null,
        email: email || null,
        birthdate: birthdate || null,
        referral: referral || null,
        streetAddress: streetAddress || null,
        city: city || null,
        state: state || null,
        zipcode: zipcode || null
      };

      await pool.query(
        `INSERT INTO audit_log (action_type, user_id, username, loan_id, timestamp, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'UPDATE_CUSTOMER_INFO',
          updatedByUserId || null,
          updatedByUsername || null,
          loan.id,
          updateTime,
          JSON.stringify(oldValues),
          JSON.stringify(newValues)
        ]
      );
    } catch (auditErr) {
      console.warn('Failed to create audit log entry:', auditErr);
      // Don't fail the request if audit log fails
    }

    res.status(200).json({
      message: 'Customer information updated successfully!',
      customerInfo: {
        firstName: updatedLoan.first_name,
        lastName: updatedLoan.last_name,
        homePhone: updatedLoan.home_phone,
        mobilePhone: updatedLoan.mobile_phone,
        email: updatedLoan.email,
        birthdate: updatedLoan.birthdate,
        referral: updatedLoan.referral,
        streetAddress: updatedLoan.street_address,
        city: updatedLoan.city,
        state: updatedLoan.state,
        zipcode: updatedLoan.zipcode
      },
      updateMetadata: {
        updatedAt: updateTime,
        updatedByUserId: updatedByUserId,
        updatedByUsername: updatedByUsername
      }
    });
  } catch (err) {
    console.error('Error updating customer information:', err);
    res.status(500).json({ message: 'Error updating customer information', error: err.message });
  }
});

// ======================== END CUSTOMER INFORMATION UPDATE ========================


// ======================== CUSTOMER PROFILE MANAGEMENT ========================

// CREATE CUSTOMER PROFILE - Create a new customer profile
app.post('/customers', async (req, res) => {
  try {
    const mapped = validators.mapRequestToDb(req.body);
    
    const {
      first_name,
      last_name,
      email,
      home_phone,
      mobile_phone,
      birthdate,
      id_type,
      id_number,
      referral,
      identification_info,
      street_address,
      city,
      state,
      zipcode,
      customer_number,
      created_by_user_id,
      created_by_username
    } = mapped;

    // Validate required fields
    const nameValidation = validators.validateNames(first_name, last_name);
    if (!nameValidation.valid) {
      return res.status(400).json({ message: nameValidation.error });
    }

    // Validate optional customer fields
    const customerFieldsValidation = validators.validateCustomerFields({
      email,
      home_phone,
      mobile_phone,
      birthdate
    });

    if (!customerFieldsValidation.valid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: customerFieldsValidation.errors 
      });
    }

    // Insert customer profile
    const result = await pool.query(
      `INSERT INTO customers (
        first_name, last_name, email, home_phone, mobile_phone, birthdate,
        id_type, id_number, referral, identification_info, street_address, 
        city, state, zipcode, customer_number, created_by_user_id, created_by_username
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        first_name,
        last_name,
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
        created_by_user_id || null,
        created_by_username || null
      ]
    );

    res.status(201).json({
      message: 'Customer profile created successfully',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating customer profile:', err);
    res.status(500).json({ message: 'Error creating customer profile', error: err.message });
  }
});

// GET CUSTOMER PROFILE - Search customer by phone, first name, or last name
app.get('/customers/search-phone', async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone || phone.trim() === '') {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Remove non-numeric characters for comparison
    const cleanPhone = phone.replace(/\D/g, '');

    let query = `SELECT * FROM customers WHERE 
                 REPLACE(REPLACE(REPLACE(mobile_phone, '-', ''), '(', ''), ')', '') ILIKE $1
                 OR REPLACE(REPLACE(REPLACE(home_phone, '-', ''), '(', ''), ')', '') ILIKE $2
                 ORDER BY created_at DESC`;

    const result = await pool.query(query, [`%${cleanPhone}%`, `%${cleanPhone}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No customers found with that phone number' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching customers by phone:', err);
    res.status(500).json({ message: 'Error searching customers', error: err.message });
  }
});

// GET CUSTOMER PROFILE - Search customer by name
app.get('/customers/search-name', async (req, res) => {
  try {
    const { firstName, lastName } = req.query;

    if (!firstName && !lastName) {
      return res.status(400).json({ message: 'At least first name or last name is required' });
    }

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (firstName) {
      params.push(`%${firstName}%`);
      query += ` AND first_name ILIKE $${paramIndex}`;
      paramIndex++;
    }

    if (lastName) {
      params.push(`%${lastName}%`);
      query += ` AND last_name ILIKE $${paramIndex}`;
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No customers found with that name' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching customers by name:', err);
    res.status(500).json({ message: 'Error searching customers', error: err.message });
  }
});

// GET CUSTOMER - Get customer by ID
app.get('/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ message: 'Error fetching customer', error: err.message });
  }
});

// GET CUSTOMER LOANS - Get all loans for a customer
app.get('/customers/:customerId/loans', async (req, res) => {
  try {
    const { customerId } = req.params;

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get active loans - search by customer_id
    const activeLoansResult = await pool.query(
      `SELECT id, transaction_number, loan_amount, interest_rate, interest_amount, total_payable_amount, recurring_fee, redemption_fee, remaining_balance, due_date, loan_issued_date, status, item_description, item_category, street_address, city, state, zipcode, collateral_description FROM loans WHERE customer_id = $1 AND status = 'active' ORDER BY loan_issued_date DESC`,
      [customerIdNum]
    );

    // Get redeemed loans
    const redeemedLoansResult = await pool.query(
      `SELECT id, transaction_number, loan_amount, interest_rate, interest_amount, total_payable_amount, recurring_fee, redemption_fee, remaining_balance, due_date, loan_issued_date, status, item_description, item_category, street_address, city, state, zipcode, collateral_description FROM loans WHERE customer_id = $1 AND status = 'redeemed' ORDER BY loan_issued_date DESC`,
      [customerIdNum]
    );

    // Get forfeited loans
    const forfeitedLoansResult = await pool.query(
      `SELECT id, transaction_number, loan_amount, interest_rate, interest_amount, total_payable_amount, recurring_fee, redemption_fee, remaining_balance, due_date, loan_issued_date, status, item_description, item_category, street_address, city, state, zipcode, collateral_description FROM loans WHERE customer_id = $1 AND status = 'forfeited' ORDER BY loan_issued_date DESC`,
      [customerIdNum]
    );

    // Get payment history
    const paymentHistoryResult = await pool.query(
      `SELECT ph.*, l.transaction_number, l.loan_amount
       FROM payment_history ph
       JOIN loans l ON ph.loan_id = l.id
       WHERE l.customer_id = $1
       ORDER BY ph.payment_date DESC`,
      [customerIdNum]
    );

    res.json({
      activeLoans: activeLoansResult.rows,
      redeemedLoans: redeemedLoansResult.rows,
      forfeitedLoans: forfeitedLoansResult.rows,
      paymentHistory: paymentHistoryResult.rows,
      summary: {
        totalActiveLoans: activeLoansResult.rows.length,
        totalRedeemedLoans: redeemedLoansResult.rows.length,
        totalForfeitedLoans: forfeitedLoansResult.rows.length,
        totalPayments: paymentHistoryResult.rows.length,
        totalOutstanding: activeLoansResult.rows.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance || 0), 0)
      }
    });
  } catch (err) {
    console.error('Error fetching customer loans:', err);
    res.status(500).json({ message: 'Error fetching customer loans', error: err.message });
  }
});

// GET CUSTOMER PROFILE - Search customer by phone, first name, or last name (OLD - DEPRECATED)
app.get('/customers/search', async (req, res) => {
  try {
    const { firstName, lastName, mobilePhone, homePhone, email, customerId } = req.query;

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (customerId) {
      params.push(parseInt(customerId, 10));
      query += ` AND id = $${paramIndex}`;
      paramIndex++;
    }

    if (firstName) {
      params.push(`%${firstName}%`);
      query += ` AND first_name ILIKE $${paramIndex}`;
      paramIndex++;
    }

    if (lastName) {
      params.push(`%${lastName}%`);
      query += ` AND last_name ILIKE $${paramIndex}`;
      paramIndex++;
    }

    if (mobilePhone) {
      params.push(`%${mobilePhone.replace(/\D/g, '')}%`);
      query += ` AND REPLACE(REPLACE(REPLACE(mobile_phone, '-', ''), '(', ''), ')', '') ILIKE $${paramIndex}`;
      paramIndex++;
    }

    if (homePhone) {
      params.push(`%${homePhone.replace(/\D/g, '')}%`);
      query += ` AND REPLACE(REPLACE(REPLACE(home_phone, '-', ''), '(', ''), ')', '') ILIKE $${paramIndex}`;
      paramIndex++;
    }

    if (email) {
      params.push(`%${email}%`);
      query += ` AND email ILIKE $${paramIndex}`;
      paramIndex++;
    }

    if (params.length === 0) {
      return res.status(400).json({ message: 'At least one search criteria is required' });
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No customers found' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching customers:', err);
    res.status(500).json({ message: 'Error searching customers', error: err.message });
  }
});

// GET CUSTOMER PROFILE WITH LOANS - Get customer profile and all associated loans (OLD - USE /customers/:customerId/loans instead)
app.get('/customers/:customerId/profile', async (req, res) => {
  try {
    const { customerId } = req.params;

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    // Get customer profile
    const customerResult = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [customerIdNum]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const customer = customerResult.rows[0];

    // Get active loans
    const activeLoansResult = await pool.query(
      `SELECT id, transaction_number, loan_amount, interest_rate, interest_amount, total_payable_amount, recurring_fee,
              remaining_balance, due_date, loan_issued_date, status
       FROM loans
       WHERE customer_id = $1 AND status = 'active'
       ORDER BY loan_issued_date DESC`,
      [customerIdNum]
    );

    // Get redeemed loans
    const redeemedLoansResult = await pool.query(
      `SELECT id, transaction_number, loan_amount, interest_rate, interest_amount, total_payable_amount, recurring_fee, remaining_balance, due_date, loan_issued_date, status, item_description, item_category, street_address, city, state, zipcode, collateral_description FROM loans
       WHERE customer_id = $1 AND status = 'redeemed'
       ORDER BY loan_issued_date DESC`,
      [customerIdNum]
    );

    // Get forfeited loans
    const forfeitedLoansResult = await pool.query(
      `SELECT id, transaction_number, loan_amount, interest_rate, interest_amount, total_payable_amount, recurring_fee, remaining_balance, due_date, loan_issued_date, status, item_description, item_category, street_address, city, state, zipcode, collateral_description FROM loans
       WHERE customer_id = $1 AND status = 'forfeited'
       ORDER BY loan_issued_date DESC`,
      [customerIdNum]
    );

    // Get payment history
    const paymentHistoryResult = await pool.query(
      `SELECT ph.*, l.transaction_number, l.loan_amount
       FROM payment_history ph
       JOIN loans l ON ph.loan_id = l.id
       WHERE l.customer_id = $1
       ORDER BY ph.payment_date DESC`,
      [customerIdNum]
    );

    res.json({
      customer: customer,
      activeLoans: activeLoansResult.rows,
      redeemedLoans: redeemedLoansResult.rows,
      forfeitedLoans: forfeitedLoansResult.rows,
      paymentHistory: paymentHistoryResult.rows,
      summary: {
        totalActiveLoans: activeLoansResult.rows.length,
        totalRedeemedLoans: redeemedLoansResult.rows.length,
        totalForfeitedLoans: forfeitedLoansResult.rows.length,
        totalPayments: paymentHistoryResult.rows.length,
        totalOutstanding: activeLoansResult.rows.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance || 0), 0)
      }
    });
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    res.status(500).json({ message: 'Error fetching customer profile', error: err.message });
  }
});

// UPDATE CUSTOMER PROFILE - Update customer information
app.put('/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const mapped = validators.mapRequestToDb(req.body);

    const {
      first_name,
      last_name,
      email,
      home_phone,
      mobile_phone,
      birthdate,
      id_type,
      id_number,
      referral,
      identification_info,
      street_address,
      city,
      state,
      zipcode,
      customer_number,
      profile_image,
      updated_by_user_id,
      updated_by_username
    } = mapped;

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    // Check if customer exists
    const customerCheck = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [customerIdNum]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate birthdate format if provided
    if (birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return res.status(400).json({ message: 'Birthdate must be in YYYY-MM-DD format' });
    }

    // Update customer profile
    const result = await pool.query(
      `UPDATE customers
       SET first_name = $1, last_name = $2, email = $3, home_phone = $4,
           mobile_phone = $5, birthdate = $6, id_type = $7, id_number = $8,
           referral = $9, identification_info = $10, street_address = $11,
           city = $12, state = $13, zipcode = $14, customer_number = $15,
           profile_image = $16, updated_by_user_id = $17, updated_by_username = $18, updated_at = CURRENT_TIMESTAMP
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
        profile_image || null,
        updated_by_user_id || null,
        updated_by_username || null,
        customerIdNum
      ]
    );

    res.json({
      message: 'Customer profile updated successfully',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating customer profile:', err);
    res.status(500).json({ message: 'Error updating customer profile', error: err.message });
  }
});

// ======================== END CUSTOMER PROFILE MANAGEMENT ========================

// ======================== HELPER FUNCTIONS ========================

// Ensure interest_amount is always a valid number
const ensureInterestAmount = (loan) => {
  if (!loan) return 0;
  const amount = parseFloat(loan.interest_amount);
  if (!isNaN(amount) && amount > 0) return amount;
  // Fallback: calculate from loan_amount and interest_rate
  const loanAmount = parseFloat(loan.loan_amount) || 0;
  const interestRate = parseFloat(loan.interest_rate) || 0;
  return (loanAmount * interestRate) / 100;
};

// ======================== CUSTOMER-CENTRIC LOAN MANAGEMENT ========================

// CREATE LOAN FOR CUSTOMER - POST /customers/:customerId/loans
app.post('/customers/:customerId/loans', authenticateToken, requireActiveShift, async (req, res) => {
  try {
    const { customerId } = req.params;
    const mapped = validators.mapRequestToDb(req.body);

    console.log('📝 POST /customers/:customerId/loans request:');
    console.log('   customerId:', customerId);
    console.log('   Request body:', req.body);
    console.log('   Mapped body:', mapped);

    const {
      first_name,
      last_name,
      email,
      home_phone,
      mobile_phone,
      birthdate,
      id_type,
      id_number,
      referral,
      identification_info,
      street_address,
      city,
      state,
      zipcode,
      customer_number,
      loan_amount: loanAmount,
      interest_rate: interestRate,
      interest_amount: inputInterestAmount,
      total_payable_amount: inputTotalPayableAmount,
      recurring_fee: recurringFee,
      item_category,
      item_description,
      collateral_description,
      customer_note,
      collateral_image,
      loan_issued_date: loanIssuedDate,
      due_date: inputDueDate,
      loan_term: loanTerm,
      transaction_number: inputTransactionNumber,
      previous_loan_amount: previousLoanAmount,
      user_id: userId,
      created_by_user_id: createdByUserId,
      created_by_username: createdByUsername
    } = mapped;

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    // Fetch the actual customer from the database to get their real name
    const customerResult = await pool.query(
      'SELECT id, first_name, last_name FROM customers WHERE id = $1',
      [customerIdNum]
    );
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const customer = customerResult.rows[0];
    console.log('   ✅ Found customer:', { id: customer.id, first_name: customer.first_name, last_name: customer.last_name });

    // Try to get customer name from request first, then from customer record, then fall back
    let customerFirstName = first_name || customer.first_name || 'Unknown';
    let customerLastName = last_name || customer.last_name || 'Customer';
    if (!loanAmount || isNaN(parseFloat(loanAmount)) || parseFloat(loanAmount) <= 0) {
      return res.status(400).json({ 
        message: 'loan_amount is required and must be a positive number'
      });
    }
    if (!interestRate || isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0) {
      return res.status(400).json({ 
        message: 'interest_rate is required and must be a non-negative number'
      });
    }
    if (!loanTerm || !Number.isInteger(parseInt(loanTerm)) || parseInt(loanTerm) < 0) {
      return res.status(400).json({ 
        message: 'loan_term is required and must be a non-negative integer'
      });
    }

    // Calculate loan totals
    const totalLoanAmount = parseFloat(previousLoanAmount || 0) + parseFloat(loanAmount);
    const calculatedInterestAmount = parseFloat(inputInterestAmount) || 
      (totalLoanAmount * parseFloat(interestRate)) / 100;
    const calculatedRecurringFee = parseFloat(recurringFee) || 0;
    const calculatedTotalPayableAmount = parseFloat(inputTotalPayableAmount) || 
      (totalLoanAmount + calculatedInterestAmount + calculatedRecurringFee);

    // Calculate or use provided due date
    let dueDate;
    if (inputDueDate) {
      dueDate = inputDueDate;
    } else {
      const issued = new Date(loanIssuedDate || new Date());
      const due = new Date(issued);
      due.setDate(due.getDate() + parseInt(loanTerm));
      dueDate = due.toISOString().slice(0, 10);
    }

    // Generate or use provided transaction number
    const transactionNumber = inputTransactionNumber || Math.floor(Math.random() * 1000000000).toString();

    console.log('🔍 About to execute INSERT with 34 values...');
    console.log('   Values count:', 34);
    console.log('   First value (first_name):', customerFirstName);
    console.log('   Loan amount value:', totalLoanAmount);

    // Insert loan with customer data from request
    const result = await pool.query(
      `INSERT INTO loans (
        customer_id, first_name, last_name, email, home_phone, mobile_phone, birthdate,
        id_type, id_number, referral, identification_info, street_address, city, state, zipcode,
        customer_number, loan_amount, interest_rate, interest_amount, total_payable_amount, recurring_fee,
        item_category, item_description, collateral_description, customer_note, collateral_image, transaction_number,
        loan_issued_date, loan_term, due_date,
        status, remaining_balance, created_by, created_by_user_id, created_by_username, customer_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
      RETURNING *`,
      [
        customerIdNum,
        customerFirstName,
        customerLastName,
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
        totalLoanAmount,
        interestRate,
        calculatedInterestAmount,
        calculatedTotalPayableAmount,
        calculatedRecurringFee,
        item_category || null,
        item_description || null,
        collateral_description || null,
        customer_note || null,
        collateral_image || null,
        transactionNumber,
        loanIssuedDate || new Date().toISOString().slice(0, 10),
        loanTerm,
        dueDate,
        'active',
        calculatedTotalPayableAmount,
        userId || createdByUserId || null,
        createdByUserId || userId || null,
        createdByUsername || null,
        `${customerFirstName} ${customerLastName}`
      ]
    );

    const loan = validators.formatLoanResponse(result.rows[0]);

    res.status(201).json({
      message: 'Loan created successfully for customer',
      loan,
      pdf_url: `/loan-pdf/${result.rows[0].id}`
    });
  } catch (err) {
    console.error('Error creating loan with customer:', err);
    res.status(500).json({ message: 'Error creating loan', error: err.message });
  }
});

// GET ALL LOANS FOR CUSTOMER - GET /customers/:customerId/loans
app.get('/customers/:customerId/loans', async (req, res) => {
  try {
    const { customerId } = req.params;

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch all loans for this customer
    const result = await pool.query(
      'SELECT * FROM loans WHERE customer_id = $1 ORDER BY loan_issued_date DESC',
      [customerIdNum]
    );

    // Group loans by status
    const loans = result.rows.map(loan => ({
      ...validators.formatLoanResponse(loan),
      pdf_url: `/loan-pdf/${loan.id}`
    }));

    const activeLoans = loans.filter(l => l.status === 'active');
    const redeemedLoans = loans.filter(l => l.status === 'redeemed');
    const forfeitedLoans = loans.filter(l => l.status === 'forfeited');

    res.json({
      activeLoans,
      redeemedLoans,
      forfeitedLoans,
      loans // Also include flat array for backwards compatibility
    });
  } catch (err) {
    console.error('Error fetching customer loans:', err);
    res.status(500).json({ message: 'Error fetching customer loans', error: err.message });
  }
});

// SEARCH LOANS FOR CUSTOMER - GET /customers/:customerId/loans/search?query=...
app.get('/customers/:customerId/loans/search', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, transactionNumber, minAmount, maxAmount } = req.query;

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Build dynamic search query
    let query = 'SELECT * FROM loans WHERE customer_id = $1';
    const params = [customerIdNum];
    let paramIndex = 2;

    if (status) {
      params.push(status);
      query += ` AND status = $${paramIndex}`;
      paramIndex++;
    }

    if (transactionNumber) {
      params.push(transactionNumber);
      query += ` AND transaction_number = $${paramIndex}`;
      paramIndex++;
    }

    if (minAmount) {
      params.push(parseFloat(minAmount));
      query += ` AND loan_amount >= $${paramIndex}`;
      paramIndex++;
    }

    if (maxAmount) {
      params.push(parseFloat(maxAmount));
      query += ` AND loan_amount <= $${paramIndex}`;
      paramIndex++;
    }

    query += ' ORDER BY loan_issued_date DESC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No loans found for this customer matching criteria' });
    }

    const loans = result.rows.map(loan => ({
      ...validators.formatLoanResponse(loan),
      pdf_url: `/loan-pdf/${loan.id}`
    }));

    res.json(loans);
  } catch (err) {
    console.error('Error searching customer loans:', err);
    res.status(500).json({ message: 'Error searching loans', error: err.message });
  }
});

// MAKE PAYMENT FOR CUSTOMER LOAN - POST /customers/:customerId/loans/:loanId/payment
app.post('/customers/:customerId/loans/:loanId/payment', authenticateToken, requireActiveShift, async (req, res) => {
  const { customerId, loanId } = req.params;
  const { paymentMethod, paymentAmount, userId } = req.body;

  try {
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);

    if (isNaN(customerIdNum) || isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid customer or loan ID' });
    }

    // Validate paymentAmount
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch the loan and verify it belongs to the customer
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1 AND customer_id = $2', [loanIdNum, customerIdNum]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    // Update remaining balance after payment
    const newRemainingBalance = parseFloat(loan.remaining_balance) - parseFloat(paymentAmount);
    const finalBalance = Math.max(newRemainingBalance, 0);

    // If balance reaches 0, automatically redeem the loan
    const newStatus = finalBalance === 0 ? 'redeemed' : loan.status;

    // Update the loan details with the new remaining balance and status if needed
    const updatedLoanResult = await pool.query(
      'UPDATE loans SET remaining_balance = $1, status = $2 WHERE id = $3 RETURNING *',
      [finalBalance, newStatus, loanIdNum]
    );

    // Insert payment history with default payment method if not provided
    const method = paymentMethod || 'cash';
    const paymentResult = await pool.query(
      'INSERT INTO payment_history (loan_id, payment_method, payment_amount, payment_date, created_by) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING *',
      [loanIdNum, method, paymentAmount, userId || null]
    );

    // Check if the loan was just fully paid (and auto-redeemed)
    if (finalBalance <= 0) {
      const loanWithInterest = {
        ...updatedLoanResult.rows[0],
        interest_amount: ensureInterestAmount(updatedLoanResult.rows[0])
      };
      res.status(200).json({
        message: '🎉 Loan fully paid and automatically redeemed!',
        loan: validators.formatLoanResponse(loanWithInterest),
        paymentHistory: paymentResult.rows[0],
      });
    } else {
      const loanWithInterest = {
        ...updatedLoanResult.rows[0],
        interest_amount: ensureInterestAmount(updatedLoanResult.rows[0])
      };
      res.status(200).json({
        message: 'Payment successfully processed!',
        loan: validators.formatLoanResponse(loanWithInterest),
        paymentHistory: paymentResult.rows[0],
      });
    }
  } catch (err) {
    console.error('Error making payment:', err);
    res.status(500).json({ message: 'Error making payment' });
  }
});

// REDEEM LOAN FOR CUSTOMER - POST /customers/:customerId/loans/:loanId/redeem
app.post('/customers/:customerId/loans/:loanId/redeem', authenticateToken, requireActiveShift, async (req, res) => {
  const { customerId, loanId } = req.params;
  const { userId, redemptionFee } = req.body;

  try {
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);

    if (isNaN(customerIdNum) || isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid customer or loan ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch the loan and verify it belongs to the customer
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1 AND customer_id = $2', [loanIdNum, customerIdNum]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    // Use the remaining balance that's maintained with each payment
    const remainingBalance = parseFloat(loan.remaining_balance || 0);

    // If the remaining balance is greater than 0, return an error
    if (remainingBalance > 0) {
      return res.status(400).json({ message: 'Loan is not fully paid, cannot redeem.' });
    }

    // Ensure the loan is not already redeemed
    if (loan.status === 'redeemed') {
      return res.status(400).json({ message: 'Loan has already been redeemed.' });
    }

    // Calculate redemption fee
    const calculatedRedemptionFee = parseFloat(redemptionFee) || 0;

    // Redeem the loan with the redemption fee
    const updatedLoan = await pool.query(
      'UPDATE loans SET status = $1, redemption_fee = $2 WHERE id = $3 RETURNING *',
      ['redeemed', calculatedRedemptionFee, loanIdNum]
    );

    // Add to redeem history (if table exists)
    try {
      await pool.query(
        'INSERT INTO redeem_history (loan_id, redeemed_by) VALUES ($1, $2) RETURNING *',
        [loanIdNum, userId]
      );
    } catch (historyErr) {
      console.warn('Warning: Could not insert redeem history:', historyErr.message);
      // Continue even if history insert fails - the main redeem is successful
    }

    res.status(200).json({
      message: 'Loan redeemed successfully!',
      loan: updatedLoan.rows[0],
    });
  } catch (err) {
    console.error('Error redeeming loan:', err.message, err.detail);
    res.status(500).json({ message: 'Error redeeming loan.', error: err.message });
  }
});

// FORFEIT LOAN FOR CUSTOMER - POST /customers/:customerId/loans/:loanId/forfeit
app.post('/customers/:customerId/loans/:loanId/forfeit', authenticateToken, requireActiveShift, async (req, res) => {
  const { customerId, loanId } = req.params;
  const { userId } = req.body;

  try {
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);

    if (isNaN(customerIdNum) || isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid customer or loan ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch the loan and verify it belongs to the customer
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1 AND customer_id = $2', [loanIdNum, customerIdNum]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    if (loan.status === 'redeemed' || loan.status === 'forfeited') {
      return res.status(400).json({ message: 'Loan is already redeemed or forfeited.' });
    }

    // Check forfeit conditions:
    // 1. Due date must be passed (past today)
    // 2. Remaining balance must be less than interest amount OR equal to 0
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(loan.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const isDueDatePassed = dueDate < today;
    const remainingBalance = parseFloat(loan.remaining_balance || 0);
    const interestAmount = parseFloat(loan.interest_amount || 0);
    const isBalanceLessThanInterest = remainingBalance < interestAmount || remainingBalance === 0;
    
    if (!isDueDatePassed) {
      return res.status(400).json({ message: 'Cannot forfeit: Loan due date has not passed yet.' });
    }
    
    if (!isBalanceLessThanInterest) {
      return res.status(400).json({ message: 'Cannot forfeit: Remaining balance must be less than interest amount or zero.' });
    }

    // Update loan status to 'forfeited'
    const updatedLoan = await pool.query('UPDATE loans SET status = $1 WHERE id = $2 RETURNING *', ['forfeited', loanIdNum]);

    // Add to forfeit history (if table exists)
    try {
      await pool.query(
        'INSERT INTO redeem_history (loan_id, redeemed_by) VALUES ($1, $2) RETURNING *',
        [loanIdNum, userId]
      );
    } catch (historyErr) {
      console.warn('Warning: Could not insert forfeit history:', historyErr.message);
      // Continue even if history insert fails - the main forfeit is successful
    }

    res.status(200).json({
      message: 'Loan forfeited successfully!',
      loan: updatedLoan.rows[0],
    });
  } catch (err) {
    console.error('Error forfeiting loan:', err);
    res.status(500).json({ message: 'Error forfeiting loan.' });
  }
});

// REACTIVATE FORFEITED LOAN FOR CUSTOMER - POST /customers/:customerId/loans/:loanId/reactivate
app.post('/customers/:customerId/loans/:loanId/reactivate', requireActiveShift, async (req, res) => {
  const { customerId, loanId } = req.params;
  const { reactivatedByUserId, reactivatedByUsername, reactivationDate } = req.body;

  try {
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);

    if (isNaN(customerIdNum) || isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid customer or loan ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch the loan and verify it belongs to the customer
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1 AND customer_id = $2', [loanIdNum, customerIdNum]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    // Check if loan is forfeited
    if (loan.status !== 'forfeited' && loan.status !== 'FORFEITED') {
      return res.status(400).json({ message: 'Loan is not forfeited and cannot be reactivated' });
    }

    // Update loan status to active
    const reactivationTime = reactivationDate || new Date().toISOString();
    const updateQuery = `
      UPDATE loans 
      SET status = 'active',
          reactivated_at = $1,
          reactivated_by_user_id = $2,
          reactivated_by_username = $3
      WHERE id = $4
      RETURNING *
    `;

    const updatedLoanResult = await pool.query(updateQuery, [
      reactivationTime,
      reactivatedByUserId || null,
      reactivatedByUsername || null,
      loanIdNum
    ]);

    const updatedLoan = updatedLoanResult.rows[0];

    // Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_log (action_type, user_id, username, loan_id, timestamp, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'REACTIVATE_LOAN',
          reactivatedByUserId || null,
          reactivatedByUsername || null,
          loanIdNum,
          reactivationTime,
          JSON.stringify({ status: loan.status }),
          JSON.stringify({ status: 'active' })
        ]
      );
    } catch (auditErr) {
      console.warn('Failed to create audit log entry:', auditErr);
    }

    res.status(200).json({
      message: 'Loan reactivated successfully!',
      loan: validators.formatLoanResponse(updatedLoan),
      reactivationMetadata: {
        reactivatedAt: reactivationTime,
        reactivatedByUserId: reactivatedByUserId,
        reactivatedByUsername: reactivatedByUsername
      }
    });
  } catch (err) {
    console.error('Error reactivating loan:', err);
    res.status(500).json({ message: 'Error reactivating loan', error: err.message });
  }
});

// EXTEND DUE DATE FOR CUSTOMER LOAN - POST /customers/:customerId/loans/:loanId/extend-due-date
app.post('/customers/:customerId/loans/:loanId/extend-due-date', authenticateToken, requireActiveShift, async (req, res) => {
  const { customerId, loanId } = req.params;
  const { extendDays, extendedByUserId, extendedByUsername } = req.body;

  try {
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);
    const extendDaysNum = parseInt(extendDays || 30, 10);

    if (isNaN(customerIdNum) || isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid customer or loan ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch the loan and verify it belongs to the customer
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1 AND customer_id = $2', [loanIdNum, customerIdNum]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({ message: 'Only active loans can be extended' });
    }

    // Check if at least interest amount has been paid
    const paymentResult = await pool.query(
      'SELECT SUM(payment_amount) AS total_paid FROM payment_history WHERE loan_id = $1',
      [loanIdNum]
    );
    const totalPaid = parseFloat(paymentResult.rows[0].total_paid) || 0;
    
    // Use helper function to ensure interest_amount is valid
    const requiredInterest = ensureInterestAmount(loan);

    if (totalPaid < requiredInterest) {
      return res.status(400).json({ 
        message: `Interest not paid. Paid: $${totalPaid.toFixed(2)}, Required: $${requiredInterest.toFixed(2)}, Cannot extend loan.`,
        details: {
          totalPaid: totalPaid.toFixed(2),
          requiredInterest: requiredInterest.toFixed(2)
        }
      });
    }

    // Extend the due date
    const currentDueDate = new Date(loan.due_date);
    currentDueDate.setDate(currentDueDate.getDate() + extendDaysNum);
    const newDueDate = currentDueDate.toISOString().slice(0, 10);

    const updateQuery = `
      UPDATE loans
      SET due_date = $1,
          extended_at = CURRENT_TIMESTAMP,
          extended_by_user_id = $2,
          extended_by_username = $3
      WHERE id = $4
      RETURNING *
    `;

    const updatedLoan = await pool.query(updateQuery, [newDueDate, extendedByUserId || null, extendedByUsername || null, loanIdNum]);

    res.status(200).json({
      message: `Loan extended by ${extendDaysNum} days!`,
      loan: validators.formatLoanResponse(updatedLoan.rows[0])
    });
  } catch (err) {
    console.error('Error extending loan due date:', err);
    res.status(500).json({ message: 'Error extending loan due date' });
  }
});



// APPLY DISCOUNT TO LOAN - POST /customers/:customerId/loans/:loanId/discount
app.post('/customers/:customerId/loans/:loanId/discount', requireActiveShift, async (req, res) => {
  const { customerId, loanId } = req.params;
  const { discountAmount, userId, username } = req.body;

  try {
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);
    const discount = parseFloat(discountAmount);

    if (isNaN(customerIdNum) || isNaN(loanIdNum) || isNaN(discount)) {
      return res.status(400).json({ message: 'Invalid customer ID, loan ID, or discount amount' });
    }

    if (discount <= 0) {
      return res.status(400).json({ message: 'Discount amount must be greater than 0' });
    }

    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1 AND customer_id = $2', [loanIdNum, customerIdNum]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    if (loan.status !== 'active') {
      return res.status(400).json({ message: 'Only active loans can have discounts applied' });
    }

    const newRemainingBalance = Math.max(0, parseFloat(loan.remaining_balance) - discount);
    
    const updateResult = await pool.query(
      'UPDATE loans SET remaining_balance = $1 WHERE id = $2 RETURNING *',
      [newRemainingBalance, loanIdNum]
    );

    res.status(200).json({
      message: 'Discount of \$' + discount.toFixed(2) + ' applied successfully!',
      loan: validators.formatLoanResponse(updateResult.rows[0])
    });
  } catch (err) {
    console.error('Error applying discount:', err);
    res.status(500).json({ message: 'Error applying discount' });
  }
});

// ADD MONEY TO CUSTOMER LOAN - POST /customers/:customerId/loans/:loanId/add-money
app.post('/customers/:customerId/loans/:loanId/add-money', requireActiveShift, async (req, res) => {
  const { customerId, loanId } = req.params;
  const { amount } = req.body;

  try {
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);

    if (isNaN(customerIdNum) || isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid customer or loan ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch the loan and verify it belongs to the customer
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1 AND customer_id = $2', [loanIdNum, customerIdNum]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    // Get total payments made so far
    const paymentsResult = await pool.query(
      'SELECT SUM(payment_amount) AS total_paid FROM payment_history WHERE loan_id = $1',
      [loanIdNum]
    );
    const totalPaid = paymentsResult.rows[0].total_paid || 0;

    // Update loan amount, recalculate interest, and total payable amount
    const newLoanAmount = parseFloat(loan.loan_amount) + parseFloat(amount);
    const newInterestAmount = (newLoanAmount * parseFloat(loan.interest_rate)) / 100;
    const newTotalPayableAmount = newLoanAmount + newInterestAmount;
    const newRemainingBalance = newTotalPayableAmount - totalPaid;

    const updateLoanResult = await pool.query(
      'UPDATE loans SET loan_amount = $1, interest_amount = $2, total_payable_amount = $3, remaining_balance = $4 WHERE id = $5 RETURNING *',
      [newLoanAmount, newInterestAmount, newTotalPayableAmount, newRemainingBalance, loanIdNum]
    );

    res.status(200).json({
      message: 'Money added successfully and loan recalculated',
      loan: updateLoanResult.rows[0],
    });
  } catch (err) {
    console.error('Error adding money:', err);
    res.status(500).json({ message: 'Error adding money to the loan' });
  }
});

// GET LOAN DETAILS FOR CUSTOMER - GET /customers/:customerId/loans/:loanId
app.get('/customers/:customerId/loans/:loanId', async (req, res) => {
  const { customerId, loanId } = req.params;

  try {
    const customerIdNum = parseInt(customerId, 10);
    const loanIdNum = parseInt(loanId, 10);

    if (isNaN(customerIdNum) || isNaN(loanIdNum)) {
      return res.status(400).json({ message: 'Invalid customer or loan ID' });
    }

    // Verify customer exists
    const customerCheck = await pool.query('SELECT * FROM customers WHERE id = $1', [customerIdNum]);
    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Fetch the loan and verify it belongs to the customer
    const loanResult = await pool.query('SELECT * FROM loans WHERE id = $1 AND customer_id = $2', [loanIdNum, customerIdNum]);
    const loan = loanResult.rows[0];

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found for this customer' });
    }

    // Get payment history for this loan
    const paymentsResult = await pool.query(
      'SELECT * FROM payment_history WHERE loan_id = $1 ORDER BY payment_date DESC',
      [loanIdNum]
    );

    // Ensure interest_amount is always valid
    const loanWithInterest = {
      ...loan,
      interest_amount: ensureInterestAmount(loan)
    };

    res.json({
      loan: validators.formatLoanResponse(loanWithInterest),
      paymentHistory: paymentsResult.rows,
      pdf_url: `/loan-pdf/${loanIdNum}`
    });
  } catch (err) {
    console.error('Error fetching loan details:', err);
    res.status(500).json({ message: 'Error fetching loan details', error: err.message });
  }
});

// ======================== END CUSTOMER-CENTRIC LOAN MANAGEMENT ========================

// START SHIFT - User records opening cash balance
app.post('/start-shift', async (req, res) => {
  const { userId, openingBalance } = req.body;

  try {
    console.log(`📍 Start shift request: userId=${userId}, openingBalance=${openingBalance}`);
    
    if (!openingBalance || openingBalance < 0) {
      return res.status(400).json({ message: 'Invalid opening balance' });
    }

    // Check if there's an active shift for this user
    let activeShiftCheck;
    try {
      activeShiftCheck = await pool.query(
        'SELECT * FROM shift_management WHERE user_id = $1 AND shift_end_time IS NULL',
        [userId]
      );
    } catch (err) {
      console.error('Error checking active shift:', err.message);
      return res.status(503).json({ message: 'Database error: ' + err.message });
    }

    if (activeShiftCheck.rows.length > 0) {
      console.warn(`⚠️  User ${userId} already has active shift:`, activeShiftCheck.rows[0]);
      return res.status(400).json({ message: 'User already has an active shift. Please close the previous shift first.' });
    }

    // Insert new shift record
    let result;
    try {
      result = await pool.query(
        `INSERT INTO shift_management (user_id, shift_start_time, opening_balance)
         VALUES ($1, CURRENT_TIMESTAMP, $2)
         RETURNING *`,
        [userId, parseFloat(openingBalance)]
      );
    } catch (err) {
      console.error('Error creating shift:', err.message);
      return res.status(503).json({ message: 'Database error: ' + err.message });
    }

    console.log(`✅ Shift ${result.rows[0].id} created for user ${userId}:`, {
      id: result.rows[0].id,
      shift_start_time: result.rows[0].shift_start_time,
      shift_end_time: result.rows[0].shift_end_time,
      opening_balance: result.rows[0].opening_balance
    });

    res.status(201).json({
      message: 'Shift started successfully',
      shift: result.rows[0]
    });
  } catch (err) {
    console.error('Error starting shift:', err);
    res.status(500).json({ message: 'Error starting shift' });
  }
});


// GET CURRENT SHIFT - Get active shift for user (query parameter version)
app.get('/current-shift', async (req, res) => {
  let { userId } = req.query;

  try {
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Convert to integer
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    let result;
    try {
      result = await pool.query(
        'SELECT * FROM shift_management WHERE user_id = $1 AND shift_end_time IS NULL ORDER BY id DESC LIMIT 1',
        [userIdNum]
      );
    } catch (err) {
      console.error('Error fetching current shift:', err.message);
      return res.status(503).json({ message: 'Database error: ' + err.message });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No active shift found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching current shift:', err);
    res.status(500).json({ message: 'Error fetching current shift' });
  }
});

// GET CURRENT SHIFT - Get active shift for user (path parameter version)
app.get('/current-shift/:userId', async (req, res) => {
  let { userId } = req.params;

  try {
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Convert to integer
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }

    let result;
    try {
      result = await pool.query(
        'SELECT * FROM shift_management WHERE user_id = $1 AND shift_end_time IS NULL ORDER BY id DESC LIMIT 1',
        [userIdNum]
      );
    } catch (err) {
      console.error('Error fetching current shift:', err.message);
      return res.status(503).json({ message: 'Database error: ' + err.message });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No active shift found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching current shift:', err);
    res.status(500).json({ message: 'Error fetching current shift' });
  }
});


// END SHIFT - User records closing cash balance and system verifies
app.post('/end-shift', async (req, res) => {
  const { userId, closingBalance, notes } = req.body;

  try {
    if (!closingBalance || closingBalance < 0) {
      return res.status(400).json({ message: 'Invalid closing balance' });
    }

    // Get active shift
    let shiftResult;
    try {
      shiftResult = await pool.query(
        'SELECT * FROM shift_management WHERE user_id = $1 AND shift_end_time IS NULL ORDER BY id DESC LIMIT 1',
        [userId]
      );
    } catch (err) {
      console.error('Error fetching shift:', err.message);
      return res.status(503).json({ message: 'Database error: ' + err.message });
    }

    if (shiftResult.rows.length === 0) {
      return res.status(404).json({ message: 'No active shift found' });
    }

    const shift = shiftResult.rows[0];

    // Get CASH payments received only (not card, check, etc)
    let paymentsResult;
    try {
      paymentsResult = await pool.query(
        `SELECT COALESCE(SUM(payment_amount), 0) AS total_payments 
         FROM payment_history 
         WHERE created_by = $1 AND payment_date >= $2 AND LOWER(payment_method) = 'cash'`,
        [userId, shift.shift_start_time]
      );
    } catch (err) {
      console.error('Error fetching payments:', err.message);
      return res.status(503).json({ message: 'Database error: ' + err.message });
    }

    // Get all loans given during this shift
    let loansGivenResult;
    try {
      loansGivenResult = await pool.query(
        `SELECT COALESCE(SUM(loan_amount), 0) AS total_loans_given 
         FROM loans 
         WHERE created_by = $1 AND loan_issued_date >= DATE($2)`,
        [userId, shift.shift_start_time]
      );
    } catch (err) {
      console.error('Error fetching loans:', err.message);
      return res.status(503).json({ message: 'Database error: ' + err.message });
    }

    const totalCashPayments = parseFloat(paymentsResult.rows[0].total_payments || 0);
    const totalLoansGiven = parseFloat(loansGivenResult.rows[0].total_loans_given || 0);
    const openingBalance = parseFloat(shift.opening_balance);

    // Calculate expected balance: opening + cash payments - loans given
    // Non-cash payments (card, check) don't affect cash balance
    const expectedBalance = openingBalance + totalCashPayments - totalLoansGiven;
    const closingBalanceNum = parseFloat(closingBalance);
    const difference = closingBalanceNum - expectedBalance;
    const isBalanced = Math.abs(difference) < 0.01; // Allow for floating point errors

    // Update shift with closing details
    const updateResult = await pool.query(
      `UPDATE shift_management 
       SET shift_end_time = CURRENT_TIMESTAMP, 
           closing_balance = $1, 
           total_payments_received = $2, 
           total_loans_given = $3, 
           expected_balance = $4, 
           difference = $5, 
           is_balanced = $6,
           notes = $7
       WHERE id = $8
       RETURNING *`,
      [closingBalanceNum, totalCashPayments, totalLoansGiven, expectedBalance, difference, isBalanced, notes || null, shift.id]
    );

    res.status(200).json({
      message: isBalanced ? 'Shift closed successfully and cash is balanced!' : 'Shift closed but there is a discrepancy!',
      shift: updateResult.rows[0],
      summary: {
        openingBalance: openingBalance,
        closingBalance: closingBalanceNum,
        totalCashPaymentsReceived: totalCashPayments,
        totalLoansGiven: totalLoansGiven,
        expectedBalance: expectedBalance,
        actualDifference: difference,
        isBalanced: isBalanced,
        status: isBalanced ? 'BALANCED' : 'DISCREPANCY'
      }
    });
  } catch (err) {
    console.error('Error ending shift:', err);
    res.status(500).json({ message: 'Error ending shift' });
  }
});


// GET SHIFT REPORT - Get detailed summary of a shift
app.get('/shift-report/:shiftId', async (req, res) => {
  const { shiftId } = req.params;

  try {
    // Get shift details
    const shiftResult = await pool.query(
      'SELECT * FROM shift_management WHERE id = $1',
      [shiftId]
    );

    if (shiftResult.rows.length === 0) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    const shift = shiftResult.rows[0];

    // Get all payments during this shift
    const paymentsResult = await pool.query(
      `SELECT ph.*, l.customer_name, l.transaction_number
       FROM payment_history ph
       JOIN loans l ON ph.loan_id = l.id
       WHERE ph.created_by = $1 AND ph.payment_date >= $2 AND ph.payment_date <= COALESCE($3, CURRENT_TIMESTAMP)
       ORDER BY ph.payment_date DESC`,
      [shift.user_id, shift.shift_start_time, shift.shift_end_time]
    );

    // Get all loans created during this shift
    const loansResult = await pool.query(
      `SELECT id, customer_name, loan_amount, transaction_number, loan_issued_date
       FROM loans
       WHERE created_by = $1 AND loan_issued_date >= DATE($2) AND loan_issued_date <= COALESCE(DATE($3), CURRENT_DATE)
       ORDER BY loan_issued_date DESC`,
      [shift.user_id, shift.shift_start_time, shift.shift_end_time]
    );

    res.json({
      shift: shift,
      payments: paymentsResult.rows,
      loansCreated: loansResult.rows,
      summary: {
        totalTransactions: paymentsResult.rows.length + loansResult.rows.length,
        totalPaymentTransactions: paymentsResult.rows.length,
        totalLoansCreated: loansResult.rows.length
      }
    });
  } catch (err) {
    console.error('Error fetching shift report:', err);
    res.status(500).json({ message: 'Error fetching shift report' });
  }
});


// GET SHIFT HISTORY - Get all shifts for a user (query parameter version)
app.get('/shift-history', async (req, res) => {
  const { userId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const result = await pool.query(
      'SELECT * FROM shift_management WHERE user_id = $1 ORDER BY shift_start_time DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shift history:', err);
    res.status(500).json({ message: 'Error fetching shift history' });
  }
});

// GET SHIFT HISTORY - Get all shifts for a user (path parameter version)
app.get('/shift-history/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const result = await pool.query(
      'SELECT * FROM shift_management WHERE user_id = $1 ORDER BY shift_start_time DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shift history:', err);
    res.status(500).json({ message: 'Error fetching shift history' });
  }
});


// GET TODAY SHIFT SUMMARY - Quick summary for today
app.get('/today-shift-summary/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Get active shift or today's last shift
    const shiftResult = await pool.query(
      `SELECT * FROM shift_management 
       WHERE user_id = $1 AND DATE(shift_start_time) = CURRENT_DATE
       ORDER BY shift_start_time DESC LIMIT 1`,
      [userId]
    );

    if (shiftResult.rows.length === 0) {
      return res.status(404).json({ message: 'No shift found for today' });
    }

    const shift = shiftResult.rows[0];

    // Calculate current stats if shift is active
    if (!shift.shift_end_time) {
      const paymentsResult = await pool.query(
        `SELECT COALESCE(SUM(payment_amount), 0) AS total_payments,
                COUNT(*) AS payment_count
         FROM payment_history 
         WHERE created_by = $1 AND payment_date >= $2`,
        [userId, shift.shift_start_time]
      );

      const loansGivenResult = await pool.query(
        `SELECT COALESCE(SUM(loan_amount), 0) AS total_loans_given,
                COUNT(*) AS loan_count
         FROM loans 
         WHERE created_by = $1 AND loan_issued_date >= DATE($2)`,
        [userId, shift.shift_start_time]
      );

      const totalPayments = parseFloat(paymentsResult.rows[0].total_payments || 0);
      const totalLoansGiven = parseFloat(loansGivenResult.rows[0].total_loans_given || 0);
      const expectedBalance = parseFloat(shift.opening_balance) + totalPayments - totalLoansGiven;

      return res.json({
        shift: shift,
        currentStats: {
          openingBalance: shift.opening_balance,
          expectedBalance: expectedBalance,
          totalPaymentsReceived: totalPayments,
          totalLoansGiven: totalLoansGiven,
          paymentCount: paymentsResult.rows[0].payment_count,
          loanCount: loansGivenResult.rows[0].loan_count,
          shiftActive: true
        }
      });
    }

    res.json({
      shift: shift,
      shiftClosed: true
    });
  } catch (err) {
    console.error('Error fetching today shift summary:', err);
    res.status(500).json({ message: 'Error fetching shift summary' });
  }
});




// ======================== BALANCING REPORT (FOR DAILY CASH REPORT - BALANCING TAB) ========================

// GET BALANCING REPORT - Active and Due loans within a custom date range
// Frontend calls: GET /balancing-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
app.get('/balancing-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'startDate and endDate query parameters are required (YYYY-MM-DD format)' 
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ 
        message: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date values' 
      });
    }

    // Verify start date is before end date
    if (start > end) {
      return res.status(400).json({ 
        message: 'Start date must be before or equal to end date' 
      });
    }

    // Get ACTIVE loans (non-overdue) created or active within the date range
    // Active loans: status = 'active' AND due_date >= today (not yet due)
    const activeLoansResult = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(loan_amount), 0) as total_principal,
        COALESCE(SUM(interest_amount), 0) as total_interest,
        COALESCE(SUM(loan_amount + interest_amount), 0) as total_amount
      FROM loans 
      WHERE status = $1 
        AND DATE(loan_issued_date) >= $2 
        AND DATE(loan_issued_date) <= $3
        AND DATE(due_date) >= CURRENT_DATE`,
      ['active', startDate, endDate]
    );

    // Get DUE/OVERDUE loans (active loans with due date passed)
    // Due loans: status = 'active' AND due_date < today
    const dueLoansResult = await pool.query(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(loan_amount), 0) as total_principal,
        COALESCE(SUM(interest_amount), 0) as total_interest,
        COALESCE(SUM(loan_amount + interest_amount), 0) as total_amount
      FROM loans 
      WHERE status = $1 
        AND DATE(loan_issued_date) >= $2 
        AND DATE(loan_issued_date) <= $3
        AND DATE(due_date) < CURRENT_DATE`,
      ['active', startDate, endDate]
    );

    const activeLoans = activeLoansResult.rows[0];
    const dueLoans = dueLoansResult.rows[0];

    // Format response with proper decimal places
    const response = {
      startDate,
      endDate,
      totalActiveLoanCount: parseInt(activeLoans.total_count) || 0,
      totalActivePrincipal: parseFloat(activeLoans.total_principal) || 0.00,
      totalActiveInterest: parseFloat(activeLoans.total_interest) || 0.00,
      totalDueLoanCount: parseInt(dueLoans.total_count) || 0,
      totalDuePrincipal: parseFloat(dueLoans.total_principal) || 0.00,
      totalDueInterest: parseFloat(dueLoans.total_interest) || 0.00
    };

    console.log('📊 Balancing Report Generated:', response);
    res.json(response);
  } catch (err) {
    console.error('Error generating balancing report:', err);
    res.status(500).json({ 
      message: 'Error generating balancing report', 
      error: err.message 
    });
  }
});

// ======================== END BALANCING REPORT ========================

// ======================== DETAILED LOANS BREAKDOWN (Active/Overdue with Payment Status) ========================

// GET DETAILED LOANS BREAKDOWN - Active & Overdue loans with due dates, payment status, sorted by customer
// Frontend calls: GET /detailed-loans-breakdown?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=active|overdue|all
app.get('/detailed-loans-breakdown', async (req, res) => {
  try {
    const { startDate, endDate, status = 'all' } = req.query;

    // Validate date parameters (optional for flexibility)
    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ 
          message: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }
      dateFilter = 'AND DATE(l.loan_issued_date) >= $1 AND DATE(l.loan_issued_date) <= $2';
      params.push(startDate, endDate);
    }

    // Build status filter
    let statusFilter = '';
    let paramIndex = params.length + 1;
    
    if (status === 'active') {
      statusFilter = `AND l.status = $${paramIndex}`;
      params.push('active');
    } else if (status === 'overdue') {
      statusFilter = `AND l.status IN ($${paramIndex}, $${paramIndex + 1})`;
      params.push('overdue', 'active');
      // For overdue: include 'overdue' status OR 'active' loans past due date
      statusFilter = `AND (l.status = 'overdue' OR (l.status = 'active' AND l.due_date < CURRENT_DATE))`;
    }
    // If status === 'all', no filter applied

    // Get all loans with customer info and payment status
    const query = `
      SELECT 
        l.id,
        l.transaction_number,
        l.customer_name,
        c.id as customer_id,
        c.first_name,
        c.last_name,
        l.loan_amount,
        l.interest_amount,
        l.due_date,
        l.loan_issued_date,
        l.status,
        l.remaining_balance,
        l.total_payable_amount,
        COALESCE(SUM(ph.payment_amount), 0) as total_paid,
        CASE WHEN COALESCE(SUM(ph.payment_amount), 0) > 0 THEN true ELSE false END as has_payment,
        COUNT(DISTINCT ph.id) as payment_count,
        CASE 
          WHEN l.due_date < CURRENT_DATE AND l.status = 'active' THEN 'overdue'
          WHEN l.due_date = CURRENT_DATE THEN 'due-today'
          ELSE 'active'
        END as loan_status_detail,
        CASE 
          WHEN l.due_date < CURRENT_DATE THEN EXTRACT(DAY FROM CURRENT_DATE - l.due_date)
          ELSE 0
        END as days_overdue
      FROM loans l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN payment_history ph ON l.id = ph.loan_id
      WHERE 1=1 ${statusFilter} ${dateFilter}
      GROUP BY l.id, c.id
      ORDER BY l.customer_name ASC, l.loan_issued_date ASC
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.json({
        message: 'No loans found for the specified criteria',
        customerGroups: [],
        summary: {
          totalCustomers: 0,
          totalLoans: 0,
          totalLoanAmount: 0,
          totalInterest: 0,
          totalPaid: 0,
          loansWithPayments: 0,
          activeLoans: 0,
          overdueLoans: 0
        }
      });
    }

    // Group loans by customer
    const customerGroups = {};
    let activeLoansCount = 0;
    let overdueLoansCount = 0;
    let totalPaidSum = 0;
    let loansWithPaymentsCount = 0;

    result.rows.forEach(loan => {
      const customerName = loan.customer_name || `${loan.first_name || ''} ${loan.last_name || ''}`.trim() || 'Unknown';
      
      if (!customerGroups[customerName]) {
        customerGroups[customerName] = {
          customerName,
          customerId: loan.customer_id,
          loans: []
        };
      }

      const loanData = {
        loanId: loan.id,
        transactionNumber: loan.transaction_number,
        loanAmount: parseFloat(loan.loan_amount),
        interestAmount: parseFloat(loan.interest_amount),
        totalPayable: parseFloat(loan.total_payable_amount),
        dueDate: loan.due_date,
        issuedDate: loan.loan_issued_date,
        status: loan.status,
        statusDetail: loan.loan_status_detail,
        remainingBalance: parseFloat(loan.remaining_balance),
        totalPaid: parseFloat(loan.total_paid),
        hasPayment: loan.has_payment,
        paymentCount: parseInt(loan.payment_count),
        daysOverdue: parseInt(loan.days_overdue)
      };

      customerGroups[customerName].loans.push(loanData);

      // Update counters
      if (loan.loan_status_detail === 'overdue') {
        overdueLoansCount++;
      } else {
        activeLoansCount++;
      }

      if (loan.has_payment) {
        loansWithPaymentsCount++;
      }

      totalPaidSum += parseFloat(loan.total_paid);
    });

    // Convert to array and sort by customer name
    const groupedData = Object.values(customerGroups).sort((a, b) => 
      a.customerName.localeCompare(b.customerName)
    );

    // Calculate summary
    const summary = {
      totalCustomers: groupedData.length,
      totalLoans: result.rows.length,
      totalLoanAmount: result.rows.reduce((sum, loan) => sum + parseFloat(loan.loan_amount), 0),
      totalInterest: result.rows.reduce((sum, loan) => sum + parseFloat(loan.interest_amount), 0),
      totalPaid: totalPaidSum,
      loansWithPayments: loansWithPaymentsCount,
      loansWithoutPayments: result.rows.length - loansWithPaymentsCount,
      activeLoans: activeLoansCount,
      overdueLoans: overdueLoansCount
    };

    res.json({
      message: 'Detailed loans breakdown retrieved successfully',
      customerGroups: groupedData,
      summary
    });

  } catch (err) {
    console.error('Error generating detailed loans breakdown:', err);
    res.status(500).json({ 
      message: 'Error generating detailed loans breakdown', 
      error: err.message 
    });
  }
});

// ======================== END DETAILED LOANS BREAKDOWN ========================

// ======================== END SHIFT MANAGEMENT ========================

// ======================== CASH REPORT ========================

// GET CASH REPORT - Generate daily cash report
app.get('/cash-report', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  const { date } = req.query;

  console.log('📊 /cash-report endpoint called with date:', date);

  try {
    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.log('❌ Invalid date format:', date);
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Parse the date
    const reportDate = new Date(date);
    if (isNaN(reportDate.getTime())) {
      console.log('❌ Invalid date:', date);
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Format date for queries (YYYY-MM-DD)
    const dateStr = date;

    // 1. Get Pawn Activity (New Loans, Buys, Buyouts)
    console.log('🔍 Fetching new loans for date:', dateStr);
    const newLoansResult = await pool.query(
      `SELECT COUNT(*) as qty, COALESCE(SUM(loan_amount), 0) as amount
       FROM loans
       WHERE DATE(loan_issued_date) = $1 AND status NOT IN ('forfeited', 'redeemed')`,
      [dateStr]
    );
    console.log('✅ New loans result:', newLoansResult.rows[0]);

    const newLoans = {
      qty: parseInt(newLoansResult.rows[0].qty) || 0,
      amount: parseFloat(newLoansResult.rows[0].amount) || 0
    };

    // For Buys and Buyouts - these would need specific transaction types if tracked separately
    // For now, we'll set them to 0 (can be enhanced if buy/buyout logic is implemented)
    const buys = { qty: 0, amount: 0.00 };
    const buyouts = { qty: 0, amount: 0.00 };

    const inStoreTotal = {
      qty: newLoans.qty + buys.qty + buyouts.qty,
      amount: parseFloat((newLoans.amount + buys.amount + buyouts.amount).toFixed(2))
    };

    // 2. Get In-Store Transactions (Renewals, Partial Payments, Extensions, Redemptions)

    // Renewals
    const renewalsResult = await pool.query(
      `SELECT COUNT(*) as qty,
              COALESCE(SUM(l.loan_amount), 0) as principal,
              COALESCE(SUM(l.interest_amount), 0) as interest,
              0 as fees
       FROM loans l
       WHERE DATE(due_date) = $1 AND status = 'active'`,
      [dateStr]
    );

    const renewals = {
      qty: parseInt(renewalsResult.rows[0].qty) || 0,
      principal: parseFloat(renewalsResult.rows[0].principal) || 0,
      interest: parseFloat(renewalsResult.rows[0].interest) || 0,
      fees: 0.00,
      total: 0
    };
    renewals.total = parseFloat((renewals.principal + renewals.interest + renewals.fees).toFixed(2));

    // Partial Payments
    const partialPaymentsResult = await pool.query(
      `SELECT COUNT(*) as qty,
              COALESCE(SUM(ph.payment_amount), 0) as total,
              COALESCE(SUM(l.loan_amount * (ph.payment_amount / l.total_payable_amount)), 0) as principal,
              COALESCE(SUM(l.interest_amount * (ph.payment_amount / l.total_payable_amount)), 0) as interest
       FROM payment_history ph
       JOIN loans l ON ph.loan_id = l.id
       WHERE DATE(ph.payment_date) = $1 AND ph.payment_amount < l.total_payable_amount`,
      [dateStr]
    );

    const partialPayments = {
      qty: parseInt(partialPaymentsResult.rows[0].qty) || 0,
      principal: parseFloat(partialPaymentsResult.rows[0].principal) || 0,
      interest: parseFloat(partialPaymentsResult.rows[0].interest) || 0,
      fees: 0.00,
      total: parseFloat(partialPaymentsResult.rows[0].total) || 0
    };

    // Extensions
    const extensionsResult = await pool.query(
      `SELECT COUNT(*) as qty,
              COALESCE(SUM(l.loan_amount), 0) as principal,
              COALESCE(SUM(l.interest_amount), 0) as interest,
              0 as fees
       FROM loans l
       WHERE DATE(created_at) = $1 AND status = 'active'`,
      [dateStr]
    );

    const extensions = {
      qty: parseInt(extensionsResult.rows[0].qty) || 0,
      principal: parseFloat(extensionsResult.rows[0].principal) || 0,
      interest: parseFloat(extensionsResult.rows[0].interest) || 0,
      fees: 0.00,
      total: 0
    };
    extensions.total = parseFloat((extensions.principal + extensions.interest + extensions.fees).toFixed(2));

    // Redemptions
    const redemptionsResult = await pool.query(
      `SELECT COUNT(*) as qty,
              COALESCE(SUM(l.loan_amount), 0) as principal,
              COALESCE(SUM(l.interest_amount), 0) as interest,
              0 as fees
       FROM loans l
       WHERE DATE(loan_issued_date) = $1 AND status = 'redeemed'`,
      [dateStr]
    );

    const redemptions = {
      qty: parseInt(redemptionsResult.rows[0].qty) || 0,
      principal: parseFloat(redemptionsResult.rows[0].principal) || 0,
      interest: parseFloat(redemptionsResult.rows[0].interest) || 0,
      fees: 0.00,
      total: 0
    };
    redemptions.total = parseFloat((redemptions.principal + redemptions.interest + redemptions.fees).toFixed(2));

    // In-Store Transactions Subtotal
    const inStoreTxnsSubtotal = {
      qty: renewals.qty + partialPayments.qty + extensions.qty + redemptions.qty,
      principal: parseFloat((renewals.principal + partialPayments.principal + extensions.principal + redemptions.principal).toFixed(2)),
      interest: parseFloat((renewals.interest + partialPayments.interest + extensions.interest + redemptions.interest).toFixed(2)),
      fees: parseFloat((renewals.fees + partialPayments.fees + extensions.fees + redemptions.fees).toFixed(2)),
      total: 0
    };
    inStoreTxnsSubtotal.total = parseFloat((inStoreTxnsSubtotal.principal + inStoreTxnsSubtotal.interest + inStoreTxnsSubtotal.fees).toFixed(2));

    // 3. Get Store Reconciliation (Expected vs Actual)
    const shiftResult = await pool.query(
      `SELECT id, opening_balance, closing_balance, expected_balance, is_balanced
       FROM shift_management
       WHERE DATE(shift_start_time) = $1
       ORDER BY shift_start_time DESC`,
      [dateStr]
    );

    const openStore = {
      online: { expected: 0.00, actual: 0.00, difference: 0.00 },
      till01: { expected: 0.00, actual: 0.00, difference: 0.00 },
      till02: { expected: 0.00, actual: 0.00, difference: 0.00 },
      storeSale: { expected: 0.00, actual: 0.00, difference: 0.00 }
    };

    let todayOpeningTotal = 0;
    let todayClosingTotal = 0;

    if (shiftResult.rows.length > 0) {
      const shift = shiftResult.rows[0];
      
      // Map shift data to store locations
      // This assumes shifts represent different store locations
      // Adjust logic based on your actual store structure
      const expectedBalance = parseFloat(shift.expected_balance) || 0;
      const actualBalance = parseFloat(shift.closing_balance) || 0;
      
      openStore.till01.expected = expectedBalance;
      openStore.till01.actual = actualBalance;
      openStore.till01.difference = parseFloat((actualBalance - expectedBalance).toFixed(2));
      
      todayOpeningTotal = parseFloat(shift.opening_balance) || 0;
      todayClosingTotal = actualBalance;
    }

     // Get Active Loan Count
     const activeLoanResult = await pool.query(
       `SELECT COUNT(*) as count FROM loans WHERE status = 'active'`
     );
     const activeLoanCount = parseInt(activeLoanResult.rows[0].count) || 0;

     // Get Overdue Loan Count
     const overdueLoanResult = await pool.query(
       `SELECT COUNT(*) as count FROM loans WHERE status = 'overdue'`
     );
     const overdueLoanCount = parseInt(overdueLoanResult.rows[0].count) || 0;

     // Check if we have data for the report
     const hasData = newLoans.qty > 0 || partialPayments.qty > 0 || redemptions.qty > 0 || shiftResult.rows.length > 0;

     if (!hasData) {
       return res.status(404).json({ message: 'No transaction data available for the provided date' });
     }

     // Build and return the report
     const report = {
       pawnActivity: {
         newLoans,
         buys,
         buyouts,
         inStoreTotal
       },
       inStoreTxns: {
         renewals,
         partialPayments,
         extensions,
         redemptions,
         subtotal: inStoreTxnsSubtotal
       },
       openStore,
       todayOpeningTotal: parseFloat(todayOpeningTotal.toFixed(2)),
       todayClosingTotal: parseFloat(todayClosingTotal.toFixed(2)),
       activeLoanCount,
       overdueLoanCount
     };
     res.json(report);
  } catch (err) {
    console.error('Error generating cash report:', err);
    res.status(500).json({ message: 'Error generating cash report', error: err.message });
  }
});

// ======================== END CASH REPORT ========================

// ======================== REVENUE REPORT ========================

// Get Revenue Report for date range
app.get('/revenue-report', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    // Validate date format
    if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Get all payments within the date range
    const paymentsResult = await pool.query(
      `SELECT 
         ph.loan_id, 
         ph.payment_amount, 
         ph.payment_date,
         l.loan_amount,
         l.interest_amount,
         l.total_payable_amount,
          l.status,
          l.due_date
        FROM payment_history ph
       JOIN loans l ON ph.loan_id = l.id
       WHERE DATE(ph.payment_date) BETWEEN $1 AND $2
       ORDER BY ph.payment_date DESC`,
      [startDate, endDate]
    );

    // Calculate revenue breakdown
    let totalRevenue = 0;
    let interestRevenue = 0;
    let principalReceived = 0;
    let feesCollected = 0;
    const revenueByLoan = {};

     // Revenue tracking by loan status
     let activeLoansRevenue = 0;
     let dueLoansRevenue = 0;
     let redeemedLoansRevenue = 0;
     let activeLoansInterest = 0;
     let dueLoansInterest = 0;
     let redeemedLoansInterest = 0;

    // Process each payment to calculate interest and principal portions
    for (const payment of paymentsResult.rows) {
      const loanId = payment.loan_id;
      const paymentAmount = parseFloat(payment.payment_amount) || 0;
      const loanAmount = parseFloat(payment.loan_amount) || 0;
      const interestAmount = parseFloat(payment.interest_amount) || 0;
      const totalPayable = parseFloat(payment.total_payable_amount) || 0;
       const loanStatus = payment.status;
       const dueDate = payment.due_date;

      // Calculate the ratio of interest in this payment
      // Interest portion = (interest / total payable) * payment amount
      const interestPortion = totalPayable > 0 ? (interestAmount / totalPayable) * paymentAmount : 0;
      const principalPortion = paymentAmount - interestPortion;

      interestRevenue += interestPortion;
      principalReceived += principalPortion;
      totalRevenue += paymentAmount;
       
       // Track by loan status
       if (loanStatus === 'active') {
         activeLoansRevenue += paymentAmount;
         activeLoansInterest += interestPortion;
       } else if (loanStatus === 'overdue') {
         dueLoansRevenue += paymentAmount;
         dueLoansInterest += interestPortion;
       } else if (loanStatus === 'redeemed') {
         redeemedLoansRevenue += paymentAmount;
         redeemedLoansInterest += interestPortion;
       }

      if (!revenueByLoan[loanId]) {
        revenueByLoan[loanId] = {
          interest: 0,
          principal: 0,
          total: 0,
          count: 0
        };
      }
      revenueByLoan[loanId].interest += interestPortion;
      revenueByLoan[loanId].principal += principalPortion;
      revenueByLoan[loanId].total += paymentAmount;
      revenueByLoan[loanId].count += 1;
    }

    // Round all values to 2 decimal places
    totalRevenue = parseFloat(totalRevenue.toFixed(2));
    interestRevenue = parseFloat(interestRevenue.toFixed(2));
    principalReceived = parseFloat(principalReceived.toFixed(2));
    feesCollected = parseFloat(feesCollected.toFixed(2));

     // Get Active Loan Count
     const activeLoanResult = await pool.query(
       `SELECT COUNT(*) as count FROM loans WHERE status = 'active'`
     );
     const activeLoanCount = parseInt(activeLoanResult.rows[0].count) || 0;

     // Get Overdue Loan Count
     const overdueLoanResult = await pool.query(
       `SELECT COUNT(*) as count FROM loans WHERE status = 'overdue'`
     );
     const overdueLoanCount = parseInt(overdueLoanResult.rows[0].count) || 0;

     const report = {
       totalRevenue,
       interestRevenue,
       principalReceived,
       feesCollected,
       interestCount: paymentsResult.rows.length,
       principalCount: paymentsResult.rows.length,
       feeCount: 0,
       paymentCount: paymentsResult.rows.length,
       activeLoanCount,
       overdueLoanCount,
        activeLoansRevenue: parseFloat(activeLoansRevenue.toFixed(2)),
        dueLoansRevenue: parseFloat(dueLoansRevenue.toFixed(2)),
        redeemedLoansRevenue: parseFloat(redeemedLoansRevenue.toFixed(2)),
        activeLoansInterest: parseFloat(activeLoansInterest.toFixed(2)),
        dueLoansInterest: parseFloat(dueLoansInterest.toFixed(2)),
        redeemedLoansInterest: parseFloat(redeemedLoansInterest.toFixed(2)),
       revenueByLoan
     };
     res.json(report);
  } catch (err) {
    console.error('Error generating revenue report:', err);
    res.status(500).json({ message: 'Error generating revenue report', error: err.message });
  }
});

// ======================== END REVENUE REPORT ========================

// ======================== PDF INVOICE GENERATION ========================

// Get Loan as PDF Invoice
app.get('/loan-pdf/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;

    // Validate loanId
    if (!loanId || loanId === 'undefined' || isNaN(loanId)) {
      console.error('Invalid loanId received:', loanId);
      return res.status(400).json({ message: 'Invalid loan ID provided' });
    }

    console.log('📄 PDF Request - Fetching loan ID:', loanId);

    // Fetch loan details with customer information
    const result = await pool.query(
      `SELECT 
        l.*,
        c.first_name,
        c.last_name
       FROM loans l
       LEFT JOIN customers c ON l.customer_id = c.id
       WHERE l.id = $1`,
      [loanId]
    );

    if (result.rows.length === 0) {
      console.warn(`Loan not found for ID: ${loanId}`);
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = result.rows[0];

    // Log the data being sent to PDF generator
    console.log('📊 Loan data to be used in PDF:', {
      id: loan.id,
      transaction_number: loan.transaction_number,
      first_name: loan.first_name,
      last_name: loan.last_name,
      customer_name: loan.customer_name,
      loan_amount: loan.loan_amount,
      interest_rate: loan.interest_rate,
      total_payable_amount: loan.total_payable_amount
    });

    // Generate PDF
    const pdfBuffer = await generateLoanPDF(loan);

    // Send PDF with appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="loan_${loan.id}_${loan.transaction_number}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ message: 'Error generating PDF', error: err.message });
  }
});

// Get Search Results as PDF (multiple loans on one document)
app.post('/loans-pdf', async (req, res) => {
  try {
    const { loanIds } = req.body;

    if (!loanIds || !Array.isArray(loanIds) || loanIds.length === 0) {
      return res.status(400).json({ message: 'Provide loanIds array' });
    }

    // Fetch all loans
    const placeholders = loanIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(`SELECT * FROM loans WHERE id IN (${placeholders})`, loanIds);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No loans found' });
    }

    // Generate PDF for first loan (or create a summary if needed)
    const pdfBuffer = await generateLoanPDF(result.rows[0]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pawnflow_loans_${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDFs:', err);
    res.status(500).json({ message: 'Error generating PDFs', error: err.message });
  }
});

// ======================== END PDF GENERATION ========================

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

// ----------------------- DAILY CASH REPORT - BALANCING TAB -----------------------
// Get active loans and due loans report within a date range
app.get('/reports/daily-cash-balancing', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'startDate and endDate query parameters are required (YYYY-MM-DD format)' 
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }

    // Get active loans created within the date range
    const activeLoansResult = await pool.query(
      `SELECT 
        COUNT(*) as loan_count,
        SUM(loan_amount) as total_loan_amount,
        SUM(total_payable_amount) as total_payable_amount,
        SUM(interest_amount) as total_interest_amount
      FROM loans 
      WHERE status = $1 
        AND DATE(loan_issued_date) >= $2 
        AND DATE(loan_issued_date) <= $3`,
      ['active', startDate, endDate]
    );

    // Get due loans (active loans with due date within range)
    const dueLoansResult = await pool.query(
      `SELECT 
        COUNT(*) as loan_count,
        SUM(loan_amount) as total_loan_amount,
        SUM(total_payable_amount) as total_payable_amount,
        SUM(interest_amount) as total_interest_amount,
        SUM(remaining_balance) as total_remaining_balance
      FROM loans 
      WHERE status = $1 
        AND DATE(due_date) <= $2
        AND DATE(due_date) >= $3`,
      ['active', endDate, startDate]
    );

    // Get payment details for the period
    const paymentsResult = await pool.query(
      `SELECT 
        COUNT(*) as payment_count,
        SUM(payment_amount) as total_payments
      FROM payment_history 
      WHERE DATE(payment_date) >= $1 
        AND DATE(payment_date) <= $2`,
      [startDate, endDate]
    );

    const activeLoans = activeLoansResult.rows[0];
    const dueLoans = dueLoansResult.rows[0];
    const payments = paymentsResult.rows[0];

    res.json({
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      active_loans: {
        count: parseInt(activeLoans.loan_count) || 0,
        total_loaned_amount: parseFloat(activeLoans.total_loan_amount) || 0,
        total_payable_amount: parseFloat(activeLoans.total_payable_amount) || 0,
        total_interest_amount: parseFloat(activeLoans.total_interest_amount) || 0,
        average_loan_amount: parseInt(activeLoans.loan_count) > 0 
          ? (parseFloat(activeLoans.total_loan_amount) / parseInt(activeLoans.loan_count)).toFixed(2)
          : 0
      },
      due_loans: {
        count: parseInt(dueLoans.loan_count) || 0,
        total_loan_amount: parseFloat(dueLoans.total_loan_amount) || 0,
        total_payable_amount: parseFloat(dueLoans.total_payable_amount) || 0,
        total_interest_amount: parseFloat(dueLoans.total_interest_amount) || 0,
        total_remaining_balance: parseFloat(dueLoans.total_remaining_balance) || 0,
        average_remaining_balance: parseInt(dueLoans.loan_count) > 0
          ? (parseFloat(dueLoans.total_remaining_balance) / parseInt(dueLoans.loan_count)).toFixed(2)
          : 0
      },
      payments: {
        count: parseInt(payments.payment_count) || 0,
        total_amount: parseFloat(payments.total_payments) || 0
      }
    });
  } catch (err) {
    console.error('Error generating daily cash balancing report:', err);
    res.status(500).json({ 
      message: 'Error generating daily cash balancing report', 
      error: err.message 
    });
  }
});

// Get detailed breakdown of active loans by status
app.get('/reports/active-loans-breakdown', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'startDate and endDate query parameters are required' 
      });
    }

    // Get detailed active loans data
    const result = await pool.query(
      `SELECT 
        id,
        first_name,
        last_name,
        transaction_number,
        loan_amount,
        interest_amount,
        total_payable_amount,
        remaining_balance,
        loan_issued_date,
        due_date,
        status
      FROM loans 
      WHERE status = $1 
        AND DATE(loan_issued_date) >= $2 
        AND DATE(loan_issued_date) <= $3
      ORDER BY loan_issued_date DESC`,
      ['active', startDate, endDate]
    );

    res.json({
      count: result.rows.length,
      loans: result.rows.map(loan => ({
        id: loan.id,
        customer_name: `${loan.first_name} ${loan.last_name}`,
        transaction_number: loan.transaction_number,
        loan_amount: parseFloat(loan.loan_amount),
        interest_amount: parseFloat(loan.interest_amount),
        total_payable: parseFloat(loan.total_payable_amount),
        remaining_balance: parseFloat(loan.remaining_balance),
        issued_date: loan.loan_issued_date,
        due_date: loan.due_date,
        status: loan.status
      }))
    });
  } catch (err) {
    console.error('Error fetching active loans breakdown:', err);
    res.status(500).json({ 
      message: 'Error fetching active loans breakdown', 
      error: err.message 
    });
  }
});

// Get detailed breakdown of due loans
app.get('/reports/due-loans-breakdown', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'startDate and endDate query parameters are required' 
      });
    }

    // Get detailed due loans data
    const result = await pool.query(
      `SELECT 
        id,
        first_name,
        last_name,
        transaction_number,
        loan_amount,
        interest_amount,
        total_payable_amount,
        remaining_balance,
        loan_issued_date,
        due_date,
        status
      FROM loans 
      WHERE status = $1 
        AND DATE(due_date) <= $2
        AND DATE(due_date) >= $3
      ORDER BY due_date ASC`,
      ['active', endDate, startDate]
    );

    res.json({
      count: result.rows.length,
      loans: result.rows.map(loan => ({
        id: loan.id,
        customer_name: `${loan.first_name} ${loan.last_name}`,
        transaction_number: loan.transaction_number,
        loan_amount: parseFloat(loan.loan_amount),
        interest_amount: parseFloat(loan.interest_amount),
        total_payable: parseFloat(loan.total_payable_amount),
        remaining_balance: parseFloat(loan.remaining_balance),
        issued_date: loan.loan_issued_date,
        due_date: loan.due_date,
        days_overdue: Math.floor((new Date() - new Date(loan.due_date)) / (1000 * 60 * 60 * 24)),
        status: loan.status
      }))
    });
  } catch (err) {
    console.error('Error fetching due loans breakdown:', err);
    res.status(500).json({ 
      message: 'Error fetching due loans breakdown', 
      error: err.message 
    });
  }
});

// Get detailed breakdown of today's loans (or custom date range)
app.get('/reports/todays-loans-breakdown', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    let startDate, endDate;
    const { startDate: queryStart, endDate: queryEnd } = req.query;

    // Use custom date range if provided, otherwise use today
    if (queryStart && queryEnd) {
      startDate = queryStart;
      endDate = queryEnd;
    } else {
      const today = new Date().toISOString().split('T')[0];
      startDate = today;
      endDate = today;
    }

    // Get detailed loans data with customer info from customers table
    const result = await pool.query(
      `SELECT 
        l.id,
        l.transaction_number,
        l.loan_amount,
        l.collateral_description,
        l.item_description,
        l.loan_issued_date,
        l.due_date,
        l.status,
        c.first_name,
        c.last_name,
        c.mobile_phone,
        c.home_phone,
        c.email
      FROM loans l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE DATE(l.loan_issued_date) >= $1 
        AND DATE(l.loan_issued_date) <= $2
      ORDER BY l.loan_issued_date DESC`,
      [startDate, endDate]
    );

    console.log('📊 Loans breakdown query result:', {
      count: result.rows.length,
      firstLoan: result.rows[0] ? {
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name,
        mobile_phone: result.rows[0].mobile_phone,
        home_phone: result.rows[0].home_phone,
        collateral_description: result.rows[0].collateral_description,
        item_description: result.rows[0].item_description
      } : 'No loans found'
    });

    res.json({
      count: result.rows.length,
      startDate: startDate,
      endDate: endDate,
      loans: result.rows.map(loan => {
        // Build customer name from customer table
        const firstName = loan.first_name ? loan.first_name.trim() : '';
        const lastName = loan.last_name ? loan.last_name.trim() : '';
        const customerName = (firstName && lastName) ? `${firstName} ${lastName}` : 'Unknown Customer';

        // Use collateral_description, or fallback to item_description
        const collateralDescValue = loan.collateral_description ? loan.collateral_description.trim() : '';
        const itemDescValue = loan.item_description ? loan.item_description.trim() : '';
        const collateralDesc = collateralDescValue || itemDescValue || 'N/A';

        // Handle phone number - get from customer table
        const mobilePhone = loan.mobile_phone ? loan.mobile_phone.trim() : '';
        const homePhone = loan.home_phone ? loan.home_phone.trim() : '';
        const phoneNumber = mobilePhone || homePhone || 'N/A';

        return {
          id: loan.id,
          customer_name: customerName,
          transaction_number: loan.transaction_number,
          loan_amount: parseFloat(loan.loan_amount),
          collateral_description: collateralDesc,
          issued_date: loan.loan_issued_date,
          due_date: loan.due_date,
          phone_number: phoneNumber,
          status: loan.status
        };
      })
    });
  } catch (err) {
    console.error('Error fetching loans breakdown:', err);
    res.status(500).json({ 
      message: 'Error fetching loans breakdown', 
      error: err.message 
    });
  }
});

// ---------------------------- START SERVER ----------------------------

// Active Loans Report
app.get('/reports/active-loans', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    // First, let's check what statuses exist
    const statusCheck = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count FROM loans GROUP BY status
    `);
    console.log('📌 Loan Statuses in DB:', statusCheck.rows);

    const query = `
      SELECT 
        l.id,
        l.transaction_number,
        l.loan_amount,
        l.collateral_description,
        l.item_description,
        l.loan_issued_date,
        l.due_date,
        l.status,
        c.first_name,
        c.last_name,
        c.mobile_phone,
        c.home_phone
      FROM loans l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE LOWER(l.status) = 'active'
      ORDER BY l.loan_issued_date DESC
    `;

    const result = await pool.query(query);
    
    console.log('📊 Active Loans Query Result:', {
      count: result.rows.length,
      firstLoan: result.rows[0] ? {
        id: result.rows[0].id,
        transaction_number: result.rows[0].transaction_number,
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name,
        mobile_phone: result.rows[0].mobile_phone,
        home_phone: result.rows[0].home_phone,
        collateral_description: result.rows[0].collateral_description,
        item_description: result.rows[0].item_description,
        loan_amount: result.rows[0].loan_amount,
        loan_issued_date: result.rows[0].loan_issued_date
      } : 'No loans found'
    });
    
    res.json({
      count: result.rows.length,
      loans: result.rows.map(loan => {
        // Build customer name from customer table
        const firstName = loan.first_name ? loan.first_name.trim() : '';
        const lastName = loan.last_name ? loan.last_name.trim() : '';
        const customerName = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || lastName || 'Unknown Customer');

        // Use collateral_description, or fallback to item_description
        const collateralDescValue = loan.collateral_description ? loan.collateral_description.trim() : '';
        const itemDescValue = loan.item_description ? loan.item_description.trim() : '';
        const collateralDesc = collateralDescValue || itemDescValue || 'N/A';

        // Handle phone number - get from customer table
        const mobilePhone = loan.mobile_phone ? loan.mobile_phone.trim() : '';
        const homePhone = loan.home_phone ? loan.home_phone.trim() : '';
        const phoneNumber = mobilePhone || homePhone || 'N/A';

        return {
          id: loan.id,
          customer_name: customerName,
          transaction_number: loan.transaction_number || 'N/A',
          loan_amount: loan.loan_amount,
          collateral_description: collateralDesc,
          issued_date: loan.loan_issued_date,
          due_date: loan.due_date,
          phone_number: phoneNumber,
          status: loan.status
        };
      })
    });
  } catch (err) {
    console.error('❌ Error fetching active loans:', err);
    res.status(500).json({ message: 'Error fetching active loans' });
  }
});

// Overdue Loans Report
app.get('/reports/overdue-loans', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id,
        l.transaction_number,
        l.loan_amount,
        l.collateral_description,
        l.item_description,
        l.loan_issued_date,
        l.due_date,
        l.status,
        c.first_name,
        c.last_name,
        c.mobile_phone,
        c.home_phone
      FROM loans l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE LOWER(l.status) = 'overdue'
      ORDER BY l.due_date ASC
    `;

    const result = await pool.query(query);
    
    console.log('📊 Overdue Loans Query Result:', {
      count: result.rows.length,
      firstLoan: result.rows[0] ? {
        id: result.rows[0].id,
        transaction_number: result.rows[0].transaction_number,
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name,
        mobile_phone: result.rows[0].mobile_phone,
        home_phone: result.rows[0].home_phone,
        collateral_description: result.rows[0].collateral_description,
        item_description: result.rows[0].item_description,
        loan_amount: result.rows[0].loan_amount,
        loan_issued_date: result.rows[0].loan_issued_date,
        due_date: result.rows[0].due_date
      } : 'No loans found'
    });
    
    res.json({
      count: result.rows.length,
      loans: result.rows.map(loan => {
        // Build customer name from customer table
        const firstName = loan.first_name ? loan.first_name.trim() : '';
        const lastName = loan.last_name ? loan.last_name.trim() : '';
        const customerName = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || lastName || 'Unknown Customer');

        // Use collateral_description, or fallback to item_description
        const collateralDescValue = loan.collateral_description ? loan.collateral_description.trim() : '';
        const itemDescValue = loan.item_description ? loan.item_description.trim() : '';
        const collateralDesc = collateralDescValue || itemDescValue || 'N/A';

        // Handle phone number - get from customer table
        const mobilePhone = loan.mobile_phone ? loan.mobile_phone.trim() : '';
        const homePhone = loan.home_phone ? loan.home_phone.trim() : '';
        const phoneNumber = mobilePhone || homePhone || 'N/A';

        return {
          id: loan.id,
          customer_name: customerName,
          transaction_number: loan.transaction_number || 'N/A',
          loan_amount: loan.loan_amount,
          collateral_description: collateralDesc,
          issued_date: loan.loan_issued_date,
          due_date: loan.due_date,
          phone_number: phoneNumber,
          status: loan.status
        };
      })
    });
  } catch (err) {
    console.error('❌ Error fetching overdue loans:', err);
    res.status(500).json({ message: 'Error fetching overdue loans' });
  }
});

// Overdue Loans Report
app.get('/reports/overdue-loans', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  try {
    // Select overdue loans: status explicitly 'overdue' OR due_date in the past and not closed
    const query = `
      SELECT
        l.id,
        l.transaction_number,
        l.loan_amount,
        l.collateral_description,
        l.item_description,
        l.loan_issued_date,
        l.due_date,
        l.status,
        c.first_name,
        c.last_name,
        c.mobile_phone,
        c.home_phone
      FROM loans l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE LOWER(l.status) = 'overdue' OR (l.due_date < CURRENT_DATE AND LOWER(l.status) != 'closed')
      ORDER BY l.due_date ASC
    `;

    const result = await pool.query(query);

    console.log('📊 Overdue Loans Query Result:', {
      count: result.rows.length,
      firstLoan: result.rows[0] ? {
        id: result.rows[0].id,
        transaction_number: result.rows[0].transaction_number,
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name,
        mobile_phone: result.rows[0].mobile_phone,
        home_phone: result.rows[0].home_phone,
        collateral_description: result.rows[0].collateral_description,
        item_description: result.rows[0].item_description,
        loan_amount: result.rows[0].loan_amount,
        loan_issued_date: result.rows[0].loan_issued_date,
        due_date: result.rows[0].due_date
      } : 'No loans found'
    });

    res.json({
      count: result.rows.length,
      loans: result.rows.map(loan => {
        // Build customer name
        const firstName = loan.first_name ? loan.first_name.trim() : '';
        const lastName = loan.last_name ? loan.last_name.trim() : '';
        const customerName = (firstName && lastName) ? `${firstName} ${lastName}` : (firstName || lastName || 'Unknown Customer');

        // Collateral description fallback
        const collateralDescValue = loan.collateral_description ? loan.collateral_description.trim() : '';
        const itemDescValue = loan.item_description ? loan.item_description.trim() : '';
        const collateralDesc = collateralDescValue || itemDescValue || 'N/A';

        // Phone fallback
        const mobilePhone = loan.mobile_phone ? loan.mobile_phone.trim() : '';
        const homePhone = loan.home_phone ? loan.home_phone.trim() : '';
        const phoneNumber = mobilePhone || homePhone || 'N/A';

        return {
          id: loan.id,
          customer_name: customerName,
          transaction_number: loan.transaction_number || 'N/A',
          loan_amount: loan.loan_amount,
          collateral_description: collateralDesc,
          issued_date: loan.loan_issued_date,
          due_date: loan.due_date,
          phone_number: phoneNumber,
          status: loan.status
        };
      })
    });
  } catch (err) {
    console.error('❌ Error fetching overdue loans:', err);
    res.status(500).json({ message: 'Error fetching overdue loans' });
  }
});

// ========================= LOAN PDF RECEIPT DOWNLOAD =========================
// Endpoint to re-download loan receipt PDF
app.get('/api/loans/:loanId/receipt', authenticateToken, async (req, res) => {
  const { loanId } = req.params;

  try {
    // Validate loan ID
    const parsedLoanId = parseInt(loanId, 10);
    if (isNaN(parsedLoanId)) {
      return res.status(400).json({ message: 'Invalid loan ID format' });
    }

    // Fetch loan details from database with customer information
    const loanResult = await pool.query(
      `SELECT 
        l.*,
        c.first_name,
        c.last_name
       FROM loans l
       LEFT JOIN customers c ON l.customer_id = c.id
       WHERE l.id = $1`,
      [parsedLoanId]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const loan = loanResult.rows[0];

    console.log('📄 Generating receipt PDF for loan:', {
      id: loan.id,
      transaction_number: loan.transaction_number,
      customer_name_field: loan.customer_name,
      first_name: loan.first_name,
      last_name: loan.last_name,
      loan_amount: loan.loan_amount
    });

    // Generate PDF using existing PDF generator
    let pdfBuffer;
    try {
      pdfBuffer = await generateLoanPDF(loan);
    } catch (pdfError) {
      // Always log full error details to console for Railway debugging
      console.error('❌❌❌ PDF GENERATION FAILED ❌❌❌');
      console.error('Message:', pdfError.message);
      console.error('Type:', pdfError.name);
      console.error('Stack:', pdfError.stack);
      console.error('Loan:', { id: loan.id, amount: loan.loan_amount });
      console.error('Full error:', pdfError);
      
      return res.status(500).json({ 
        message: 'Failed to generate PDF',
        error: process.env.NODE_ENV === 'development' ? pdfError.message : 'PDF generation error',
        loanId: loan.id,
        env: process.env.NODE_ENV,
        errorMessage: pdfError.message // Always include message in response for debugging
      });
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('❌ PDF buffer is empty');
      return res.status(500).json({ message: 'Failed to generate PDF - empty buffer' });
    }

    // Send PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="loan_receipt_${loan.transaction_number || loan.id}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

    console.log('✅ Receipt PDF sent successfully for loan:', loan.id, '(', pdfBuffer.length, 'bytes)');
  } catch (err) {
    console.error('❌ Error generating receipt PDF:', err.message);
    console.error('   Full error:', err);
    console.error('   Stack:', err.stack);
    res.status(500).json({ 
      message: 'Error generating receipt PDF',
      error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
  }
});

// Add Express-level error handling middleware BEFORE server starts
app.use((err, req, res, next) => {
  console.error('💥 EXPRESS ERROR:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Catch 404 errors
app.use((req, res) => {
  console.warn('⚠️  404 Not Found:', req.method, req.path);
  res.status(404).json({ message: 'Endpoint not found', path: req.path });
});

// Add process-level error handling FIRST
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Initialize database schema if needed
async function initializeDatabase() {
  try {
    console.log('📋 Starting comprehensive database initialization...');

    // ====================
    // 1. CUSTOMERS TABLE
    // ====================
    const customerTableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      )`
    );
    
    if (!customerTableCheck.rows[0].exists) {
      console.log('📋 Creating missing customers table...');
      
      await pool.query(`
        CREATE SEQUENCE IF NOT EXISTS customers_id_seq AS integer START WITH 1 INCREMENT BY 1;
        
        CREATE TABLE IF NOT EXISTS customers (
          id integer NOT NULL DEFAULT nextval('customers_id_seq'),
          first_name character varying(100) NOT NULL,
          last_name character varying(100) NOT NULL,
          email character varying(255),
          home_phone character varying(20),
          mobile_phone character varying(20),
          birthdate date,
          id_type character varying(50),
          id_number character varying(100),
          referral character varying(255),
          identification_info text,
          street_address character varying(255),
          city character varying(128),
          state character varying(64),
          zipcode character varying(32),
          customer_number character varying(50),
          created_by_user_id integer,
          created_by_username character varying(100),
          updated_by_user_id integer,
          updated_by_username character varying(100),
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          profile_image text,
          PRIMARY KEY (id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
        CREATE INDEX IF NOT EXISTS idx_customers_first_name ON customers(first_name);
        CREATE INDEX IF NOT EXISTS idx_customers_home_phone ON customers(home_phone);
        CREATE INDEX IF NOT EXISTS idx_customers_last_name ON customers(last_name);
        CREATE INDEX IF NOT EXISTS idx_customers_mobile_phone ON customers(mobile_phone);
      `);
      
      console.log('✅ Customers table created successfully');
    }

    // ====================
    // 2. LOANS TABLE - Add Missing Columns
    // ====================
    const loansTableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'loans'
      )`
    );

    if (loansTableCheck.rows[0].exists) {
      console.log('📋 Checking loans table for missing columns...');
      
      // List of columns to ensure exist in loans table
      const requiredColumns = [
        { name: 'customer_id', definition: 'customer_id integer REFERENCES customers(id)' },
        { name: 'recurring_fee', definition: 'recurring_fee DECIMAL(10, 2) DEFAULT 0.00' },
        { name: 'redemption_fee', definition: 'redemption_fee DECIMAL(10, 2) DEFAULT 0.00' },
        { name: 'collateral_image', definition: 'collateral_image text' }
      ];

      for (const col of requiredColumns) {
        try {
          const columnCheck = await pool.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'loans' 
              AND column_name = $1
            )`,
            [col.name]
          );

          if (!columnCheck.rows[0].exists) {
            console.log(`  📝 Adding column: ${col.name}`);
            await pool.query(`ALTER TABLE loans ADD COLUMN ${col.definition}`);
            console.log(`  ✅ Column added: ${col.name}`);
          } else {
            console.log(`  ✓ Column exists: ${col.name}`);
          }
        } catch (addColumnErr) {
          console.warn(`  ⚠️  Could not add ${col.name} column:`, addColumnErr.message);
        }
      }
    }

    // ====================
    // 3. USER_ROLES TABLE - Ensure Default Roles Exist
    // ====================
    try {
      const roleCheckResult = await pool.query(
        `SELECT COUNT(*) as count FROM user_roles`
      );
      
      if (roleCheckResult.rows[0].count === 0) {
        console.log('📋 Inserting default user roles...');
        await pool.query(`
          INSERT INTO user_roles (role_name) VALUES 
          ('admin'),
          ('staff'),
          ('manager'),
          ('user')
          ON CONFLICT (role_name) DO NOTHING
        `);
        console.log('✅ Default user roles inserted');
      } else {
        console.log(`✓ User roles already exist (${roleCheckResult.rows[0].count} roles)`);
      }
    } catch (rolesErr) {
      console.warn('⚠️  Could not ensure user roles:', rolesErr.message);
    }

    // ====================
    // 4. Additional Tables - Check & Log Status
    // ====================
    const tablesToCheck = [
      'payment_history',
      'payments',
      'redemption_history',
      'forfeiture_history',
      'shift_management',
      'shifts',
      'redeem_history'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const tableCheck = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [tableName]
        );

        if (tableCheck.rows[0].exists) {
          console.log(`✓ Table exists: ${tableName}`);
        } else {
          console.warn(`⚠️  Missing table: ${tableName}`);
        }
      } catch (err) {
        console.warn(`⚠️  Error checking table ${tableName}:`, err.message);
      }
    }

    console.log('✅ Database initialization complete');
  } catch (err) {
    console.warn('⚠️  Database initialization warning:', err.message);
    // Don't exit - continue startup even if initialization fails
  }
}

// Initialize database in background (don't block server startup)
initializeDatabase().then(() => {
  console.log('✅ Database initialization complete');
}).catch((err) => {
  console.warn('⚠️  Database initialization failed:', err.message);
});

// Start HTTP server
console.log('⚙️  Starting PawnFlow Server...');
console.log('🔌 Listening on port', PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log('✅ Server started successfully');
});

// Enable keepalive to prevent connection timeouts
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

// Log when server closes
server.on('close', () => {
  console.log('⚠️  Server closed');
});







































