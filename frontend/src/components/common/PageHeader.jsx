import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const PageHeader = ({ title, onAdd, buttonText = 'Add New' }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Box sx={{ mb: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/admin/dashboard" underline="hover" color="inherit">
          Admin
        </MuiLink>
        {pathnames.slice(1, -1).map((value, index) => {
          const to = `/${pathnames.slice(0, index + 2).join('/')}`;
          return (
            <MuiLink 
              key={to} 
              component={Link} 
              to={to} 
              underline="hover" 
              color="inherit"
              sx={{ textTransform: 'capitalize' }}
            >
              {value.replace(/-/g, ' ')}
            </MuiLink>
          );
        })}
        <Typography color="text.primary" sx={{ textTransform: 'capitalize' }}>
          {title}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="700" color="text.primary">
          {title}
        </Typography>
        {onAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            sx={{ px: 3 }}
          >
            {buttonText}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
