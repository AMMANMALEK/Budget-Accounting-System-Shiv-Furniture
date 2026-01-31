import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Business,
  People,
  Inventory,
  AccountBalance,
  MonetizationOn,
  Settings,
  ShoppingCart,
  Receipt,
  Payment,
  Factory,
  Engineering,
  BarChart,
  ShowChart
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const drawerWidth = 260;
const collapsedWidth = 65;

const AdminLayout = () => {
  const [open, setOpen] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState({
    masters: false,
    purchases: false,
    sales: false,
    production: false,
    reports: false
  });

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleSubmenuClick = (menu) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: <DashboardIcon />
    },
    {
      title: 'Masters',
      icon: <Business />,
      submenu: 'masters',
      items: [
        { title: 'Budgets', path: '/admin/masters/budgets', icon: <AccountBalance /> },
        { title: 'Contacts', path: '/admin/masters/contacts', icon: <People /> },
        { title: 'Products', path: '/admin/masters/products', icon: <Inventory /> },
        { title: 'Cost Centers', path: '/admin/masters/cost-centers', icon: <ShowChart /> },
        { title: 'Auto Rules', path: '/admin/masters/auto-rules', icon: <Settings /> }
      ]
    },
    {
      title: 'Purchases',
      icon: <ShoppingCart />,
      submenu: 'purchases',
      items: [
        { title: 'Orders', path: '/admin/purchases/orders', icon: <Receipt /> },
        { title: 'Bills', path: '/admin/purchases/bills', icon: <Receipt /> },
        { title: 'Payments', path: '/admin/purchases/payments', icon: <Payment /> }
      ]
    },
    {
      title: 'Sales',
      icon: <MonetizationOn />,
      submenu: 'sales',
      items: [
        { title: 'Orders', path: '/admin/sales/orders', icon: <Receipt /> },
        { title: 'Invoices', path: '/admin/sales/invoices', icon: <Receipt /> },
        { title: 'Payments', path: '/admin/sales/payments', icon: <Payment /> }
      ]
    },
    {
      title: 'Production',
      icon: <Factory />,
      submenu: 'production',
      items: [
        { title: 'Dashboard', path: '/admin/production/dashboard', icon: <DashboardIcon /> },
        { title: 'Expenses', path: '/admin/production/expenses', icon: <Engineering /> }
      ]
    },
    {
      title: 'Reports',
      icon: <BarChart />,
      submenu: 'reports',
      items: [
        { title: 'Budget vs Actual', path: '/admin/reports/budget-vs-actual', icon: <ShowChart /> },
        { title: 'Cost Center Perf.', path: '/admin/reports/cost-center-performance', icon: <BarChart /> }
      ]
    },
    {
      title: 'Settings',
      path: '/admin/settings',
      icon: <Settings />
    }
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <CssBaseline />
      
      <Topbar 
        open={open} 
        handleDrawerToggle={handleDrawerToggle} 
        drawerWidth={drawerWidth} 
        collapsedWidth={collapsedWidth}
        title="Admin Portal"
      />

      <Sidebar 
        open={open} 
        drawerWidth={drawerWidth} 
        collapsedWidth={collapsedWidth}
        menuItems={menuItems} 
        openSubmenus={openSubmenus} 
        handleSubmenuClick={handleSubmenuClick} 
      />

      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          height: '100vh', 
          overflow: 'auto', 
          p: 2, 
          m: 0 
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
