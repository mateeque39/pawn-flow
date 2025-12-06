# PawnFlow Admin Security Guide

## Overview

This guide provides comprehensive security information for administrators and technical staff deploying and maintaining the PawnFlow application. It covers security best practices, setup procedures, and monitoring requirements.

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Deployment Security](#deployment-security)
3. [Authentication & Authorization](#authentication--authorization)
4. [Database Security](#database-security)
5. [API Security](#api-security)
6. [Reporting Endpoints Security](#reporting-endpoints-security)
7. [Monitoring & Auditing](#monitoring--auditing)
8. [Incident Response](#incident-response)
9. [Security Checklist](#security-checklist)

---

## Security Architecture

### Components

- **Frontend**: React-based web application running on port 3000
- **Backend**: Node.js/Express server running on port 5000
- **Database**: PostgreSQL database for persistent data storage
- **Authentication**: JWT (JSON Web Tokens) for stateless authentication

### Security Layers

```
┌─────────────────────────────────────────────┐
│      React Frontend (Port 3000)             │
│  - Input validation                         │
│  - XSS protection                          │
│  - CSRF tokens                             │
└──────────────┬──────────────────────────────┘
               │ HTTPS/TLS
┌──────────────▼──────────────────────────────┐
│   Express Backend (Port 5000)               │
│  - JWT Authentication                       │
│  - Role-based Authorization                │
│  - Input validation/sanitization           │
│  - Rate limiting                           │
│  - CORS configuration                      │
│  - Error handling & logging                │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│   PostgreSQL Database                       │
│  - Connection pooling                       │
│  - Parameterized queries (SQL injection)    │
│  - User role-based access                  │
│  - Audit logging                           │
└─────────────────────────────────────────────┘
```

---

## Deployment Security

### Environment Setup

#### 1. Environment Variables (.env file)

Create `.env` file in the project root with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/pawn_shop
NODE_ENV=production

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=1h

# Server Configuration
PORT=5000
CORS_ORIGIN=https://yourdomain.com

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE=logs/pawnflow.log
```

**IMPORTANT:** Change these values for production:
- `JWT_SECRET`: Use a strong random string (32+ characters)
- `DATABASE_URL`: Use a secure password with special characters
- `SMTP_PASSWORD`: Use application-specific password, not your actual password

#### 2. Database Security

PostgreSQL User Setup:

```sql
-- Create dedicated application user (not root)
CREATE USER pawn_app WITH PASSWORD 'strong_random_password';

-- Create database
CREATE DATABASE pawn_shop OWNER pawn_app;

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE pawn_shop TO pawn_app;
GRANT USAGE ON SCHEMA public TO pawn_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pawn_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pawn_app;
```

#### 3. Server Configuration

**SSL/TLS Certificate Setup:**

```bash
# For production, use Let's Encrypt or commercial certificate
# Generate self-signed certificate for development only
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

**Port Configuration:**

- Frontend: 3000 (development) or port 80/443 (production)
- Backend: 5000 (development) or port 5000 behind reverse proxy (production)
- Database: 5432 (local only, not exposed to internet)

---

## Authentication & Authorization

### JWT Authentication Flow

```
1. User logs in with username/password
2. Backend validates credentials against database
3. Backend creates JWT token signed with JWT_SECRET
4. Token sent to frontend and stored (httpOnly cookie recommended)
5. Frontend includes token in Authorization header for protected endpoints
6. Backend verifies token signature and expiration on each request
```

### Token Structure

```json
{
  "id": 1,
  "role_id": 2,
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Role-Based Access Control (RBAC)

```
Roles:
  1. Admin (id: 1)
     - Full access to all reports
     - User management
     - System configuration
     - Audit logs
     
  2. Manager (id: 2)
     - Access to financial reports
     - View audit logs
     - Cannot modify system settings
     
  3. Staff (id: 3)
     - Limited access to daily reports
     - Cannot view financial details
     - Read-only access
     
  4. Guest (id: 4)
     - View-only access to public information
     - No access to reports
```

### Implementing Authorization

All reporting endpoints require authentication and role checking:

```javascript
app.get('/reports/endpoint', authenticateToken, authorizeRole('admin', 'manager'), async (req, res) => {
  // Only authenticated users with admin or manager role reach here
  // req.user contains: { id, role_id, iat, exp }
});
```

---

## Database Security

### Connection Security

**Connection Pooling:**

- Maximum of 20 concurrent connections (configurable)
- Connections timeout after 30 seconds of inactivity
- Pool automatically reconnects on connection failure

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### SQL Injection Prevention

**All queries use parameterized statements:**

✅ SAFE:
```javascript
pool.query('SELECT * FROM users WHERE id = $1', [userId]);
```

❌ UNSAFE:
```javascript
pool.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### Data Protection

**Sensitive Data Handling:**

- Passwords hashed with bcrypt (10 salt rounds)
- PII fields encrypted at rest (recommended for production)
- Audit trail maintained for all financial transactions
- Automatic data sanitization before storage

---

## API Security

### CORS Configuration

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting

Implemented per endpoint to prevent:
- Brute force attacks
- DDoS attacks
- Resource exhaustion

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### Input Validation

All user inputs validated and sanitized:

```javascript
// Validate date format
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  return res.status(400).json({ message: 'Invalid date format' });
}

// Sanitize strings
const sanitized = validator.escape(userInput);

// Validate numbers
const amount = Number.parseFloat(input);
if (isNaN(amount)) throw new Error('Invalid number');
```

### Error Handling

- Errors logged with full context
- User responses generic (don't expose stack traces)
- All exceptions caught and handled gracefully

```javascript
try {
  // Business logic
} catch (err) {
  console.error('Error context:', err); // Log full error
  res.status(500).json({ 
    message: 'An error occurred',
    // Don't expose: error: err.message, stack: err.stack
  });
}
```

---

## Reporting Endpoints Security

### Protected Endpoints

All reporting endpoints require:
1. **Valid JWT token** in Authorization header
2. **Authentication verification**
3. **Role-based access control**
4. **Request validation**
5. **Audit logging**

### Endpoint Documentation

#### 1. /cash-report

**Security:** `authenticateToken` + `authorizeRole('admin', 'manager')`

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:5000/cash-report?date=2025-12-01"
```

**Response Includes:**
- Pawn activity summary
- In-store transactions breakdown
- Store reconciliation
- Active/overdue loan counts

---

#### 2. /reports/daily-cash-balancing

**Security:** `authenticateToken` + `authorizeRole('admin', 'manager')`

**Parameters:**
- `startDate` (YYYY-MM-DD) - required
- `endDate` (YYYY-MM-DD) - required

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:5000/reports/daily-cash-balancing?startDate=2024-01-01&endDate=2024-12-31"
```

---

#### 3. /reports/active-loans-breakdown

**Security:** `authenticateToken` + `authorizeRole('admin', 'manager')`

**Parameters:**
- `startDate` (YYYY-MM-DD) - required
- `endDate` (YYYY-MM-DD) - required

---

#### 4. /reports/due-loans-breakdown

**Security:** `authenticateToken` + `authorizeRole('admin', 'manager')`

**Parameters:**
- `startDate` (YYYY-MM-DD) - required
- `endDate` (YYYY-MM-DD) - required

---

## Monitoring & Auditing

### Audit Logging

All sensitive operations logged with:
- Timestamp
- User ID
- Action performed
- Parameters used
- Result (success/failure)
- IP address
- User agent

**Log Example:**
```
[2025-12-01T19:48:26.543Z] [INFO] Report access by user 5 to /reports/daily-cash-balancing
Parameters: startDate=2024-01-01, endDate=2024-12-31
Result: 2 records returned
IP: 192.168.1.100
User: john.doe@pawnshop.com
```

### Log File Locations

```
logs/
  ├── pawnflow.log          # All application logs
  ├── audit.log             # Security-related events
  ├── error.log             # Errors only
  └── access.log            # API access log
```

### Log Rotation

Logs automatically rotated daily:
- Current log: `pawnflow.log`
- Previous day: `pawnflow.log.2025-11-30`
- Logs kept for 30 days

### Monitoring Alerts

Monitor for:
1. **Failed login attempts** (>5 in 5 minutes per user)
2. **Unauthorized access attempts** (invalid tokens)
3. **Rate limit violations** (>100 requests in 15 minutes)
4. **Database connection errors**
5. **Unhandled exceptions**

Set alerts to notify admin:
- Email
- SMS
- Slack
- PagerDuty

---

## Incident Response

### Security Incident Procedure

**If unauthorized access detected:**

1. **Immediate Actions**
   - Disable affected user account
   - Revoke all active JWT tokens
   - Enable additional logging
   - Notify security team

2. **Investigation**
   - Review audit logs for suspicious activity
   - Identify affected data
   - Determine scope of breach
   - Check for lateral movement

3. **Mitigation**
   - Change JWT secret (all users must re-login)
   - Rotate database credentials
   - Update firewall rules
   - Patch any vulnerabilities

4. **Communication**
   - Notify affected users
   - Document incident
   - Prepare incident report
   - Schedule post-incident review

### Password Reset Procedure

```sql
-- Reset user password
UPDATE users 
SET password = crypt('new_password', gen_salt('bf'))
WHERE id = user_id;

-- Force user to change password on next login
UPDATE users 
SET password_change_required = true
WHERE id = user_id;
```

---

## Security Checklist

Use this checklist before production deployment:

### Access Control
- [ ] JWT_SECRET changed from default
- [ ] All default passwords changed
- [ ] Database user has minimal required permissions
- [ ] API endpoints require authentication
- [ ] RBAC implemented for all sensitive operations

### Network Security
- [ ] HTTPS/TLS enabled (valid certificate)
- [ ] CORS only allows trusted origins
- [ ] Database only accessible from backend server
- [ ] Firewall rules restrict access to application ports
- [ ] No sensitive data in URLs or logs

### Data Protection
- [ ] Passwords hashed (bcrypt)
- [ ] Sensitive data encrypted at rest
- [ ] Parameterized queries prevent SQL injection
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose system details

### Monitoring & Logging
- [ ] Audit logging enabled
- [ ] Log rotation configured
- [ ] Error alerting configured
- [ ] Regular log review scheduled
- [ ] Backup logs stored securely

### Maintenance
- [ ] Dependencies updated to latest versions
- [ ] Security patches applied
- [ ] Database backups scheduled daily
- [ ] Disaster recovery plan documented
- [ ] Regular security audits scheduled

### Documentation
- [ ] Setup documentation complete
- [ ] Security procedures documented
- [ ] Incident response plan prepared
- [ ] Admin team trained
- [ ] Emergency contacts listed

---

## Security Best Practices

### For Administrators

1. **Never share JWT secrets or passwords** in email or chat
2. **Use strong passwords** (16+ characters, mixed case, numbers, symbols)
3. **Enable 2FA** for all admin accounts
4. **Review logs regularly** for suspicious activity
5. **Keep systems patched** - apply security updates promptly
6. **Rotate credentials** every 90 days
7. **Backup data** regularly and test recovery
8. **Disable unused accounts** immediately
9. **Monitor resource usage** for unusual activity
10. **Train staff** on security awareness

### For Developers

1. **Never commit secrets** to version control
2. **Use environment variables** for configuration
3. **Validate all inputs** - don't trust user data
4. **Use parameterized queries** - prevent SQL injection
5. **Log security events** with enough context
6. **Review dependencies** for known vulnerabilities
7. **Keep error messages generic** - don't expose details
8. **Test security regularly** - penetration testing
9. **Follow principle of least privilege** - minimal access
10. **Document security decisions** in code

---

## Support & Contact

For security issues:
- **Internal Security Team**: security@pawnshop.com
- **Emergency Hotline**: +1-XXX-SECURITY
- **Bug Bounty Program**: security.pawnshop.com/bounty

For technical support:
- **Documentation**: `/docs`
- **API Reference**: `/api-docs`
- **Issue Tracker**: `https://github.com/pawnshop/pawnflow`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-01 | Initial security guide for Milestone 2 |

---

**Last Updated:** 2025-12-01  
**Created by:** PawnFlow Development Team  
**Classification:** Internal Use Only
