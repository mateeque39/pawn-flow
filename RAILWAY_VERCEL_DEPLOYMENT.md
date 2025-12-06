# Railway & Vercel Deployment Instructions

## 📋 Overview

This guide provides complete step-by-step instructions to deploy the Pawnflow system:
- **Backend**: Node.js/Express on Railway
- **Frontend**: React on Vercel
- **Database**: PostgreSQL on Railway

---

## 🚀 PART 1: RAILWAY BACKEND DEPLOYMENT

### Prerequisites
- Railway account (https://railway.app)
- GitHub account with push access to https://github.com/Qasimcnc/Pawnflow-backend
- Project has all 4 migrations in `/migrations` folder

### Step 1: Create Railway Project

1. **Login to Railway**: https://railway.app
2. **Create new project**: Click "New Project" button
3. **Add PostgreSQL database**: 
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create and provision PostgreSQL
   - Note the database credentials (will appear in environment variables)

### Step 2: Connect GitHub Repository

1. **In Railway dashboard**, click "Add service"
2. **Select "GitHub Repo"**
3. **Authorize Railway**: Connect your GitHub account
4. **Select repository**: Choose `Qasimcnc/Pawnflow-backend`
5. **Select branch**: Choose `master`
6. **Railway will auto-detect**:
   - Runtime: Node.js
   - Package manager: npm
   - Start command: Reads from package.json

### Step 3: Configure Environment Variables

In Railway project settings, add the following variables:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=https://your-vercel-frontend-url.vercel.app
```

**Important**: 
- `DATABASE_URL` is automatically created by Railway PostgreSQL plugin
- Do NOT manually set DATABASE_URL (it conflicts with auto-generated one)
- Change `JWT_SECRET` to a strong random string

### Step 4: Deploy Backend

1. **Railway auto-deploys** when you push to master
2. **Or manually trigger**: Click "Deploy" in Railway dashboard
3. **Monitor logs**: Watch deployment progress in Railway logs
4. **Once deployed**, Railway provides public URL:
   - URL format: `https://your-app-xxxx.up.railway.app`
   - Use this URL for frontend REACT_APP_API_URL

### Step 5: Apply Database Migrations

Once backend is running on Railway:

```powershell
# Option 1: Through Railway CLI
railway connect
railway exec psql -d pawn_shop -f migrations/001_initial_schema.sql
railway exec psql -d pawn_shop -f migrations/004_add_customer_fields.sql
railway exec psql -d pawn_shop -f migrations/005_add_extended_customer_fields.sql
railway exec psql -d pawn_shop -f migrations/006_complete_schema.sql

# Option 2: Manually through Railway web interface
# - Use railway dashboard to run psql commands
```

### Step 6: Test Backend Deployment

```bash
# Test from command line
$backendURL = "https://your-app-xxxx.up.railway.app"

# Test health check (create dummy endpoint or test login)
Invoke-WebRequest -Uri "$backendURL/login" -Method Post -ContentType "application/json" -Body '{"username":"test","password":"test"}' -ErrorAction SilentlyContinue

# Should respond with valid error/response (not 404 or connection error)
```

**Expected Results**:
- ✅ No connection errors
- ✅ API responds (may be 401 if wrong credentials, that's ok)
- ✅ Logs show requests in Railway dashboard

---

## 🎨 PART 2: VERCEL FRONTEND DEPLOYMENT

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub account with push access to https://github.com/Qasimcnc/Pawnflow-Frontend
- Frontend updated with REACT_APP_API_URL environment variable
- Backend deployed on Railway (with public URL)

### Step 1: Create Vercel Project

1. **Login to Vercel**: https://vercel.com/dashboard
2. **Import GitHub project**:
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Search: `Pawnflow-Frontend`
   - Select repo: `Qasimcnc/Pawnflow-Frontend`

### Step 2: Configure Build Settings

Vercel auto-detects React settings:

```
Framework: Next.js / Create React App ✓ (auto-detected)
Build Command: npm run build ✓ (auto-detected)
Output Directory: build ✓ (auto-detected)
Install Command: npm install ✓ (auto-detected)
```

**Leave defaults** - Vercel handles React projects perfectly

### Step 3: Set Environment Variables

In Vercel project settings:

1. **Go to**: Settings → Environment Variables
2. **Add variable**:
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-railway-app-xxxx.up.railway.app`
   - Select: All environments (Production, Preview, Development)

3. **Add second variable** (optional but recommended):
   - Name: `REACT_APP_ENV`
   - Value: `production`

### Step 4: Deploy Frontend

1. **Click "Deploy"** button
2. **Vercel will**:
   - Pull code from GitHub
   - Install dependencies
   - Build React app (npm run build)
   - Deploy to Vercel CDN globally
3. **Deployment URL**: `https://pawnflow-frontend.vercel.app` (or custom domain)

### Step 5: Verify Frontend Deployment

1. **Visit** the Vercel URL
2. **Test flows**:
   - [ ] Page loads (no build errors)
   - [ ] Click "Register" or "Login" 
   - [ ] Network tab shows requests to Railway URL (not localhost)
   - [ ] API calls receive responses (may fail with invalid credentials, that's ok)

---

## 🔗 INTEGRATION VERIFICATION

After both deployments are live:

### Checklist

```
Backend (Railway):
- [ ] Service deployed and running
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Can access health endpoints
- [ ] Logs show no critical errors

Frontend (Vercel):
- [ ] Build completed successfully  
- [ ] Deployed to public URL
- [ ] Environment variables set
- [ ] Page loads without errors
- [ ] Network requests go to Railway URL

Integration:
- [ ] Register new user (should work)
- [ ] Login with credentials (should work)
- [ ] Create loan (should work)
- [ ] All API endpoints accessible
- [ ] No CORS errors in browser console
- [ ] No timeout errors
```

---

## 🧪 INTEGRATION TESTING PROCEDURES

### Test 1: User Authentication

```bash
# From browser console:
const API_URL = "https://your-railway-app.up.railway.app"

# Register
const registerRes = await fetch(`${API_URL}/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser123',
    password: 'password123',
    role: 'staff'
  })
})
console.log(await registerRes.json())

