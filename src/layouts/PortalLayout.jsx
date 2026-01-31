import React, { useState } from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Receipt,
  Payment,
  Person,
  ShoppingCart
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const drawerWidth = 220; // Smaller sidebar
const collapsedWidth = 65;

const PortalLayout = () => {
  const [open, setOpen] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleSubmenuClick = (menu) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    {
      title: 'Dashboard',
      path: '/portal/dashboard',
      icon: <DashboardIcon />
    },
    {
      title: 'Invoices',
      path: '/portal/invoices',
      icon: <Receipt />
    },
    {
      title: 'Orders',
      path: '/portal/orders',
      icon: <ShoppingCart />
    },
    {
      title: 'Payments',
      path: '/portal/payments',
      icon: <Payment />
    },
    {
      title: 'Profile',
      path: '/portal/profile',
      icon: <Person />
    }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <Topbar 
        open={open} 
        handleDrawerToggle={handleDrawerToggle} 
        drawerWidth={drawerWidth} 
        collapsedWidth={collapsedWidth}
        title="Client Portal"
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
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)` },
          ml: { sm: `${open ? drawerWidth : collapsedWidth}px` },
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default PortalLayout;
