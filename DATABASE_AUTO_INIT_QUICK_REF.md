# Database Auto-Init Quick Reference

## What Changed?

✅ **New file**: `db-init.js` - Automatic database schema initialization
✅ **Updated**: `server.js` - Now calls db-init on startup

## Deployment Flow

```
1. Push code to GitHub
   ↓
2. Railway deploys (detects Node.js)
   ↓
3. Installs npm packages
   ↓
4. Runs: node server.js
   ↓
5. Server connects to PostgreSQL
   ↓
6. ✨ AUTOMATIC: db-init.js creates all tables ✨
   ↓
7. Migrations run (if any)
   ↓
8. Server starts listening
   ↓
9. Ready to use!
```

## What Tables Are Created?

| Table | Purpose |
|-------|---------|
| `user_roles` | Role definitions (admin, staff, manager, user) |
| `users` | User accounts and authentication |
| `loans` | Main loan records |
| `loans_backup` | Loan backup copies |
| `payment_history` | Payment transaction history |
| `payments` | Payment records |
| `forfeiture_history` | Forfeited items history |
| `redeem_history` | Redemption records |
| `redemption_history` | Detailed redemption info |
| `shift_management` | Cash/shift balancing |
| `shifts` | Staff shift records |

## Key Features

- 🔄 **Automatic**: No manual SQL needed
- 🛡️ **Safe**: Uses `CREATE TABLE IF NOT EXISTS`
- 🔗 **Smart**: Respects all foreign key dependencies
- ⚡ **Optimized**: Includes performance indexes
- 📝 **Documented**: Column comments included
- ✅ **Idempotent**: Safe to deploy multiple times

## To Deploy

```bash
# Standard deployment
git add .
git commit -m "Add automatic database initialization"
git push

# Railway will automatically:
# 1. Build your Node.js app
# 2. Create database tables
# 3. Start your server
```

## To Verify

Railway logs will show:
```
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
🚀 Server is running on port 8081
```

## If Something Goes Wrong

### Check Railway Logs
```bash
railway logs --follow
```

### Manual Fix
```bash
# SSH into Railway container
railway shell

# Verify database connection
psql $DATABASE_URL -c "\dt"
```

### If Tables Didn't Create
1. Check database connection (DATABASE_URL valid?)
2. Check user permissions (can create tables?)
3. Check PostgreSQL is running on Railway
4. Redeploy (automatic init will retry)

## Files Changed

```
pawn-flow/
├── db-init.js ✨ NEW
├── server.js (modified - added db-init call)
└── DATABASE_AUTO_INITIALIZATION.md ✨ NEW (detailed guide)
```

## That's It!

Your database is now fully automated. When you deploy:
1. Tables are created automatically
2. No manual SQL commands needed
3. No data loss on redeployment
4. Same behavior locally and in production

Happy deploying! 🚀
