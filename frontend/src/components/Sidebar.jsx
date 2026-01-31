import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Collapse,
  Box
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ 
  open, 
  drawerWidth, 
  collapsedWidth = 65, 
  menuItems, 
  openSubmenus, 
  handleSubmenuClick 
}) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: open ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          transition: 'width 0.2s',
          overflowX: 'hidden',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Toolbar /> {/* Spacer for AppBar */}
      <Box sx={{ overflow: 'auto', mt: 1 }}>
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.title}>
              {item.items ? (
                // Has Submenu
                <>
                  <ListItemButton 
                    onClick={() => handleSubmenuClick(item.submenu)}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                        color: 'text.secondary' 
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.title} sx={{ opacity: open ? 1 : 0 }} />
                    {open && (openSubmenus[item.submenu] ? <ExpandLess /> : <ExpandMore />)}
                  </ListItemButton>
                  <Collapse in={openSubmenus[item.submenu] && open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.items.map((subItem) => (
                        <ListItemButton
                          key={subItem.title}
                          component={Link}
                          to={subItem.path}
                          sx={{
                            pl: 4,
                            bgcolor: isActive(subItem.path) ? 'action.selected' : 'transparent',
                            borderRight: isActive(subItem.path) ? '3px solid #1976d2' : 'none',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, color: isActive(subItem.path) ? 'primary.main' : 'text.secondary' }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.title} 
                            primaryTypographyProps={{ 
                              fontSize: '0.9rem',
                              fontWeight: isActive(subItem.path) ? 600 : 400,
                              color: isActive(subItem.path) ? 'primary.main' : 'text.primary'
                            }} 
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                // Single Item
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
                    borderRight: isActive(item.path) ? '3px solid #1976d2' : 'none',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: isActive(item.path) ? 'primary.main' : 'text.secondary' 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title} 
                    sx={{ opacity: open ? 1 : 0 }}
                    primaryTypographyProps={{ 
                      fontWeight: isActive(item.path) ? 600 : 400,
                      color: isActive(item.path) ? 'primary.main' : 'text.primary'
                    }}
                  />
                </ListItemButton>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
