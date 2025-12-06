# 👨‍💻 STEP-BY-STEP GODADDY DEPLOYMENT GUIDE

## BEFORE YOU START
- [ ] Have GoDaddy account ready (or create one)
- [ ] Have domain name ready (register at GoDaddy)
- [ ] Have your project files backed up
- [ ] Have notepad ready to save credentials

---

## PHASE 1: GODADDY ACCOUNT SETUP (30 minutes)

### Step 1.1: Create/Access GoDaddy Account
```
1. Go to https://www.godaddy.com
2. Sign up or log in to existing account
3. Save credentials in safe place
```

### Step 1.2: Register Domain (If needed)
```
1. Go to GoDaddy > Domains
2. Search for your domain name (e.g., pawnflow.com)
3. Add to cart
4. Complete purchase ($9-15/year)
5. Save domain name
```

### Step 1.3: Purchase Hosting Plan
```
1. Go to GoDaddy > Web Hosting
2. Choose: Business or Deluxe Plan ($5-10/month)
   ✓ Must have Node.js support
   ✓ Must have PostgreSQL support
3. Add to cart
4. Complete purchase
5. Wait for activation email (1-24 hours)
```

### Step 1.4: Enable SSH Access
```
1. Go to GoDaddy > My Products > Web Hosting
2. Click on your hosting plan
3. Go to Manage → Settings
4. Find "SSH Access" section
5. Enable SSH access
6. Save settings
7. Note your SSH Host: yourdomain.com
```

### Step 1.5: Create PostgreSQL Database
```
1. In GoDaddy cPanel, find "Databases" section
2. Click "PostgreSQL Databases"
3. Create new database:
   Name: pawn_shop
   Click "Create Database"
4. Create database user:
   Username: pawnflow_user
   Password: [Generate strong password - 20+ chars]
   Click "Create User"
5. Add user to database:
   Select pawnflow_user
   Select pawn_shop
   Click "Add User to Database"
6. SAVE THESE CREDENTIALS:
   ├─ Hostname: [shown in GoDaddy]
   ├─ Database: pawn_shop
   ├─ Username: pawnflow_user
   └─ Password: [your strong password]
```

**✅ PHASE 1 COMPLETE** - You now have GoDaddy account set up!

---

## PHASE 2: LOCAL PREPARATION (1 hour)

### Step 2.1: Build Frontend
```bash
# Open PowerShell in pawn-flow-frontend directory
cd c:\Users\HP\pawn-flow-frontend

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# This creates a "build" folder with all files ready to deploy
# Size will be ~2-3 MB
```

### Step 2.2: Create Production .env File
```bash
# In c:\Users\HP\pawn-flow directory, create file: .env

# Copy this content and REPLACE the values:

NODE_ENV=production
PORT=5000
SERVER_URL=https://yourdomain.com

DATABASE_URL=postgresql://pawnflow_user:YOUR_STRONG_PASSWORD@YOUR_GODADDY_HOST:5432/pawn_shop

JWT_SECRET=your_random_32_character_string_here_make_it_unique
SESSION_SECRET=another_random_32_character_string_for_session

LOG_LEVEL=info
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_TIME=900
```

**Replace with YOUR values:**
- `YOUR_STRONG_PASSWORD` → The PostgreSQL password from Step 1.5
- `YOUR_GODADDY_HOST` → Your GoDaddy database host
- `yourdomain.com` → Your actual domain
- `JWT_SECRET` → Any random 32+ character string
- `SESSION_SECRET` → Any random 32+ character string

### Step 2.3: Backup Database Locally
```bash
# Create backup of current database (for safety)
cd c:\Users\HP\pawn-flow

# Database should already have pawn_shop_schema.sql
# and seed-test-data.sql in this directory

# Verify they exist:
dir | findstr ".sql"

# You should see:
# pawn_shop_schema.sql
# seed-test-data.sql
```

### Step 2.4: Prepare Files for Upload
```
Create a folder: PAWNFLOW_DEPLOYMENT

Copy these files to that folder:

Backend Files (from c:\Users\HP\pawn-flow):
├── server.js
├── pdf-invoice-generator.js
├── validators.js
├── package.json
├── package-lock.json
├── .env (the one you just created)
├── pawn_shop_schema.sql
├── seed-test-data.sql
├── README.md
└── migrations/ (entire folder)

Frontend Files (from c:\Users\HP\pawn-flow-frontend):
└── build/ (entire folder - this is what npm run build created)
```

