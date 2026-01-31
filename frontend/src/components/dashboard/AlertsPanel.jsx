import React from 'react';
import { Card, CardHeader, CardContent, List, ListItem, ListItemIcon, ListItemText, Typography, Chip, Skeleton, Box } from '@mui/material';
import { Warning, Error, Info } from '@mui/icons-material';

const AlertsPanel = ({ alerts, loading }) => {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      default: return <Info />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
      <CardHeader title="System Alerts" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={60} sx={{ mb: 1 }} />
            <Skeleton height={60} sx={{ mb: 1 }} />
            <Skeleton height={60} />
          </Box>
        ) : (
          <List>
            {alerts.map((alert, index) => (
              <ListItem 
                key={alert.id} 
                divider={index !== alerts.length - 1}
                sx={{ 
                  py: 2,
                  px: 3,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getSeverityIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="600" color="text.primary">
                      {alert.message}
                    </Typography>
                  }
                  secondary={alert.time}
                />
                <Chip 
                  label={alert.severity.toUpperCase()} 
                  color={getSeverityColor(alert.severity)} 
                  size="small" 
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} 
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
