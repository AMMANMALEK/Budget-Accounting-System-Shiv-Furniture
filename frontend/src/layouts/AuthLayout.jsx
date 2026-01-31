import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        m: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        padding: 2,
      }}
    >
      <Container maxWidth="xs">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
            ERP Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enterprise Resource Planning System
          </Typography>
        </Box>
        <Outlet />
      </Container>
    </Box>
  );
};

export default AuthLayout;
