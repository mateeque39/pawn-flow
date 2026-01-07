#!/bin/bash
# Quick script to see what environment variables Railway is passing

echo "=== Environment Variables on this System ==="
echo "DATABASE_URL: ${DATABASE_URL:not-set}"
echo "PGHOST: ${PGHOST:not-set}"
echo "PGPORT: ${PGPORT:not-set}"
echo "PGUSER: ${PGUSER:not-set}"
echo "PGDATABASE: ${PGDATABASE:not-set}"
echo "PGPASSWORD: ${PGPASSWORD:not-set}"
echo ""
echo "NODE_ENV: ${NODE_ENV:not-set}"
echo "PORT: ${PORT:not-set}"
echo ""

# Try to connect and test
echo "=== Testing Database Connection ==="
node -e "
const { Pool } = require('pg');

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  if (process.env.PGHOST) {
    return \`postgresql://\${process.env.PGUSER || 'postgres'}:\${process.env.PGPASSWORD || ''}@\${process.env.PGHOST}:\${process.env.PGPORT || 5432}/\${process.env.PGDATABASE || 'railway'}\`;
  }
  return \`postgresql://\${process.env.DB_USER || 'postgres'}:\${process.env.DB_PASSWORD || '1234'}@\${process.env.DB_HOST || 'localhost'}:\${process.env.DB_PORT || 5432}/\${process.env.DB_NAME || 'pawn_shop'}\`;
};

const url = getDatabaseUrl();
console.log('Connection URL:', url.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: url,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed:', err.message);
  } else {
    console.log('Connection OK at:', res.rows[0].now);
    pool.query('SELECT username FROM users LIMIT 3', (err2, res2) => {
      if (err2) {
        console.error('Query failed:', err2.message);
      } else {
        console.log('Users found:', res2.rows.length);
        res2.rows.forEach(row => console.log('  -', row.username));
      }
      pool.end();
    });
  }
});
"
