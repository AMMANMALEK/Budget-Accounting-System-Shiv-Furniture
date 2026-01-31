import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Container } from '@mui/material';
import { Dashboard, ExitToApp } from '@mui/icons-material';
import authService from '../services/auth.service';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
            }}
        >
            <Container maxWidth="md">
                <Card
                    sx={{
                        background: 'rgba(26, 26, 46, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Dashboard sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                            Admin Dashboard
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                            Welcome back, {user?.fullName || 'Administrator'}!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            This is a placeholder for the admin dashboard. You have successfully logged in
                            with admin privileges.
                        </Typography>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<ExitToApp />}
                            onClick={handleLogout}
                            sx={{
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                    borderColor: 'primary.light',
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                },
                            }}
                        >
                            Logout
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default AdminDashboard;