**✅ PHASE 2 COMPLETE** - Files ready for deployment!

---

## PHASE 3: UPLOAD TO GODADDY (30 minutes)

### Step 3.1: Connect to GoDaddy via FTP

**Using FileZilla (Recommended):**

```
1. Download FileZilla: https://filezilla-project.org/

2. Open FileZilla and add new site:
   - Protocol: SFTP (SSH File Transfer Protocol)
   - Host: yourdomain.com
   - Port: 22
   - Username: your-cpanel-username
   - Password: your-cpanel-password
   - Click "Connect"

3. Left side: Your local PAWNFLOW_DEPLOYMENT folder
   Right side: GoDaddy server (/public_html)
```

### Step 3.2: Upload Backend Files
```
1. In FileZilla, create folder on GoDaddy:
   Right-click in /public_html → Create Folder → "pawnflow"

2. Drag these files to /public_html/pawnflow:
   ├── server.js
   ├── pdf-invoice-generator.js
   ├── validators.js
   ├── package.json
   ├── package-lock.json
   ├── .env ← IMPORTANT: This has credentials
   ├── pawn_shop_schema.sql
   ├── seed-test-data.sql
   ├── README.md
   └── migrations/ (entire folder)

3. Wait for upload to complete
4. Verify all files are there
```

### Step 3.3: Upload Frontend Files
```
1. In FileZilla, drag all files from /build/ folder
   to /public_html/ on GoDaddy

2. Files should include:
   ├── index.html
   ├── static/ (entire folder)
   ├── favicon.ico
   ├── manifest.json
   └── [other build files]

3. Wait for upload to complete
4. Your frontend will be at: https://yourdomain.com
```

**✅ PHASE 3 COMPLETE** - Files uploaded to GoDaddy!

---

## PHASE 4: INSTALL & CONFIGURE (1 hour)

### Step 4.1: Connect via SSH
```bash
# Open PowerShell and SSH into GoDaddy
ssh your-cpanel-username@yourdomain.com

# Enter password when prompted
# You should see: [user@host ~]$
```

### Step 4.2: Navigate to App Directory
```bash
cd ~/public_html/pawnflow

# Verify files are there:
ls -la

# You should see:
# server.js, pdf-invoice-generator.js, validators.js, etc.
```

### Step 4.3: Install Node Dependencies
```bash
npm install --production

# This will:
# - Read package.json
# - Download ~300 packages
# - Create node_modules folder
# - Takes 2-5 minutes

# When done, you'll see: "added XXX packages"
```

### Step 4.4: Install PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version

# Should show version number (e.g., 5.3.0)
```

### Step 4.5: Setup Database
```bash
# Connect to PostgreSQL on GoDaddy
psql -h YOUR_GODADDY_HOST -U pawnflow_user -d pawn_shop

# When prompted for password, enter: YOUR_STRONG_PASSWORD

# You should see: pawn_shop=#

# Now run the schema migration:
\i pawn_shop_schema.sql

# Should show: CREATE TABLE, CREATE INDEX messages

# Load test data:
\i seed-test-data.sql

# Verify tables:
\dt

# You should see tables: customers, loans, payments, users, etc.

# Exit PostgreSQL:
\q
```

**✅ PHASE 4 COMPLETE** - Everything installed and configured!

---

## PHASE 5: START APPLICATION (15 minutes)

### Step 5.1: Start App with PM2
```bash
# You should still be SSH'd into GoDaddy
cd ~/public_html/pawnflow

# Start the application
pm2 start server.js --name "pawnflow-api"

# Should show: [PM2] spawning with name pawnflow-api

# Check status
pm2 status

# Should show: pawnflow-api | online | 0
```

### Step 5.2: Enable Auto-Start on Reboot
```bash
# Save PM2 configuration
pm2 save

# Setup auto-startup on server reboot
pm2 startup

# Follow the instructions given by PM2
# It will output a command to run - copy and paste it
```

### Step 5.3: Check Application Logs
```bash
# View application logs
pm2 logs pawnflow-api

# Press Ctrl+C to exit logs

