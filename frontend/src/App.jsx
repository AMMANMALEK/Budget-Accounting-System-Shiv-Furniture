import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import PortalLayout from './layouts/PortalLayout';
import AuthLayout from './layouts/AuthLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import PagePlaceholder from './pages/admin/PagePlaceholder'; // Fallback for settings

// Admin Masters
import Contacts from './pages/admin/masters/Contacts';
import Products from './pages/admin/masters/Products';
import CostCenters from './pages/admin/masters/CostCenters';
import Budgets from './pages/admin/masters/Budgets';
import AutoRules from './pages/admin/masters/AutoRules';

// Admin Purchases
import PurchaseOrders from './pages/admin/purchases/PurchaseOrders';
import VendorBills from './pages/admin/purchases/VendorBills';
import Payments from './pages/admin/purchases/Payments';

// Admin Sales
import SalesOrders from './pages/admin/sales/SalesOrders';
import Invoices from './pages/admin/sales/Invoices';
import SalesPayments from './pages/admin/sales/Payments';

// Admin Production
import ProductionDashboard from './pages/admin/production/ProductionDashboard';
import ProductionExpenses from './pages/admin/production/ProductionExpenses';

// Admin Reports
import BudgetVsActual from './pages/admin/reports/BudgetVsActual';
import CostCenterPerformance from './pages/admin/reports/CostCenterPerformance';

// Portal Pages
import PortalDashboard from './pages/portal/Dashboard';
import PortalInvoices from './pages/portal/Invoices';
import InvoiceDetail from './pages/portal/InvoiceDetail';
import PortalOrders from './pages/portal/Orders';
import PortalPayments from './pages/portal/Payments';
import PortalProfile from './pages/portal/Profile';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Professional Blue
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f4f6f8', // Soft gray background
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
          },
        },
        contained: {
          padding: '10px 20px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />

            {/* Masters */}
            <Route path="masters/contacts" element={<Contacts />} />
            <Route path="masters/products" element={<Products />} />
            <Route path="masters/cost-centers" element={<CostCenters />} />
            <Route path="masters/budgets" element={<Budgets />} />
            <Route path="masters/auto-rules" element={<AutoRules />} />

            {/* Purchases */}
            <Route path="purchases/orders" element={<PurchaseOrders />} />
            <Route path="purchases/bills" element={<VendorBills />} />
            <Route path="purchases/payments" element={<Payments />} />

            {/* Sales */}
            <Route path="sales/orders" element={<SalesOrders />} />
            <Route path="sales/invoices" element={<Invoices />} />
            <Route path="sales/payments" element={<SalesPayments />} />

            {/* Production */}
            <Route path="production/dashboard" element={<ProductionDashboard />} />
            <Route path="production/expenses" element={<ProductionExpenses />} />

            {/* Reports */}
            <Route path="reports/budget-vs-actual" element={<BudgetVsActual />} />
            <Route path="reports/cost-center-performance" element={<CostCenterPerformance />} />

            {/* Settings */}
            <Route path="settings" element={<PagePlaceholder />} />
          </Route>

          {/* Portal Routes */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={['PORTAL']}>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="invoices" element={<PortalInvoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="orders" element={<PortalOrders />} />
            <Route path="payments" element={<PortalPayments />} />
            <Route path="profile" element={<PortalProfile />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
