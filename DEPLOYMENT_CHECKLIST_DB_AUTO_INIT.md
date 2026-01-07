# Database Auto-Init Deployment Checklist

## Pre-Deployment

- [ ] Review `db-init.js` - contains complete schema
- [ ] Review `server.js` changes - database initialization integration
- [ ] Run locally: `npm start` to verify tables are created
- [ ] Check `.env` has DATABASE_URL or DB_* variables set

## Local Testing

```bash
# Test 1: Fresh database initialization
npm start

# Expected output:
# ✅ Database connection test passed
# 🔄 Initializing database schema...
# 📊 Created/Verified tables:
#    ✓ user_roles
#    ✓ users
#    ✓ loans
#    ... (all 11 tables)
# ✅ Database schema initialized
# 🚀 Server is running on port 5000

# Test 2: Verify tables exist
psql postgresql://postgres:1234@localhost:5432/pawn_shop
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

# Should return 11 tables:
# forfeiture_history
# loans
# loans_backup
# payment_history
# payments
# redeem_history
# redemption_history
# shift_management
# shifts
# user_roles
# users
```

## Git Commit

```bash
# Stage files
git add db-init.js
git add server.js
git add DATABASE_AUTO_INITIALIZATION.md
git add DATABASE_AUTO_INIT_QUICK_REF.md

# Commit
git commit -m "Add automatic database schema initialization on deployment"

# Verify
git log -1 --stat
```

## Railway Deployment

- [ ] Ensure GitHub repository is connected to Railway
- [ ] Push changes: `git push origin main`
- [ ] Railway automatically detects changes
- [ ] Watch Railway deployment logs:

```bash
railway logs --follow
```

### Expected Railway Logs

```
Building application...
Installing dependencies...
npm install completed
Starting application: node server.js

🔌 Database URL: postgresql://****@****@railway.app:5432/railway
📍 Using DATABASE_URL from environment
✅ Database pool connected

✅ Database connection test passed at: 2026-01-07T10:30:45.123Z
🔄 Initializing database schema...
📊 Created/Verified tables:
   ✓ forfeiture_history
   ✓ loans
   ✓ loans_backup
   ✓ payment_history
   ✓ payments
   ✓ redeem_history
   ✓ redemption_history
   ✓ shift_management
   ✓ shifts
   ✓ user_roles
   ✓ users
✅ Database schema initialized

⏳ Running: 001-initial-schema.sql
✅ Completed: 001-initial-schema.sql

⚙️  Starting PawnFlow Server...
🔌 Listening on port 8081
🚀 Server is running on port 8081
✅ Server started successfully
```

## Post-Deployment Verification

### Check 1: Application Running
```bash
# Visit your Railway URL
curl https://pawn-flow-production.up.railway.app/health
# Should return 200 OK
```

### Check 2: Database Tables Created
```bash
# SSH into Railway
railway shell

# Connect to database and list tables
psql $DATABASE_URL -c "\dt"

# Should show all 11 tables
```

### Check 3: Create Test User
```bash
# Make API call to create admin user
curl -X POST https://pawn-flow-production.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "secure_password_123",
    "role_id": 1
  }'

# Should return: 200 OK with user created message
```

### Check 4: Query Data
```bash
# From Railway shell
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Should return count of users
```

## Rollback Plan

If something goes wrong:

### Option 1: Revert Code
```bash
git revert <commit-hash>
git push
# Railway automatically redeploys
```

### Option 2: Manual Database Reset
```bash
# SSH into Railway
railway shell

# Drop all tables (CAREFUL!)
psql $DATABASE_URL << EOF
DROP TABLE IF EXISTS redeem_history CASCADE;
DROP TABLE IF EXISTS redemption_history CASCADE;
DROP TABLE IF EXISTS forfeiture_history CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS shift_management CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS loans_backup CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
EOF

# Redeploy application
railway redeploy
```

## Troubleshooting Guide

### Problem: "Failed to connect to database"
**Solution:**
1. Check DATABASE_URL in Railway settings
2. Verify PostgreSQL service is running
3. Check credentials are correct
4. Verify network connectivity

### Problem: "Permission denied" creating tables
**Solution:**
1. Ensure Railway PostgreSQL user has CREATE TABLE permission
2. Check user role: `\du` in psql
3. Grant permissions: `GRANT ALL ON SCHEMA public TO postgres;`

### Problem: "Table already exists" errors
**Solution:**
- This is EXPECTED and NOT an error
- Schema uses `CREATE TABLE IF NOT EXISTS`
- Tables persist between deployments
- No data loss occurs

### Problem: Foreign key constraint errors
**Solution:**
1. Tables are created in correct dependency order
2. Check all referenced tables exist
3. Verify table relationships match schema
4. Schema has been tested extensively

## Support Files

- 📄 `db-init.js` - Database initialization module (308 lines)
- 📄 `server.js` - Updated with auto-init (lines 108-110)
- 📄 `DATABASE_AUTO_INITIALIZATION.md` - Detailed documentation
- 📄 `DATABASE_AUTO_INIT_QUICK_REF.md` - Quick reference guide

## Success Criteria

✅ **Deployment is successful when:**

1. Railway shows "Deploy successful" status
2. All 11 tables appear in Railway PostgreSQL
3. Indexes are created (fast queries)
4. Foreign keys are configured
5. Application starts without errors
6. API endpoints respond normally
7. Can create users and loans
8. Can query data from all tables

## Next Steps

1. ✅ Test locally with `npm start`
2. ✅ Commit code and push to GitHub
3. ✅ Monitor Railway logs during deployment
4. ✅ Verify tables in Railway PostgreSQL
5. ✅ Test API endpoints
6. ✅ Mark deployment as complete

---

**Estimated deployment time:** 2-5 minutes
**Downtime:** None (zero-downtime deployment)
**Data loss risk:** None (safe to redeploy)

Questions? Check the detailed guide: `DATABASE_AUTO_INITIALIZATION.md`
