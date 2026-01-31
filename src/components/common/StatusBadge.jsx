import React from 'react';
import { Chip } from '@mui/material';

const StatusBadge = ({ status, type = 'default' }) => {
  let color = 'default';
  
  // Define color mappings based on common status keywords
  const lowerStatus = String(status).toLowerCase();
  
  if (['active', 'approved', 'paid', 'issued', 'completed', 'received'].includes(lowerStatus)) {
    color = 'success';
  } else if (['inactive', 'cancelled', 'rejected', 'void'].includes(lowerStatus)) {
    color = 'error';
  } else if (['pending', 'draft', 'open', 'in progress'].includes(lowerStatus)) {
    color = 'warning';
  } else if (['info', 'new'].includes(lowerStatus)) {
    color = 'info';
  }

  return (
    <Chip 
      label={status} 
      color={color} 
      size="small" 
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
};

export default StatusBadge;
