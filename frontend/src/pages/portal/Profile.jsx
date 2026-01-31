import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid, TextField, Button, Avatar, Typography, Divider, Alert, Tabs, Tab, Switch, FormControlLabel } from '@mui/material';
import { Save, Person, Lock, Notifications, Security } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import portalService from '../../services/portal.service';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    preferences: {
      notifications: true,
      newsletter: false
    }
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await portalService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: checked
      }
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await portalService.updateProfile(profile);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    try {
      setSaving(true);
      await portalService.changePassword(passwords.current, passwords.new);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100%', m: 0, p: 0 }}>
      <PageHeader title="My Profile" subtitle="Manage your account information" />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', textAlign: 'center', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: '2.5rem' }}>
                <Person fontSize="inherit" />
              </Avatar>
            </Box>
            <Typography variant="h6" fontWeight={600}>
              {profile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Client Account
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Member Since:</strong> Jan 2024
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Account ID:</strong> #{(profile.id || '').toString().padStart(6, '0')}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
                <Tab icon={<Person />} iconPosition="start" label="Account Info" />
                <Tab icon={<Security />} iconPosition="start" label="Security" />
                <Tab icon={<Notifications />} iconPosition="start" label="Preferences" />
              </Tabs>
            </Box>
            <CardContent>
              {message && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                  {message.text}
                </Alert>
              )}

              {/* Account Info Tab */}
              {activeTab === 0 && (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Edit Personal Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Company Name"
                        name="name"
                        value={profile.name || ''}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Tax ID / VAT"
                        name="taxId"
                        value={profile.taxId || ''}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={profile.email || ''}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={profile.phone || ''}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Billing Address"
                        name="address"
                        value={profile.address || ''}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        startIcon={<Save />}
                        disabled={loading || saving}
                        size="large"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Security Tab */}
              {activeTab === 1 && (
                <Box component="form" onSubmit={handlePasswordSubmit} noValidate>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Change Password
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        name="current"
                        type="password"
                        value={passwords.current}
                        onChange={handlePasswordChange}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="New Password"
                        name="new"
                        type="password"
                        value={passwords.new}
                        onChange={handlePasswordChange}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        name="confirm"
                        type="password"
                        value={passwords.confirm}
                        onChange={handlePasswordChange}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        startIcon={<Lock />}
                        disabled={loading || saving}
                        size="large"
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Preferences Tab */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Notification Preferences
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={profile.preferences?.notifications || false} 
                            onChange={handlePreferenceChange} 
                            name="notifications" 
                          />
                        }
                        label="Enable Email Notifications"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Receive emails about new invoices, order updates, and payment confirmations.
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={profile.preferences?.newsletter || false} 
                            onChange={handlePreferenceChange} 
                            name="newsletter" 
                          />
                        }
                        label="Subscribe to Newsletter"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Receive marketing updates, product announcements, and promotional offers.
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        startIcon={<Save />}
                        disabled={loading || saving}
                        size="large"
                      >
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