# Should show messages like:
# ⚙️ Starting PawnFlow Server...
# 🔌 Listening on port 5000
# ✅ Server started successfully
```

**✅ PHASE 5 COMPLETE** - App is running on GoDaddy!

---

## PHASE 6: VERIFICATION & TESTING (30 minutes)

### Step 6.1: Test Backend API
```bash
# From your local machine (not SSH), test API:

# Test 1: Health check
curl https://yourdomain.com/api/health

# Expected: 200 OK response

# Test 2: Try login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Expected: 200 OK with JWT token
```

### Step 6.2: Test Frontend
```
1. Open browser
2. Go to: https://yourdomain.com
3. You should see: PawnFlow login page
4. Login with:
   Username: admin
   Password: admin
5. You should see: Dashboard with no errors
```

### Step 6.3: Test PDF Generation
```
1. Login to PawnFlow
2. Go to: Loans → Create Loan
3. Fill in loan details
4. Click: Create Loan
5. Click: Download Invoice (PDF)
6. You should see: PDF invoice with exact template format
```

### Step 6.4: Test Database Connection
```bash
# SSH back into server
ssh your-cpanel-username@yourdomain.com

# Connect to database and verify data
psql -h YOUR_GODADDY_HOST -U pawnflow_user -d pawn_shop

# Check if test data is there:
SELECT * FROM loans LIMIT 1;

# Should show: loan record with ID, amount, etc.

# Exit:
\q
```

**✅ PHASE 6 COMPLETE** - Everything tested and working!

---

## PHASE 7: FINAL CHECKS & TROUBLESHOOTING

### Step 7.1: Common Issues & Fixes

**Problem: "Connection refused" when accessing API**
```bash
# Check if PM2 app is running
pm2 status

# Should show: pawnflow-api | online

# If offline, restart:
pm2 restart pawnflow-api

# Check logs:
pm2 logs pawnflow-api
```

**Problem: "Database connection failed"**
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Verify connection:
psql -h YOUR_HOST -U pawnflow_user -d pawn_shop

# Test from app SSH:
node -e "const pg = require('pg'); 
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
}); 
pool.query('SELECT NOW()', (err, res) => {
  console.log(err || res.rows[0]);
  process.exit();
});"
```

**Problem: "Frontend shows 404 errors"**
```bash
# Check if build files uploaded
ls -la ~/public_html/index.html

# Should exist

# Check if index.html is there
ls -la ~/public_html/static/

# Should have js/ and css/ folders
```

**Problem: "PDF not generating"**
```bash
# Check if pdfs folder exists
ls -la ~/public_html/pawnflow/pdfs/

# If doesn't exist, create it:
mkdir ~/public_html/pawnflow/pdfs

# Check permissions:
chmod 777 ~/public_html/pawnflow/pdfs
```

### Step 7.2: Performance Check
```bash
# Check server resource usage
ps aux | grep node

# Check disk usage
df -h

# Check database size
psql -U pawnflow_user -d pawn_shop -c "SELECT pg_size_pretty(pg_database_size('pawn_shop'));"
```

---

## ✅ DEPLOYMENT COMPLETE!

### Your PawnFlow System is Now Live:

```
Frontend URL: https://yourdomain.com
API URL: https://yourdomain.com/api
Admin Login: 
  Username: admin
  Password: admin

PDF Invoices: Generated automatically when loans created
Reports: Accessible from dashboard
Database: Backed up at GoDaddy
```

### Next Steps:
1. Change admin password (Security)
2. Add new users/staff accounts
3. Create sample loans and test
4. Configure automated backups
5. Monitor server performance

---

## 📞 NEED HELP?

### If Something Doesn't Work:

**Check These First:**
1. PM2 status: `pm2 status`
2. PM2 logs: `pm2 logs pawnflow-api`
3. Database connection: `psql -h host -U user -d pawn_shop`
4. File uploads: Check files exist on server
5. Environment variables: Check `.env` file

**Contact GoDaddy Support:**
- Phone: 1-480-505-8877
- Chat: https://www.godaddy.com/help
- Have your domain and cPanel username ready

---

## 🎉 SUCCESS!

Your PawnFlow system is now deployed on GoDaddy and accessible 24/7!

Users can now:
- ✅ Access from anywhere via https://yourdomain.com
- ✅ Create loans with full details
- ✅ Download professional PDF invoices
- ✅ Process payments
- ✅ View reports and analytics

Congratulations on your deployment! 🚀
