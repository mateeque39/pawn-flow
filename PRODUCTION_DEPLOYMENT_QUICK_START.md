# 🚀 PRODUCTION DEPLOYMENT QUICK SETUP

**Status:** ✅ Ready to Deploy  
**Updated:** December 6, 2025

---

## 3-STEP QUICK START

### Step 1: Generate Production JWT Secret (5 min)

Open PowerShell and run:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the output. You'll use this in Step 2.

---

### Step 2: Create Production .env Files (10 min)

#### Backend: `.env.production`
Open `c:\Users\HP\pawn-flow\.env.production` and replace:

```dotenv
DATABASE_URL=postgresql://[DB_USER]:[DB_PASSWORD]@[DB_HOST]:5432/[DB_NAME]
JWT_SECRET=[PASTE_GENERATED_SECRET_HERE]
CORS_ORIGINS=https://your-domain.com
API_URL=https://your-domain.com
```

**Get these from GoDaddy cPanel:**
- DB_USER, DB_PASSWORD, DB_HOST, DB_NAME from Database section
- your-domain.com is your actual domain

#### Frontend: `.env.production.local`
Open `c:\Users\HP\pawn-flow-frontend\.env.production.local` and replace:

```dotenv
REACT_APP_API_URL=https://your-domain.com
```

---

### Step 3: Build for Production (5 min)

```powershell
cd 'c:\Users\HP\pawn-flow-frontend'
npm run build:prod
```

Wait for build to complete. Check `/build` folder is created.

---

## 🔄 Before GoDaddy Upload

✅ Checklist:
- [ ] JWT_SECRET generated (32+ chars)
- [ ] `.env.production` filled with GoDaddy credentials
- [ ] `.env.production.local` filled with domain
- [ ] Frontend build created
- [ ] Node syntax OK: `node --check c:\Users\HP\pawn-flow\server.js`
- [ ] No localhost URLs
- [ ] .gitignore has `.env` files

---

## 📋 GoDaddy Upload Checklist

### Files to Upload:
```
/pawn-flow/              → Backend files
  ├─ server.js
  ├─ package.json
  ├─ pdf-invoice-generator.js
  ├─ validators.js
  ├─ .env.production      (DO NOT COMMIT)
  └─ migrations/          (SQL migration files)

/pawn-flow-frontend/build/  → Frontend static files
  (entire /build directory)
```

### Upload Method:
- Use SFTP or FTP via GoDaddy cPanel
- Backend → `/home/username/pawn_flow/`
- Frontend → `/public_html/` or `/var/www/html/`

---

## 🖥️ GoDaddy Server Setup (via SSH)

```bash
# 1. SSH into GoDaddy
ssh username@your-domain.com

# 2. Navigate to backend
cd ~/pawn_flow

# 3. Install dependencies
npm install --production

# 4. Install PM2
npm install -g pm2

# 5. Run database migrations
psql -U [username] -d [dbname] < migrations/001_initial_schema.sql
# (run each migration in order)

# 6. Start application
pm2 start server.js --name pawnflow

# 7. Enable auto-restart
pm2 startup
pm2 save

# 8. Check status
pm2 list
pm2 logs pawnflow
```

---

## ✅ Verify Production

After upload, test:

1. **Frontend loads:** https://your-domain.com
2. **Login works:** Use admin credentials
3. **Create loan:** Test loan creation
4. **Generate PDF:** Verify PDF downloads
5. **View reports:** Check all dashboard reports
6. **Check logs:** `pm2 logs pawnflow`

---

## 🚨 If Something Breaks

### Check Logs:
```bash
pm2 logs pawnflow --lines 50
```

### Common Issues:

**Error: DATABASE_URL not set**
- Fix: Copy .env.production to production server
- Restart: `pm2 restart pawnflow`

**Error: JWT_SECRET not properly configured**
- Fix: Verify JWT_SECRET in .env.production is 32+ chars
- Restart: `pm2 restart pawnflow`

**Error: CORS origin not allowed**
- Fix: Check CORS_ORIGINS in .env.production matches domain
- Restart: `pm2 restart pawnflow`

**Frontend 404 errors**
- Fix: Verify frontend /build folder uploaded to web root
- Check: Files in `/public_html/static/`

**Database connection refused**
- Fix: Verify DATABASE_URL is correct
- Test: `psql -h [host] -U [user] -d [dbname]`

---

## 📊 Production Environment Template

```dotenv
# BACKEND PRODUCTION TEMPLATE
# File: .env.production

# Database (from GoDaddy cPanel)
DATABASE_URL=postgresql://your_user:your_pass@your_host:5432/your_db

# Security
JWT_SECRET=<generated_32_char_hex_string>
NODE_ENV=production

# Domain
CORS_ORIGINS=https://your-domain.com
API_URL=https://your-domain.com

# Server
PORT=5000

# Features
ENABLE_PDF_GENERATION=true
ENABLE_CRON_JOBS=true
LOG_LEVEL=info
```

---

## 🔐 Security Reminders

🔴 **CRITICAL:**
- ❌ Never commit .env files
- ❌ Never hardcode passwords
- ❌ Never use development JWT_SECRET
- ❌ Never deploy without HTTPS
- ✅ Always use environment variables
- ✅ Always use HTTPS URLs
- ✅ Always generate new JWT_SECRET
- ✅ Always backup database first

---

## 📞 Support Files

All in `c:\Users\HP\pawn-flow\`:

1. `SECURITY_FIXES_COMPLETE.md` - Details of all security fixes
2. `GODADDY_STEP_BY_STEP.md` - Detailed deployment steps
3. `GODADDY_DEPLOYMENT_GUIDE.md` - Complete technical guide
4. `GODADDY_QUICK_REFERENCE.md` - Command reference
5. `DEPLOYMENT_READINESS_ASSESSMENT.md` - Full assessment

---

## ✨ You're All Set!

Your project is **secure and ready for production deployment.**

**Next Action:** Follow Step 1-3 above, then upload to GoDaddy!

---

*Ready to deploy in ~20 minutes!* 🚀