# Login
const loginRes = await fetch(`${API_URL}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser123',
    password: 'password123'
  })
})
console.log(await loginRes.json())
```

**Expected**: User created, token returned on login

### Test 2: Loan Creation Flow

```bash
# Get token from login, then:
const token = "your-jwt-token-here"

const loanRes = await fetch(`${API_URL}/create-loan`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    customer_name: 'John Doe',
    loan_amount: 1000,
    item_description: 'Gold Ring',
    item_category: 'Jewelry',
    interest_rate: 5,
    loan_term: 30
  })
})
console.log(await loanRes.json())
```

**Expected**: Loan created with ID

### Test 3: Search and Payments

```bash
# Search loan
const searchRes = await fetch(`${API_URL}/search-loan?firstName=John`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
console.log(await searchRes.json())
```

**Expected**: Loan details returned

---

## 🔐 PRODUCTION SECURITY CHECKLIST

Before considering "live":

```
Database:
- [ ] PostgreSQL hosted on Railway (not local)
- [ ] Automatic backups enabled
- [ ] SSL enabled for connections
- [ ] Only backend can access

Backend (Railway):
- [ ] NODE_ENV=production set
- [ ] JWT_SECRET is strong random string
- [ ] CORS_ORIGIN restricted to Vercel domain only
- [ ] No hardcoded secrets in code
- [ ] Error logging enabled
- [ ] Rate limiting considered

Frontend (Vercel):
- [ ] REACT_APP_API_URL points to Railway domain
- [ ] No localhost URLs in code
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] No sensitive data in localStorage
```

---

## 📊 MONITORING & DEBUGGING

### Railway Logs
```
Dashboard → Logs tab
- Shows all server requests
- Error stack traces
- Database connection issues
- Cron job execution
```

### Vercel Logs
```
Dashboard → Deployments → View Details
- Build logs (npm install, npm run build)
- Deployment logs
- Function errors (if using serverless)
```

### Browser DevTools
```
Network tab:
- Check all requests go to Railway URL
- Verify response status codes
- Look for CORS errors

Console tab:
- Check for JavaScript errors
- Look for network timeout messages
```

### Common Issues

**Issue**: CORS error in browser
```
Solution: Check CORS_ORIGIN in Railway matches Vercel URL exactly
```

**Issue**: 404 on API calls
```
Solution: Verify REACT_APP_API_URL in Vercel matches Railway URL
Recheck: https://your-railway-app.up.railway.app vs http://localhost:5000
```

**Issue**: Slow API responses
```
Solution: Check Railway logs for database issues
Verify: PostgreSQL connection pooling working
Consider: Railway container size
```

**Issue**: Database not found
```
Solution: Run migrations again through Railway CLI
Verify: DATABASE_URL environment variable set
Check: Migrations files exist in /migrations folder
```

---

## 🔄 DEPLOYMENT PIPELINE OVERVIEW

```
Your Local Machine
       ↓
GitHub Repository (master branch)
       ↓
Railway (watches GitHub for changes)
       ↓
Auto-deploys backend on push
       ↓
Vercel (watches GitHub for changes)
       ↓
Auto-deploys frontend on push
       ↓
Live at:
  Backend:  https://pawnflow-backend-xxxx.up.railway.app
  Frontend: https://pawnflow-frontend.vercel.app
```

**Workflow**:
1. Make changes locally
2. `git push origin master`
3. Railway auto-deploys backend (watch logs)
4. Vercel auto-deploys frontend (watch logs)
5. Changes live in ~2 minutes

---

## 📞 TROUBLESHOOTING

### "Connection refused" errors
- [ ] Check Railway container is running (green status)
- [ ] Check PostgreSQL service is running
- [ ] Verify DATABASE_URL is set correctly

### "Invalid JWT" errors
- [ ] Check JWT_SECRET is set in Railway
- [ ] Ensure token was created on same server
- [ ] Check token hasn't expired (1 hour TTL)

### "Database table not found"
- [ ] Verify migrations ran: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
- [ ] Re-run migrations if missing
- [ ] Check PostgreSQL user has CREATE TABLE permissions

### Frontend shows "Cannot reach server"
- [ ] Verify REACT_APP_API_URL set in Vercel
- [ ] Check Railway backend is running
- [ ] Test endpoint directly: curl https://your-railway-url/login
- [ ] Check browser CORS settings (DevTools → Console)

---

## 📝 DEPLOYMENT SUMMARY

| Component | Service | Status |
|-----------|---------|--------|
| Backend (Node.js/Express) | Railway | 🚀 Deployed |
| Database (PostgreSQL) | Railway | 🚀 Deployed |
| Frontend (React) | Vercel | 🚀 Deployed |
| Domain | Custom/Default | 🔧 Configure |
| SSL/HTTPS | Auto | ✅ Enabled |
| Auto-redeploy | GitHub webhook | ✅ Enabled |

---

## 🎯 Next Steps

1. **Post-Deployment**
   - Monitor logs for 24 hours
   - Test all user flows
   - Gather user feedback

2. **Optimization**
   - Enable caching headers
   - Optimize database queries
   - Consider CDN for assets

3. **Maintenance**
   - Set up monitoring alerts
   - Plan backup strategy
   - Document runbook

---

*Deployment guide for Pawnflow pawn shop management system - November 22, 2025*
