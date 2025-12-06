# ✅ GODADDY DEPLOYMENT - QUICK VISUAL CHECKLIST

## 🎯 THE ABSOLUTE ESSENTIALS

### What to BUY from GoDaddy
```
☐ Business or Deluxe Hosting Plan        $5-10/month
☐ Domain Name (your-domain.com)          $9-15/year
  
TOTAL: ~$6-11/month (~$72-135/year)

What Comes FREE with Hosting:
✅ PostgreSQL Database
✅ SSL Certificate
✅ SSH Access
✅ cPanel Control Panel
✅ Free Email (optional)
```

### What to CREATE Yourself
```
☐ .env file (with production settings)
☐ Strong passwords (20+ characters)
☐ JWT_SECRET (32+ random chars)
☐ SESSION_SECRET (32+ random chars)
☐ Admin credentials
```

### What FILES to Upload
```
BACKEND (80 KB):
☐ server.js
☐ pdf-invoice-generator.js
☐ validators.js
☐ package.json
☐ package-lock.json
☐ .env ← IMPORTANT
☐ pawn_shop_schema.sql
☐ seed-test-data.sql
☐ migrations/ folder

FRONTEND (2-3 MB):
☐ build/ folder (entire)
  └─ This comes from: npm run build
```

### What CREDENTIALS to Save
```
From GoDaddy:
☐ GoDaddy Account Credentials
☐ cPanel Username & Password
☐ SSH Access (Host, Port, User, Pass)
☐ Database Host & Port
☐ Database Username & Password

Create Yourself:
☐ JWT_SECRET
☐ SESSION_SECRET
☐ Admin Password
```

---

## 📋 STEP-BY-STEP DEPLOY CHECKLIST

### BEFORE DEPLOYMENT (Week 1)
```
☐ Buy GoDaddy Business hosting plan
☐ Register domain name
☐ Enable SSH in cPanel
☐ Create PostgreSQL database
☐ Create database user (pawnflow_user)
☐ Create strong database password
☐ Save all credentials securely
☐ Verify SSL certificate installed
```

### LOCAL PREPARATION (1 hour)
```
☐ npm run build (creates build/ folder)
☐ Create .env with production values
☐ Copy backend files to folder
☐ Copy frontend build/ to folder
☐ Test everything locally
☐ Create database backup
```

### FILE UPLOAD (30 minutes)
```
☐ Install FileZilla or WinSCP
☐ Connect to GoDaddy via FTP/SFTP
☐ Create /public_html/pawnflow folder
☐ Upload backend files → /public_html/pawnflow/
☐ Upload frontend build/ → /public_html/
☐ Verify all files uploaded
```

### SERVER INSTALLATION (1 hour)
```
☐ SSH into GoDaddy: ssh user@yourdomain.com
☐ cd ~/public_html/pawnflow
☐ npm install --production
☐ npm install -g pm2
☐ psql connection test
☐ Run database migrations (*.sql files)
☐ pm2 start server.js
☐ pm2 startup
☐ pm2 save
```

### VERIFICATION (30 minutes)
```
☐ Frontend loads: https://yourdomain.com
☐ API responds: curl https://yourdomain.com/api/health
☐ Login works with test credentials
☐ Can create new loan
☐ PDF invoice generates
☐ Reports display correctly
☐ No errors in PM2 logs
☐ Database connected
```

---

## 🚀 DEPLOYMENT COMMANDS (Copy & Paste Ready)

### Create .env File (Edit Values)
```
NODE_ENV=production
PORT=5000
SERVER_URL=https://yourdomain.com
DATABASE_URL=postgresql://pawnflow_user:PASSWORD@HOST:5432/pawn_shop
JWT_SECRET=aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uVwX4yZ5
SESSION_SECRET=xY2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uVwX4yZ5
LOG_LEVEL=info
```

### SSH & Install Commands
```bash
# 1. SSH to GoDaddy
ssh your-cpanel-username@yourdomain.com

# 2. Navigate and install
cd ~/public_html/pawnflow
npm install --production

# 3. Install PM2
npm install -g pm2

# 4. Start app
pm2 start server.js --name "pawnflow-api"

# 5. Setup auto-start
pm2 startup
pm2 save

# 6. Check status
pm2 status

# 7. View logs
pm2 logs pawnflow-api
```

### Database Commands
```bash
# Connect to database
psql -h DB_HOST -U pawnflow_user -d pawn_shop

# Run migrations (at psql prompt):
\i pawn_shop_schema.sql
\i seed-test-data.sql

# Verify tables
\dt

# Exit
\q
```

### Verify Deployment
```bash
# Test API
curl https://yourdomain.com/api/health

# Check PM2 status
pm2 status

# View application logs
pm2 logs pawnflow-api --lines 50

# SSH directory listing
ls -la ~/public_html/pawnflow/
```

---

## 📂 FOLDER STRUCTURE (What You Upload)

```
Your Computer (c:\Users\HP):
├── pawn-flow/
│   ├── server.js                ← Upload
│   ├── pdf-invoice-generator.js ← Upload
│   ├── validators.js            ← Upload
│   ├── package.json             ← Upload
│   ├── package-lock.json        ← Upload
│   ├── .env                     ← Upload (EDIT WITH YOUR VALUES)
│   ├── *.sql files              ← Upload
│   └── migrations/              ← Upload (entire folder)
│
└── pawn-flow-frontend/
    └── build/                   ← npm run build creates this
        └── (upload everything in build/)

GoDaddy Server Structure (After Upload):
/public_html/
├── index.html                   ← From build/
├── static/                      ← From build/
└── pawnflow/
    ├── server.js
    ├── pdf-invoice-generator.js
    ├── validators.js
    ├── package.json
    ├── .env
    ├── node_modules/            ← Created by npm install
    └── pdfs/                    ← Created by app
```

