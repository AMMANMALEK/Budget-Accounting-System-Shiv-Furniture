import React from 'react';
import { Card, CardHeader, CardContent, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Skeleton, Box } from '@mui/material';
import { Person, Description, Edit, Download } from '@mui/icons-material';

const RecentActivity = ({ activities, loading }) => {
  const getActionIcon = (action) => {
    if (action.includes('Created')) return <Description />;
    if (action.includes('Approved')) return <Person />;
    if (action.includes('Updated')) return <Edit />;
    if (action.includes('Exported')) return <Download />;
    return <Description />;
  };

  const getAvatarColor = (index) => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0'];
    return colors[index % colors.length];
  };

  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
      <CardHeader title="Recent Activity" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
          </Box>
        ) : (
          <List>
            {activities.map((activity, index) => (
              <ListItem
                key={activity.id}
                alignItems="flex-start"
                divider={index !== activities.length - 1}
                sx={{ px: 3, py: 2 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getAvatarColor(index) }}>
                    {(activity.user && activity.user.charAt(0)) || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" fontWeight="600">
                      {activity.user || 'Unknown User'}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block', my: 0.5 }}
                      >
                        {activity.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
