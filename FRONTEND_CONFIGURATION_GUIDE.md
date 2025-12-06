# Frontend API Configuration Implementation Guide

## 📋 Overview

This guide provides step-by-step instructions to update the Pawnflow frontend from hardcoded API URLs to environment variable configuration for production deployment.

---

## 🎯 Objectives

1. Create `.env.example` for documentation
2. Update all 10 React components to use `process.env.REACT_APP_API_URL`
3. Test locally before deployment
4. Commit and push changes to GitHub

---

## 📋 Step-by-Step Implementation

### Step 1: Create `.env.example` File

Create a new file at the root of the frontend repository:

**File**: `Pawnflow-Frontend/.env.example`

```env
# API Configuration
# Local development (default): http://localhost:5000
# Production (Railway): https://your-railway-app.up.railway.app
REACT_APP_API_URL=http://localhost:5000
```

**Note**: 
- React requires environment variables to start with `REACT_APP_` prefix
- This file should be committed to git (it's an example/documentation)
- Actual `.env` file should be in `.gitignore` (already is)

---

### Step 2: Update 10 Frontend Components

#### Component 1: `src/LoginForm.js`

**Current code** (line 14):
```javascript
const res = await axios.post('http://localhost:5000/login', { username, password });
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const res = await axios.post(`${API_BASE_URL}/login`, { username, password });
```

**Full implementation pattern**:
Add the API_BASE_URL constant at the beginning of the component function or inside handleSubmit.

---

#### Component 2: `src/RegisterForm.js`

**Current code** (line 14):
```javascript
const res = await axios.post('http://localhost:5000/register', { username, password, role });
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const res = await axios.post(`${API_BASE_URL}/register`, { username, password, role });
```

---

#### Component 3: `src/CreateLoanForm.js`

**Current code** (line 98):
```javascript
const response = await axios.post('http://localhost:5000/create-loan', loanData);
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.post(`${API_BASE_URL}/create-loan`, loanData);
```

---

#### Component 4: `src/SearchLoanForm.js`

**Current code** (Multiple endpoints - lines 21, 49, 94, 132):
```javascript
const response = await axios.get("http://localhost:5000/search-loan", { ... });
const paymentRes = await axios.get("http://localhost:5000/payment-history", { ... });
const response = await axios.post("http://localhost:5000/add-money", { ... });
const response = await axios.post("http://localhost:5000/redeem-loan", { ... });
```

**Updated code**:
Add at component level (inside the component function):
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

Then update all 4 endpoints:
```javascript
const response = await axios.get(`${API_BASE_URL}/search-loan`, { ... });
const paymentRes = await axios.get(`${API_BASE_URL}/payment-history`, { ... });
const response = await axios.post(`${API_BASE_URL}/add-money`, { ... });
const response = await axios.post(`${API_BASE_URL}/redeem-loan`, { ... });
```

---

#### Component 5: `src/ExtendLoanForm.js`

**Current code** (lines 19, 49):
```javascript
const response = await axios.get('http://localhost:5000/search-loan', { ... });
const response = await axios.post('http://localhost:5000/extend-loan', { ... });
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.get(`${API_BASE_URL}/search-loan`, { ... });
const response = await axios.post(`${API_BASE_URL}/extend-loan`, { ... });
```

---

#### Component 6: `src/RedeemLoanForm.js`

**Current code** (lines 15, 40, 64):
```javascript
const response = await axios.get('http://localhost:5000/search-loan', { ... });
const response = await axios.post('http://localhost:5000/redeem-loan', { ... });
const response = await axios.post('http://localhost:5000/forfeit-loan', { ... });
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.get(`${API_BASE_URL}/search-loan`, { ... });
const response = await axios.post(`${API_BASE_URL}/redeem-loan`, { ... });
const response = await axios.post(`${API_BASE_URL}/forfeit-loan`, { ... });
```

---

#### Component 7: `src/ForfeitLoanForm.js`

**Current code** (lines 21, 65):
```javascript
const response = await axios.get('http://localhost:5000/search-loan', { ... });
const response = await axios.post('http://localhost:5000/forfeit-loan', { ... });
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.get(`${API_BASE_URL}/search-loan`, { ... });
const response = await axios.post(`${API_BASE_URL}/forfeit-loan`, { ... });
```

---

#### Component 8: `src/MakePaymentForm.js`

**Current code** (lines 16, 32, 66, 92):
```javascript
const response = await axios.get("http://localhost:5000/search-loan", { ... });
const historyRes = await axios.get("http://localhost:5000/payment-history", { ... });
const response = await axios.post("http://localhost:5000/make-payment", { ... });
const extendResponse = await axios.post("http://localhost:5000/extend-loan", { ... });
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.get(`${API_BASE_URL}/search-loan`, { ... });
const historyRes = await axios.get(`${API_BASE_URL}/payment-history`, { ... });
const response = await axios.post(`${API_BASE_URL}/make-payment`, { ... });
const extendResponse = await axios.post(`${API_BASE_URL}/extend-loan`, { ... });
```

---

#### Component 9: `src/CheckDueDateForm.js`

**Current code** (line 14):
```javascript
const response = await axios.post('http://localhost:5000/check-due-date');
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.post(`${API_BASE_URL}/check-due-date`);
```

---

#### Component 10: `src/ShiftManagement.js`

**Current code** (lines 25, 34, 45, 66, 86, 111):
```javascript
const response = await axios.get(`http://localhost:5000/current-shift/${userId}`);
const response = await axios.get(`http://localhost:5000/shift-history/${userId}`);
const response = await axios.get(`http://localhost:5000/today-shift-summary/${userId}`);
const response = await axios.get(`http://localhost:5000/shift-report/${shiftId}`);
const response = await axios.post('http://localhost:5000/start-shift', { ... });
const response = await axios.post('http://localhost:5000/end-shift', { ... });
```

**Updated code**:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await axios.get(`${API_BASE_URL}/current-shift/${userId}`);
const response = await axios.get(`${API_BASE_URL}/shift-history/${userId}`);
const response = await axios.get(`${API_BASE_URL}/today-shift-summary/${userId}`);
const response = await axios.get(`${API_BASE_URL}/shift-report/${shiftId}`);
const response = await axios.post(`${API_BASE_URL}/start-shift`, { ... });
const response = await axios.post(`${API_BASE_URL}/end-shift`, { ... });
```

---

## 🧪 Testing

### Local Testing

1. **Create `.env` file** (local only, not committed):
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

2. **Start the backend** (ensure it's running on port 5000):
   ```bash
   cd C:\Users\HP\pawn-flow
   node server.js
   ```

3. **Start the frontend** (in a new terminal):
   ```bash
   cd C:\Users\HP\pawn-flow\frontend-temp
   npm install  # if dependencies not installed
   npm start
   ```

4. **Test all flows**:
   - [ ] Register new user
   - [ ] Login with credentials
   - [ ] Create a loan
   - [ ] Search for loan
   - [ ] Make payment
   - [ ] Extend loan
   - [ ] Check due date
   - [ ] Shift management
   - [ ] Redeem/Forfeit loan

### Production Testing (After Deployment)

1. **Update `.env` on Vercel** with Railroad backend URL:
   ```env
   REACT_APP_API_URL=https://your-railway-app.up.railway.app
   ```

2. **Verify API calls** in browser DevTools:
   - Network tab should show requests to Railway URL
   - No requests to `localhost:5000`

---

## 🔒 Environment Variable Handling

### Local Development
```
1. Create .env file (in .gitignore)
2. Set REACT_APP_API_URL=http://localhost:5000
3. npm start
```

### Production (Vercel)
```
1. In Vercel dashboard: Settings > Environment Variables
2. Add REACT_APP_API_URL with Railway backend URL
3. Redeploy project
```

### Default Fallback
```javascript
// If REACT_APP_API_URL not set, defaults to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

---

## 📝 Git Workflow

### Step 1: Update all files locally
```powershell
cd C:\Users\HP\pawn-flow\frontend-temp
# Make all the changes above
```

### Step 2: Test locally
```powershell
npm install
npm start
# Manually test all features
```

### Step 3: Commit changes
```powershell
git add .
git commit -m "Configure API endpoint for deployment"
```

### Step 4: Push to GitHub
```powershell
git push origin master
```

### Step 5: Verify on GitHub
- Visit: https://github.com/Qasimcnc/Pawnflow-Frontend
- Confirm `.env.example` is visible
- Confirm all 10 files show API_BASE_URL usage

---

## ✅ Verification Checklist

Before pushing to GitHub:

- [ ] `.env.example` created with REACT_APP_API_URL
- [ ] LoginForm.js updated (1 endpoint)
- [ ] RegisterForm.js updated (1 endpoint)
- [ ] CreateLoanForm.js updated (1 endpoint)
- [ ] SearchLoanForm.js updated (4 endpoints)
- [ ] ExtendLoanForm.js updated (2 endpoints)
- [ ] RedeemLoanForm.js updated (3 endpoints)
- [ ] ForfeitLoanForm.js updated (2 endpoints)
- [ ] MakePaymentForm.js updated (4 endpoints)
- [ ] CheckDueDateForm.js updated (1 endpoint)
- [ ] ShiftManagement.js updated (6 endpoints)
- [ ] Local testing passed
- [ ] Git commit message: "Configure API endpoint for deployment"
- [ ] Successfully pushed to master branch

---

## 🚀 Next Steps

After this task is complete:

1. **Railway Backend Deployment**
   - Connect https://github.com/Qasimcnc/Pawnflow-backend
   - Set DATABASE_URL environment variable
   - Deploy backend

2. **Vercel Frontend Deployment**
   - Connect https://github.com/Qasimcnc/Pawnflow-Frontend
   - Set REACT_APP_API_URL to Railway backend URL
   - Deploy frontend

3. **Integration Testing**
   - Test end-to-end flows with production URLs
   - Verify all API calls work correctly
   - Monitor logs for errors

---

## 📚 Additional Resources

- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Axios Documentation](https://axios-http.com/)

---

*Implementation guide for Pawnflow frontend API configuration - November 22, 2025*
