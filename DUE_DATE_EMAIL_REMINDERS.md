# 📧 Due Date Email Reminders Feature

## Overview
This feature automatically sends email reminders to customers when their loan due dates are approaching (within 7 days). Emails include complete loan details and payment information.

## Features

### ✅ Automatic Daily Notifications
- **Schedule:** Runs daily at 8:00 AM
- **Scope:** All active loans with due dates in the next 7 days
- **Content:** Complete loan details, remaining balance, and due date information
- **Delivery:** Automatic via email

### ✅ Manual Reminder Triggers
- Send reminder for a specific loan immediately
- Send reminders for all upcoming loans on demand
- Useful for admin overrides or immediate notifications

### ✅ Smart Email Template
- Professional HTML email design
- Displays all critical loan information:
  - Loan ID
  - Item pawned
  - Loan amount
  - Interest amount
  - Amount already paid
  - Remaining balance due
  - Due date
- Visual warning about overdue consequences
- Contact information prompt

## Setup & Configuration

### Step 1: Install Dependencies
The feature uses **nodemailer** for email sending. It's already installed:
```bash
npm install nodemailer
```

### Step 2: Configure Email Settings
Update your `.env` file with email service credentials:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

#### Gmail Setup (Recommended)
1. **Enable "Less Secure App Access"** or create an App Password:
   - Go to myaccount.google.com/security
   - Enable "Less secure app access" (if using regular password)
   - OR generate an App Password if 2FA is enabled

2. **Use App Password** (More Secure - Recommended):
   - Go to myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Use the generated 16-character password as `EMAIL_PASSWORD`

3. **Environment Variables:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password-16-chars
   EMAIL_FROM=your-email@gmail.com
   ```

#### Other Email Providers
- **Outlook/Hotmail:** 
  - Host: smtp-mail.outlook.com
  - Port: 587
  - Secure: false

- **Yahoo:**
  - Host: smtp.mail.yahoo.com
  - Port: 587
  - Secure: false
  - Note: Requires "App Password"

- **Custom SMTP:**
  - Adjust host and port accordingly
  - Contact your email provider for credentials

### Step 3: Verify Configuration
When the server starts, you'll see:
- ✅ `Email transporter configured successfully` - Configuration is correct
- ⚠️ `Email transporter not configured or failed` - Check your credentials

## Automated Cron Job

### Daily Automatic Reminders
**Schedule:** 8:00 AM every day
**Trigger:** Automatic - no manual action required
**Logic:**
1. Query all active loans
2. Filter loans with due dates in next 7 days
3. Check for valid customer emails
4. Send formatted HTML email with loan details
5. Log success/failure for each email

**Server Log Output:**
```
🔔 Starting due date reminder email job...
Found 5 loans with due dates in next 7 days
✅ Email sent to customer@example.com for loan ID 123
✅ Email sent to another@example.com for loan ID 456
✅ Due date reminder email job completed
```

## API Endpoints

### 1. Send Reminder for Single Loan
**Endpoint:** `POST /send-due-date-reminder/:loanId`
**Authentication:** Required (JWT Token)
**Parameters:**
- `loanId` (path parameter): The ID of the loan

**Request Example:**
```bash
curl -X POST http://localhost:5000/send-due-date-reminder/123 \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Email sent successfully to customer@example.com"
}
```

**Error Responses:**
```json
{ "message": "Loan not found" }
{ "message": "No email address on file for customer" }
{ "message": "Email service error message" }
```

### 2. Send Reminders for All Upcoming Loans
**Endpoint:** `POST /send-all-due-date-reminders`
**Authentication:** Required (JWT Token)
**Parameters:** None

**Request Example:**
```bash
curl -X POST http://localhost:5000/send-all-due-date-reminders \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Due date reminder emails processed",
  "totalLoans": 5,
  "successCount": 5,
  "failureCount": 0,
  "details": "Successfully sent 5 emails. Failed to send 0 emails."
}
```

## Email Content

### Subject Line
- **Format:** `⏰ Loan Due Date Reminder - Your Loan is Due in X Day(s)`
- **Example:** `⏰ Loan Due Date Reminder - Your Loan is Due in 3 Days`

### Email Body Sections

#### Header
- Professional dark header with "🔔 Loan Due Date Reminder" title

#### Main Content
- Greeting with customer name
- Highlighted number of days until due
- Loan details table:
  - Loan ID
  - Item description
  - Loan amount
  - Interest amount
  - Amount already paid
  - **Remaining balance due** (highlighted)
  - Due date in formatted date

#### Warning Section
- Yellow warning box with ⚠️ icon
- Important note about overdue consequences
- Prompt to contact for questions

#### Footer
- Professional sign-off from PawnFlow
- Automated email disclaimer

## Database Requirements

The feature requires:
- `loans` table with columns:
  - `id` (loan ID)
  - `customer_id` (foreign key)
  - `due_date` (date)
  - `status` (varchar - must be 'active')
  - `loan_amount` (decimal)
  - `interest_amount` (decimal)
  - `item_description` (varchar)

- `customers` table with columns:
  - `id` (customer ID)
  - `first_name` (varchar)
  - `last_name` (varchar)
  - `email` (varchar)
  - `mobile_phone` (varchar - optional)

- `payment_history` table with columns:
  - `loan_id` (foreign key)
  - `payment_amount` (decimal)

## Testing the Feature

### Test 1: Send Email for Specific Loan
```bash
# Get a loan ID from your database
# Replace 123 with actual loan ID
curl -X POST http://localhost:5000/send-due-date-reminder/123 \
  -H "Authorization: Bearer your_token"
