# Automatic Database Schema Initialization

## Overview

Your PawnFlow backend now includes automatic database schema initialization. When you deploy your backend to Railway, the database tables will be **automatically created** on the first startup if they don't already exist.

## How It Works

### 1. **Module: `db-init.js`**
   - Located at: `pawn-flow/db-init.js`
   - Contains the complete database schema
   - Exports two functions:
     - `initializeDatabase(pool)` - Creates all tables if they don't exist
     - `isDatabaseInitialized(pool)` - Checks if database is initialized

### 2. **Integration in `server.js`**
   - When the server starts, it connects to the database
   - On successful connection, it automatically calls `initializeDatabase(pool)`
   - Tables are created in the correct order respecting foreign key dependencies
   - Then migrations run (if any exist)
   - Finally, the HTTP server starts listening

## Tables Automatically Created

The following tables are automatically created on deployment:

1. **user_roles** - User role definitions (admin, staff, manager, user)
2. **users** - User accounts with authentication
3. **loans** - Main loan records
4. **loans_backup** - Backup of loan records
5. **payment_history** - Payment transaction history
6. **payments** - Payment records
7. **forfeiture_history** - Forfeited item history
8. **redeem_history** - Redemption history
9. **redemption_history** - Detailed redemption records
10. **shift_management** - Shift balance and cash management
11. **shifts** - Staff shift records

All tables include:
- ✅ Primary keys (auto-incrementing IDs)
- ✅ Foreign key relationships
- ✅ Indexes for performance
- ✅ Column comments and documentation
- ✅ Default values and constraints

## Deployment Process

### Step 1: Deploy to Railway

```bash
# Push your code with the new db-init.js module
git add .
git commit -m "Add automatic database initialization"
git push
```

### Step 2: Railway Deployment

1. Connect your GitHub repository to Railway
2. Railway will automatically detect `package.json` and `server.js`
3. On deployment:
   - Node dependencies are installed
   - `npm start` runs `node server.js`
   - Server connects to PostgreSQL
   - **db-init.js automatically creates all tables**
   - Migrations run (if any)
   - Server starts listening

### Step 3: Verify Success

You'll see logs like:
```
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
🚀 Server is running on port 8081
✅ Server started successfully
```

## Environment Variables

Make sure these are set in Railway:

```
# Railway automatically sets:
DATABASE_URL=postgresql://user:password@host:port/database

# Or use individual variables:
PGHOST=your-railway-postgres-host
PGUSER=postgres
PGPASSWORD=your_password
PGPORT=5432
PGDATABASE=railway
```

## Features

### ✅ Automatic Creation
- Tables are created only if they don't exist
- Safe to deploy multiple times
- No conflicts if tables already exist

### ✅ Dependency Order
- Tables are created in correct order
- Foreign key relationships work properly
- No constraint violations

### ✅ Indexes Included
- Performance indexes on frequently searched columns
- Email, phone, name lookups are fast
- Shift and payment queries are optimized

### ✅ Error Handling
- Graceful error messages
- Server exits cleanly on critical errors
- Detailed logging for debugging

## Manual Database Checks

If you need to verify the database manually:

### Connect to Railway PostgreSQL

```bash
# Using Railway CLI
railway database shell

# Or with psql
psql "postgresql://user:password@host:port/database"
```

### List All Tables
```sql
\dt
-- or
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Check Table Structure
```sql
\d loans
-- or
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'loans';
```

## Troubleshooting

### Issue: Tables Not Created

**Solution 1: Check Railway Logs**
```bash
railway logs
```

Look for error messages during initialization. Common issues:
- Database connection timeout (check DATABASE_URL)
- Insufficient permissions (ensure user can create tables)
- Network connectivity issues

**Solution 2: Manual Initialization**

If automatic initialization fails, you can manually initialize:

```bash
# SSH into Railway
railway shell

# Run initialization from within the container
node -e "
const { initializeDatabase } = require('./db-init.js');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
initializeDatabase(pool)
  .then(() => { console.log('✅ Done'); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
"
```

### Issue: "Table already exists" Error

This is **expected and not an error**. The module uses `CREATE TABLE IF NOT EXISTS`, so:
- First deployment: Tables are created
- Subsequent deployments: Tables are skipped if they exist
- No data loss occurs

### Issue: Foreign Key Constraint Errors

The schema respects all relationships:
- `user_roles` table created first
- `users` table created second (references user_roles)
- All other tables created in dependency order
- Indexes created last

## Development vs Production

### Local Development
```bash
# Set local variables in .env
DATABASE_URL=postgresql://postgres:1234@localhost:5432/pawn_shop

# Run server
npm start
```

Tables are automatically created locally too!

### Production (Railway)
```bash
# Railway sets DATABASE_URL automatically
# Just deploy and it works!
```

## Advanced: Custom Schema Modifications

If you need to add tables after deployment:

1. **Option A: Modify db-init.js**
   ```javascript
   // In db-init.js, add your new table to DATABASE_SCHEMA string
   // Redeploy to Railway
   ```

2. **Option B: Use Migrations**
   - Create SQL files in `migrations/` folder
   - They run after schema initialization
   - Automatically executed on deployment

3. **Option C: Direct Database Query**
   ```bash
   railway database shell
   -- Run your custom SQL
   ```

## Next Steps

1. ✅ Commit `db-init.js` to your repository
2. ✅ Deploy to Railway
3. ✅ Check logs to verify tables were created
4. ✅ Test your application endpoints

That's it! Your database will be ready automatically.

---

**Questions?** Check the [Railway Documentation](https://docs.railway.app) or the logs in your Railway dashboard.