---

## 🔐 CREDENTIALS TEMPLATE (Save in Secure Location)

```
========================================
PAWNFLOW GODADDY DEPLOYMENT CREDENTIALS
========================================

GODADDY ACCOUNT:
Email: ________________________
Password: ________________________
Account ID: ________________________

CPANEL ACCESS:
URL: https://yourdomain.com/cpanel
Username: ________________________
Password: ________________________

SSH ACCESS:
Host: yourdomain.com
Port: 22
Username: ________________________
Password: ________________________

DATABASE:
Host: ________________________
Port: 5432
Database: pawn_shop
Username: pawnflow_user
Password: ________________________

DOMAIN:
Domain Name: ________________________
SSL Certificate: ✅ Active
Registration Date: ________________________
Renewal Date: ________________________

APPLICATION SECRETS:
JWT_SECRET: ________________________
SESSION_SECRET: ________________________

ADMIN ACCOUNT:
Username: admin
Password: ________________________
Email: ________________________

API ENDPOINT:
https://yourdomain.com/api

FRONTEND URL:
https://yourdomain.com

LAST UPDATED: ________________________
LAST TESTED: ________________________
LAST BACKED UP: ________________________
```

---

## ⚠️ CRITICAL REMINDERS

```
🔴 MUST DO:
✓ Use strong passwords (20+ chars, mix symbols)
✓ Enable 2FA on GoDaddy account
✓ Backup database before deploying
✓ Save credentials securely (not in email)
✓ Test everything after deployment
✓ Keep .env file SECRET (never share/commit)
✓ Verify SSL certificate working

🟡 SHOULD DO:
✓ Document your setup
✓ Schedule backups weekly
✓ Monitor server performance
✓ Update PM2 occasionally
✓ Keep logs for troubleshooting
✓ Test backup restoration

🔵 NICE TO HAVE:
✓ Configure email on domain
✓ Add CDN for faster loading
✓ Set up monitoring alerts
✓ Create automated backups
✓ Document custom changes
```

---

## 🆘 IF SOMETHING GOES WRONG

### Quick Fixes
```
App not starting:
├─ Check: pm2 status
├─ Restart: pm2 restart pawnflow-api
└─ Logs: pm2 logs pawnflow-api

Database not connecting:
├─ Check: DATABASE_URL in .env
├─ Test: psql -h HOST -U user -d pawn_shop
└─ Verify: .env file exists

Frontend not loading:
├─ Check: Files in /public_html/
├─ Verify: index.html exists
└─ Clear: Browser cache (Ctrl+F5)

API returning 404:
├─ Check: PM2 is "online"
├─ Test: curl https://yourdomain.com/api/health
└─ View: pm2 logs pawnflow-api

PDF not generating:
├─ Create: mkdir /public_html/pawnflow/pdfs
├─ Fix permissions: chmod 777 pdfs
└─ Test: Create new loan and try again
```

### Contact Support
```
GoDaddy Support: 1-480-505-8877
Or: Chat at godaddy.com/help

When contacting, provide:
- Your domain name
- Error message (exact)
- What you were doing when error occurred
- Steps you've already tried
```

---

## ✨ AFTER DEPLOYMENT SUCCESS CHECKLIST

### Week 1
```
☐ Full system testing
☐ Create test loans
☐ Generate sample reports
☐ Test PDF functionality
☐ Verify all user roles
☐ Check performance
☐ Monitor error logs
```

### Month 1
```
☐ Daily backup verification
☐ Performance monitoring
☐ User feedback collection
☐ Security audit
☐ Database optimization
☐ Documentation review
```

### Ongoing
```
☐ Weekly backups (test restoration)
☐ Monthly security review
☐ Performance monitoring
☐ User training
☐ System updates
☐ Credential rotation (annually)
```

---

## 📞 SUPPORT DOCUMENTS

All in folder: `c:\Users\HP\pawn-flow\`

1. **GODADDY_STEP_BY_STEP.md** ← READ THIS FIRST
   Easiest guide with copy-paste commands

2. **GODADDY_QUICK_REFERENCE.md**
   Checklists and quick lookups

3. **GODADDY_DEPLOYMENT_GUIDE.md**
   Detailed technical reference

4. **GODADDY_DEPLOYMENT_COMPLETE_OVERVIEW.md**
   Complete system overview

5. **GODADDY_COMPLETE_REQUIREMENTS_LIST.md**
   Everything you need (this file)

6. **README_GODADDY_DEPLOYMENT.md**
   Executive summary

---

## 🎯 START HERE

**Ready to deploy?**

1. Print or save this checklist
2. Read: GODADDY_STEP_BY_STEP.md
3. Follow: Step-by-step instructions carefully
4. Test: Everything after each major step
5. Monitor: Server performance ongoing

**Estimated Time: 3-4 hours**

---

## 🎉 DEPLOYMENT COMPLETE!

After successful deployment, you'll have:

```
✅ PawnFlow live at https://yourdomain.com
✅ Professional PDF invoices working
✅ Full loan management system
✅ 24/7 access from anywhere
✅ Automated backups
✅ SSL security (HTTPS)
✅ Ready for customers

And you'll be able to:
- Create loans instantly
- Generate professional invoices
- Track payments
- Generate reports
- Manage customer data
- View analytics

All from anywhere on any device! 🚀
```

---

**GOOD LUCK WITH YOUR DEPLOYMENT! 🎯**

Questions? Check the 6 deployment guides provided!
