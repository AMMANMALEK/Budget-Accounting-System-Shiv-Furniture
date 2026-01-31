# 🔍 Signup Failed - Debugging Guide

## Common Causes & Solutions

### ✅ **Solution 1: Make Sure Backend Server is Running**

This is the **#1 most common issue**!

**Check if the backend is running:**

1. Open a **NEW terminal window**
2. Run:
   ```bash
   cd c:\Users\sarha\OneDrive\ドキュメント\Desktop\odoo@gcet12026
   npm run server
   ```

3. You **MUST** see this output:
   ```
   🚀 Mock API server running on http://localhost:3000
   📝 Endpoints:
      POST http://localhost:3000/api/auth/login
      POST http://localhost:3000/api/auth/signup
      GET  http://localhost:3000/api/health
   ```

4. **Keep this terminal window open!** Don't close it.

5. Test the backend is working:
   - Open browser to: `http://localhost:3000/api/health`
   - You should see: `{"status":"OK","users":0}`

---

### ✅ **Solution 2: Check Browser Console for Exact Error**

1. Open browser DevTools (Press `F12`)
2. Go to **Console** tab
3. Try to signup again
4. Look for error messages

**Common errors you might see:**

#### Error: `ERR_CONNECTION_REFUSED`
**Cause**: Backend server is not running  
**Fix**: Start the backend server (see Solution 1)

#### Error: `Network Error` or `Failed to fetch`
**Cause**: Backend server crashed or wrong port  
**Fix**: 
- Check if backend terminal shows errors
- Restart backend server
- Make sure it's running on port 3000

#### Error: `CORS policy` error
**Cause**: CORS not configured properly  
**Fix**: Already configured in server.js, but restart backend server

#### Error: `User already exists`
**Cause**: You already created an account with that email  
**Fix**: Use a different email or check Login page

---

### ✅ **Solution 3: Check Network Tab**

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Try signup again
4. Look for the request to `/api/auth/signup`

**What to check:**

- **Request URL**: Should be `http://localhost:3000/api/auth/signup`
- **Status Code**: 
  - `201` = Success ✅
  - `400` = User already exists
  - `Failed` or `(failed)` = Backend not running
  - `500` = Server error

Click on the request to see:
- **Request Payload**: Your form data
- **Response**: Error message from server

---

### ✅ **Solution 4: Verify Both Servers Are Running**

You need **TWO terminal windows**:

**Terminal 1 - Backend (Port 3000):**
```bash
npm run server
```
Should show: `🚀 Mock API server running on http://localhost:3000`

**Terminal 2 - Frontend (Port 5173):**
```bash
npm run dev
```
Should show: `➜  Local:   http://localhost:5173/`

---

### ✅ **Solution 5: Clear Browser Cache & Restart**

Sometimes the browser caches old code:

1. Press `Ctrl + Shift + Delete`
2. Clear cache and cookies
3. Close browser completely
4. Restart both servers
5. Open browser to `http://localhost:5173`

---

### ✅ **Solution 6: Check .env File**

Make sure the environment variable is correct:

**File**: `.env`
```env
VITE_API_BASE_URL=http://localhost:3000
```

**After changing .env:**
1. Stop the frontend server (`Ctrl + C`)
2. Restart it: `npm run dev`

---

### ✅ **Solution 7: Test Backend Directly**

Use this PowerShell command to test signup directly:

```powershell
$body = @{
    fullName = "Test User"
    email = "test@example.com"
    password = "password123"
    role = "client"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method POST -Body $body -ContentType "application/json"
```

**Expected response:**
```json
{
  "message": "User created successfully",
  "userId": "1"
}
```

**If this fails:**
- Backend server is not running
- Check for errors in backend terminal

---

### ✅ **Solution 8: Check for Port Conflicts**

If port 3000 is already in use:

1. **Option A**: Kill the process using port 3000
   ```bash
   netstat -ano | findstr :3000
   taskkill /PID <PID_NUMBER> /F
   ```

2. **Option B**: Change to a different port

   **Edit `server.js`:**
   ```javascript
   const PORT = 3001; // Change to 3001
   ```

   **Edit `.env`:**
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   ```

   **Restart both servers**

---

## 🎯 Quick Checklist

Before asking for more help, verify:

- [ ] Backend server is running on port 3000
- [ ] Frontend server is running on port 5173
- [ ] Both terminal windows are still open
- [ ] `http://localhost:3000/api/health` returns `{"status":"OK"}`
- [ ] Browser console shows the exact error
- [ ] Network tab shows the request details
- [ ] You're using a unique email address
- [ ] Terms & Conditions checkbox is checked

---

## 📸 What to Share for Help

If still not working, share:

1. **Backend terminal output** (screenshot or text)
2. **Frontend terminal output** (screenshot or text)
3. **Browser console errors** (screenshot)
4. **Network tab request details** (screenshot)
5. **Exact error message** shown on the page

---

## 🚀 Most Likely Fix

**90% of the time**, the issue is:

> **Backend server is not running!**

**Solution:**
1. Open a new terminal
2. Run: `npm run server`
3. Keep it open
4. Try signup again

It should work! 🎉
