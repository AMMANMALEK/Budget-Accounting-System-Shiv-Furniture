# 🎉 Frontend-Only ERP Authentication System

## ✅ No Backend Required!

This is a **frontend-only** authentication system. Everything works in your browser using localStorage - **no backend server needed!**

---

## 🚀 Quick Start

### 1. Install Dependencies (One Time Only)

```bash
cd c:\Users\sarha\OneDrive\ドキュメント\Desktop\odoo@gcet12026
npm install
```

### 2. Start the Application

```bash
npm run dev
```

### 3. Open Browser

Go to: **http://localhost:5173**

---

## 🔑 Static Test Credentials

Use these pre-configured accounts to login:

### **Admin Account**
- **Email**: `admin@erp.com`
- **Password**: `admin123`
- **Access**: Admin Dashboard

### **Client Account**
- **Email**: `client@erp.com`
- **Password**: `client123`
- **Access**: Portal Dashboard

### **Vendor Account**
- **Email**: `vendor@erp.com`
- **Password**: `vendor123`
- **Access**: Portal Dashboard

---

## 📝 Features

✅ **Login Page** with validation  
✅ **Signup Page** with password strength indicator  
✅ **Role-based routing** (Admin/Client/Vendor)  
✅ **Mock authentication** using localStorage  
✅ **Static test accounts** pre-configured  
✅ **Create new accounts** via signup  
✅ **Dark theme** with smooth animations  
✅ **Fully responsive** design  

---

## 🎯 How It Works

### Login
1. Go to `http://localhost:5173/login`
2. Enter one of the static credentials above
3. Click "Sign In"
4. You'll be redirected based on your role:
   - **Admin** → `/admin/dashboard`
   - **Client/Vendor** → `/portal/dashboard`

### Signup
1. Go to `http://localhost:5173/signup`
2. Fill in the form with your details
3. Choose role: Client or Vendor
4. Click "Create Account"
5. Login with your new credentials

### Data Storage
- All user data is stored in **browser localStorage**
- No backend server required
- Data persists until you clear browser data
- Each browser has its own separate data

---

## 🔧 Technical Details

### Authentication Flow
1. **Login**: Checks credentials against localStorage
2. **Token**: Generates mock JWT token (Base64 encoded)
3. **Storage**: Saves token and user data to localStorage
4. **Routing**: Redirects based on user role
5. **Logout**: Clears localStorage data

### File Structure
```
src/
├── pages/
│   ├── Login.jsx          # Login page
│   ├── Signup.jsx         # Signup page
│   ├── AdminDashboard.jsx # Admin dashboard
│   └── PortalDashboard.jsx # Client/Vendor portal
├── services/
│   └── auth.service.js    # Frontend-only auth (no API calls)
├── App.jsx                # Routing & theme
└── main.jsx               # Entry point
```

---

## 🎨 Customization

### Add More Static Users

Edit `src/services/auth.service.js`:

```javascript
const STATIC_USERS = [
  {
    id: '1',
    fullName: 'Your Name',
    email: 'your@email.com',
    password: 'yourpassword',
    role: 'admin', // or 'client' or 'vendor'
  },
  // Add more users here...
];
```

### Change Theme Colors

Edit `src/App.jsx` to customize the Material UI theme.

---

## 🛑 To Stop the Server

Press `Ctrl + C` in the terminal

---

## 📦 Build for Production

```bash
npm run build
```

The production files will be in the `dist` folder.

---

## ✨ That's It!

**Just run `npm run dev` and you're ready to go!**

No backend setup, no database, no API configuration needed. Everything works in the browser! 🎉
