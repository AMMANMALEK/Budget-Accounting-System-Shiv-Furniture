import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton, Icon } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';

const KPICard = ({ title, value, trend, status, icon, color, loading }) => {
  if (loading) {
    return (
      <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width={60} />
          </Box>
          <Skeleton variant="text" width="80%" height={40} />
          <Skeleton variant="text" width="40%" />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = status === 'up' ? TrendingUp : status === 'down' ? TrendingDown : Remove;
  const trendColor = status === 'up' ? 'success.main' : status === 'down' ? 'error.main' : 'text.secondary';

  return (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: 4, 
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box 
            sx={{ 
              p: 2, 
              borderRadius: 3, 
              bgcolor: `${color}15`, 
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {React.cloneElement(icon, { fontSize: "large" })}
          </Box>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', color: trendColor, bgcolor: `${trendColor}15`, px: 1, py: 0.5, borderRadius: 1 }}>
              <TrendIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption" fontWeight="700">
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="h4" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
          {value}
        </Typography>
        <Typography variant="body1" color="text.secondary" fontWeight="500">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default KPICard;
