import React from 'react';
import { Card, CardContent, CardHeader, Skeleton, Box } from '@mui/material';

const ChartCard = ({ title, children, loading, height = 300 }) => {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: 3, 
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
      }}
    >
      <CardHeader 
        title={title} 
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 2 }} />
        ) : (
          <Box sx={{ width: '100%', height: height }}>
            {children}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
