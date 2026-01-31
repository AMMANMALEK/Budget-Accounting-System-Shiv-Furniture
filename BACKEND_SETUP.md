# Mock Backend Server Setup Guide

## Problem
The error `ERR_CONNECTION_REFUSED` occurs because there's no backend API server running on `http://localhost:3000`.

## Solution

I've created a **mock backend server** for testing your authentication system.

---

## Quick Start

### Option 1: Run Both Frontend and Backend Together (Recommended)

```bash
npm install
npm run dev:all
```

This will start:
- ✅ Backend API on `http://localhost:3000`
- ✅ Frontend React app on `http://localhost:5173`

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm install
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## What's Included

### Mock API Server ([server.js](file:///c:/Users/sarha/OneDrive/ドキュメント/Desktop/odoo@gcet12026/server.js))

**Endpoints:**
- `POST /api/auth/login` - Login endpoint
- `POST /api/auth/signup` - Signup endpoint  
- `GET /api/health` - Health check

**Features:**
- ✅ In-memory user storage
- ✅ JWT token generation
- ✅ CORS enabled
- ✅ Proper error handling

---

## Testing the Flow

### 1. Create an Account
1. Go to `http://localhost:5173/signup`
2. Fill in the form:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password123`
   - Role: `Client` or `Vendor`
3. Check "I accept the Terms & Conditions"
4. Click "Create Account"
5. You'll be redirected to login

### 2. Login
1. Go to `http://localhost:5173/login`
2. Enter credentials:
   - Email: `john@example.com`
   - Password: `password123`
3. Click "Sign In"
4. You'll be redirected based on role:
   - Admin → `/admin/dashboard`
   - Client/Vendor → `/portal/dashboard`

### 3. Test Admin Login
To test admin access, first signup with any credentials, then manually create an admin user by modifying the server or using this test account:

1. Signup with email: `admin@example.com`
2. Login with those credentials
3. The mock server will authenticate you

---

## Important Notes

> [!WARNING]
> This is a **MOCK SERVER** for development/testing only. Do NOT use in production!

**Limitations:**
- ❌ No password hashing (passwords stored in plain text)
- ❌ Data stored in memory (resets on server restart)
- ❌ No database
- ❌ No input validation
- ❌ No rate limiting

**For Production:**
- Use a real database (MongoDB, PostgreSQL, etc.)
- Hash passwords with bcrypt
- Add proper validation
- Implement refresh tokens
- Add rate limiting
- Use HTTPS

---

## Troubleshooting

### Port 3000 Already in Use
If you get an error that port 3000 is already in use:

1. Change the port in [server.js](file:///c:/Users/sarha/OneDrive/ドキュメント/Desktop/odoo@gcet12026/server.js):
   ```javascript
   const PORT = 3001; // Change to any available port
   ```

2. Update [.env](file:///c:/Users/sarha/OneDrive/ドキュメント/Desktop/odoo@gcet12026/.env):
   ```
   VITE_API_BASE_URL=http://localhost:3001
   ```

### Connection Still Refused
1. Make sure the backend server is running (`npm run server`)
2. Check the terminal for any errors
3. Verify the backend is running on `http://localhost:3000`
4. Check browser console for the exact error

---

## Next Steps

Once you're ready for production:

1. **Replace the mock server** with a real backend (Node.js/Express, Django, Spring Boot, etc.)
2. **Implement proper security**:
   - Password hashing (bcrypt)
   - Input validation
   - CSRF protection
   - Rate limiting
3. **Add a database** (MongoDB, PostgreSQL, MySQL)
4. **Deploy** both frontend and backend to production servers

---

## Files Modified

- ✅ [server.js](file:///c:/Users/sarha/OneDrive/ドキュメント/Desktop/odoo@gcet12026/server.js) - Mock backend server
- ✅ [package.json](file:///c:/Users/sarha/OneDrive/ドキュメント/Desktop/odoo@gcet12026/package.json) - Added backend dependencies and scripts
- ✅ [.env](file:///c:/Users/sarha/OneDrive/ドキュメント/Desktop/odoo@gcet12026/.env) - Fixed environment variable name (VITE_API_BASE_URL)
- ✅ [auth.service.js](file:///c:/Users/sarha/OneDrive/ドキュメント/Desktop/odoo@gcet12026/src/services/auth.service.js) - Fixed environment variable usage