```

### Test 2: Send All Reminders
```bash
curl -X POST http://localhost:5000/send-all-due-date-reminders \
  -H "Authorization: Bearer your_token"
```

### Test 3: Verify Automatic Job
- Check server logs at 8:00 AM daily
- Look for "🔔 Starting due date reminder email job..." message
- Verify "✅ Email sent to..." entries

### Test 4: Gmail Test (Debugging)
Create a test script `test-email.js`:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'This is a test email',
}, (err, info) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log('✅ Email sent:', info.response);
  }
  process.exit(0);
});
```

Run with: `node test-email.js`

## Troubleshooting

### "Email transporter not configured"
**Problem:** Email settings are not in `.env` file
**Solution:** 
1. Copy `.env.example` to `.env`
2. Fill in EMAIL_* variables
3. Restart server

### "Authentication failed for user"
**Problem:** Incorrect email or password
**Solution:**
1. Verify `EMAIL_USER` is correct
2. For Gmail, use App Password (not regular password if 2FA enabled)
3. Check that email account allows SMTP access

### "SMTP port refused"
**Problem:** Wrong port or firewall blocking
**Solution:**
1. Verify `EMAIL_PORT` is 587 (standard)
2. Check EMAIL_SECURE is false
3. Check firewall isn't blocking port

### "No emails sending"
**Problem:** Email transporter verification passed but no emails sent
**Solution:**
1. Check that customers have valid email addresses in database
2. Verify loans have `status = 'active'`
3. Check loans have due dates within next 7 days
4. Review server logs for specific error messages

### "Some emails failed to send"
**Problem:** Partial failure in batch send
**Solution:**
1. Check returned `failureCount` in API response
2. Review server logs for which emails failed
3. Common reasons:
   - Invalid email format
   - Email address doesn't exist
   - Mailbox quota exceeded
4. Retry failed loans individually

## Production Deployment

### Railway Deployment
1. **Set Environment Variables in Railway:**
   - `EMAIL_HOST=smtp.gmail.com`
   - `EMAIL_PORT=587`
   - `EMAIL_SECURE=false`
   - `EMAIL_USER=your-email@gmail.com`
   - `EMAIL_PASSWORD=your-app-password`
   - `EMAIL_FROM=your-email@gmail.com`

2. **Verify in Deployment:**
   - Check Railway logs at 8:00 AM for cron job execution
   - Watch for "🔔 Starting due date reminder email job..." message
   - Confirm "✅ Email transporter configured successfully"

### Cloud Email Services (Alternative)
Instead of Gmail, consider:
- **SendGrid:** More reliable for production
- **AWS SES:** Good for high volume
- **Mailgun:** Developer friendly
- **Postmark:** Excellent deliverability

Just update `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASSWORD` accordingly.

## Security Best Practices

1. **Never commit `.env` to git**
   - Use `.env.example` for template
   - Add `.env` to `.gitignore`

2. **Use App Passwords**
   - Don't use actual Gmail password in production
   - Generate App Passwords for better security

3. **Monitor Email Sending**
   - Log all email sends in database (optional enhancement)
   - Monitor failure rates
   - Set up alerts for high failure counts

4. **Rate Limiting**
   - Current system sends to all upcoming loans daily
   - For high-volume scenarios, consider adding rate limiting
   - Per-customer email frequency checks

## Future Enhancements

Potential improvements:
1. **Database Logging:** Log all email sends to track delivery
2. **Retry Logic:** Automatic retry on email send failure
3. **Customer Preferences:** Let customers opt-out of reminders
4. **SMS Option:** Send SMS reminders in addition to email
5. **Multiple Languages:** Support email templates in different languages
6. **Customizable Schedule:** Admin panel to set reminder schedule
7. **Reminder Count:** Send multiple reminders (3 days, 1 day before)
8. **Email Templates:** Admin can customize email content

## Support & Maintenance

- **Check Logs:** `docker logs pawn-flow` (or check Railway logs)
- **Monitor Email:** Set up monitoring for transporter failures
- **Test Regularly:** Run manual tests monthly to ensure functionality
- **Update Credentials:** If email password changes, update `.env`

## Version Information
- **Feature Added:** December 15, 2025
- **nodemailer Version:** ^4.7.2 (or latest)
- **Tested with:** Node.js v18+

---

**Questions or Issues?** Check the troubleshooting section or review server logs for detailed error messages.
