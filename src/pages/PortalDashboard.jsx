import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Container } from '@mui/material';
import { AccountCircle, ExitToApp } from '@mui/icons-material';
import authService from '../services/auth.service';

const PortalDashboard = () => {
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
                        <AccountCircle sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
                        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
                            Portal Dashboard
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                            Welcome, {user?.fullName || 'User'}!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            This is a placeholder for the client/vendor portal dashboard.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Role: <strong>{user?.role || 'Client'}</strong>
                        </Typography>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<ExitToApp />}
                            onClick={handleLogout}
                            sx={{
                                borderColor: 'secondary.main',
                                color: 'secondary.main',
                                '&:hover': {
                                    borderColor: 'secondary.light',
                                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
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

export default PortalDashboard;
