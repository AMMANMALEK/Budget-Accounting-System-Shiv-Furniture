import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import PortalLayout from '../layouts/PortalLayout';
import AuthLayout from '../layouts/AuthLayout';

// Pages
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/admin/Dashboard';
import PagePlaceholder from '../pages/admin/PagePlaceholder';

// Masters Pages
import Contacts from '../pages/admin/masters/Contacts';
import Products from '../pages/admin/masters/Products';
import CostCenters from '../pages/admin/masters/CostCenters';
import Budgets from '../pages/admin/masters/Budgets';
import AutoRules from '../pages/admin/masters/AutoRules';

// Purchase Pages
import PurchaseOrders from '../pages/admin/purchases/PurchaseOrders';
import VendorBills from '../pages/admin/purchases/VendorBills';
import Payments from '../pages/admin/purchases/Payments';

// Sales Pages
import SalesOrders from '../pages/admin/sales/SalesOrders';
import Invoices from '../pages/admin/sales/Invoices';
import SalesPayments from '../pages/admin/sales/Payments';

// Production Pages
import ProductionDashboard from '../pages/admin/production/ProductionDashboard';
import ProductionExpenses from '../pages/admin/production/ProductionExpenses';

// Report Pages
import BudgetVsActual from '../pages/admin/reports/BudgetVsActual';
import CostCenterPerformance from '../pages/admin/reports/CostCenterPerformance';

// Portal Pages
import PortalDashboard from '../pages/portal/Dashboard';
import PortalInvoices from '../pages/portal/Invoices';
import InvoiceDetail from '../pages/portal/InvoiceDetail';
import PortalOrders from '../pages/portal/Orders';
import PortalPayments from '../pages/portal/Payments';
import PortalProfile from '../pages/portal/Profile';

// Components
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  const routes = [
    {
      element: <AuthLayout />,
      children: [
        { path: '/', element: <Navigate to="/login" replace /> },
        { path: 'login', element: <Login /> },
        { path: 'signup', element: <Signup /> },
      ]
    },
    {
      path: 'admin',
      element: (
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: 'dashboard', element: <Dashboard /> },
        
        // Masters
        { path: 'masters/contacts', element: <Contacts /> },
        { path: 'masters/products', element: <Products /> },
        { path: 'masters/cost-centers', element: <CostCenters /> },
        { path: 'masters/budgets', element: <Budgets /> },
        { path: 'masters/auto-rules', element: <AutoRules /> },
        
        // Purchases
        { path: 'purchases/orders', element: <PurchaseOrders /> },
        { path: 'purchases/bills', element: <VendorBills /> },
        { path: 'purchases/payments', element: <Payments /> },
        
        // Sales
        { path: 'sales/orders', element: <SalesOrders /> },
        { path: 'sales/invoices', element: <Invoices /> },
        { path: 'sales/payments', element: <SalesPayments /> },
        
        // Production
        { path: 'production/dashboard', element: <ProductionDashboard /> },
        { path: 'production/expenses', element: <ProductionExpenses /> },
        
        // Reports
        { path: 'reports/budget-vs-actual', element: <BudgetVsActual /> },
        { path: 'reports/cost-center-performance', element: <CostCenterPerformance /> },
        
        // Settings
        { path: 'settings', element: <PagePlaceholder /> },
      ]
    },
    {
      path: 'portal',
      element: (
        <ProtectedRoute allowedRoles={['client']}>
          <PortalLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: 'dashboard', element: <PortalDashboard /> },
        { path: 'invoices', element: <PortalInvoices /> },
        { path: 'invoices/:id', element: <InvoiceDetail /> },
        { path: 'orders', element: <PortalOrders /> },
        { path: 'payments', element: <PortalPayments /> },
        { path: 'profile', element: <PortalProfile /> },
      ]
    },
    // Catch all - redirect to login
    { path: '*', element: <Navigate to="/login" replace /> }
  ];

  return useRoutes(routes);
};

export default AppRoutes;
