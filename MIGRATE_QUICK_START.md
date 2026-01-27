# Quick Start: Deploy Initial Loan Amount Fix

## 🚀 One-Command Deployment

```bash
npm run deploy
```

That's it! This will:
1. Run all pending migrations (including the initial_loan_amount fix)
2. Start the server
3. Log all migration details

---

## 📋 What You Need to Know

### The Fix
- **Problem**: Adding money to loans blocked creating new loans ("insufficient funds")
- **Solution**: Track original loan amounts separately from modified amounts
- **Result**: Adding money no longer affects available balance ✓

### Migration Details
- **File**: `migrations/20260127_add_initial_loan_amount.js`
- **What it does**: 
  - Adds `initial_loan_amount` column
  - Populates existing loans automatically
  - Creates migration tracking table
- **Time**: < 1 second on most databases
- **Reversible**: Yes (but not recommended)

---

## ✅ Verify It Worked

### After deployment, check:

```bash
# In your database, run:
SELECT COUNT(*) as total_loans, 
       COUNT(CASE WHEN initial_loan_amount > 0 THEN 1 END) as loans_with_amounts
FROM loans;

# Check migrations ran:
SELECT * FROM migrations;
```

### Test in the app:
1. Go to Store Balance → Add Cash
2. Add $5,000
3. Check balance shows $5,000 available
4. Try to create a $5,000 loan
5. ✅ Should work now!

---

## 🔄 Alternate: If You Want to Run Migrations Separately

```bash
# Run migrations only
npm run migrate

# Then start server separately  
npm start
```

---

## 🆘 If Something Goes Wrong

### Check logs
```bash
# Look for errors in deployment logs
# Should show: "✅ Migration completed successfully"
```

### Verify migration was recorded
```sql
SELECT * FROM migrations 
WHERE name LIKE '%initial_loan_amount%';
```

### If it didn't run:
```bash
# Delete the record and try again
DELETE FROM migrations 
WHERE name = '20260127_add_initial_loan_amount.js';

npm run migrate
```

---

## 📖 More Details

See `DEPLOYMENT_MIGRATION_GUIDE.md` for:
- Detailed troubleshooting
- Manual SQL option
- Rollback instructions
- Architecture overview

---

**Status**: Ready to deploy ✓  
**Duration**: < 1 minute  
**Risk Level**: Very Low (migration is idempotent - safe to run multiple times)  
**Rollback**: Easy (optional, probably not needed)
