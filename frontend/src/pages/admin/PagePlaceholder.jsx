import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { useLocation } from 'react-router-dom';

const PagePlaceholder = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const title = pathnames[pathnames.length - 1]
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink underline="hover" color="inherit" href="/admin/dashboard">
          Admin
        </MuiLink>
        {pathnames.slice(1).map((value, index) => {
          const last = index === pathnames.slice(1).length - 1;
          const to = `/${pathnames.slice(0, index + 2).join('/')}`;

          return last ? (
            <Typography color="text.primary" key={to}>
              {value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Typography>
          ) : (
            <MuiLink underline="hover" color="inherit" href={to} key={to}>
              {value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </MuiLink>
          );
        })}
      </Breadcrumbs>
      
      <Typography variant="h4" gutterBottom fontWeight="600" color="text.primary">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This is the {title} page. Content coming soon.
      </Typography>
    </Box>
  );
};

export default PagePlaceholder;
