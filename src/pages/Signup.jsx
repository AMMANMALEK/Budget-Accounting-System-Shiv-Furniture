import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Container,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';
import authService from '../services/auth.service';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password', '');

  const calculateStrength = (val) => {
    let strength = 0;
    if (val.length >= 6) strength += 25;
    if (val.match(/[A-Z]/)) strength += 25;
    if (val.match(/[0-9]/)) strength += 25;
    if (val.match(/[^A-Za-z0-9]/)) strength += 25;
    setPasswordStrength(strength);
  };

  React.useEffect(() => {
    calculateStrength(password);
  }, [password]);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.signup({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return 'error';
    if (passwordStrength <= 50) return 'warning';
    if (passwordStrength <= 75) return 'info';
    return 'success';
  };

  return (
    <Card
      elevation={0}
      sx={{
        p: 4,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                mx: 'auto',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              }}
            >
              <PersonAdd sx={{ fontSize: 30, color: '#fff' }} />
            </Box>
            <Typography variant="h5" component="h1" gutterBottom color="text.primary">
              Create an account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join our ERP platform to manage your business
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: '100%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Full Name
                </Typography>
                <TextField
                  fullWidth
                  id="fullName"
                  placeholder="John Doe"
                  autoComplete="name"
                  autoFocus
                  {...register('fullName', { required: 'Full Name is required' })}
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                  InputProps={{ sx: { fontSize: 14 } }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Role
                </Typography>
                <TextField
                  select
                  fullWidth
                  id="role"
                  defaultValue=""
                  placeholder="Select Role"
                  inputProps={register('role', { required: 'Role is required' })}
                  error={!!errors.role}
                  helperText={errors.role?.message}
                  InputProps={{ sx: { fontSize: 14 } }}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="client">Portal</MenuItem>
                </TextField>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.5, fontWeight: 600 }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                id="email"
                placeholder="name@company.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{ sx: { fontSize: 14 } }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.5, fontWeight: 600 }}>
                Password
              </Typography>
              <TextField
                fullWidth
                name="password"
                placeholder="Create a password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  sx: { fontSize: 14 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {password && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={passwordStrength} 
                    color={getStrengthColor()}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Password Strength: {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.5, fontWeight: 600 }}>
                Confirm Password
              </Typography>
              <TextField
                fullWidth
                name="confirmPassword"
                placeholder="Confirm your password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => {
                    if (watch('password') != val) {
                      return "Your passwords do not match";
                    }
                  },
                })}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{ sx: { fontSize: 14 } }}
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox 
                  value="allowExtraEmails" 
                  color="primary" 
                  size="small"
                  {...register('terms', { required: 'You must agree to the terms' })}
                />
              }
              label={<Typography variant="body2" color="text.secondary">I agree to the <Link to="#" style={{ color: '#1976d2', textDecoration: 'none' }}>Terms and Conditions</Link></Typography>}
              sx={{ mt: 0, mb: 1 }}
            />
            {errors.terms && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: -1, mb: 2, ml: 4 }}>
                {errors.terms.message}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 2, mb: 3 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography component="span" variant="body2" color="primary" fontWeight={600}>
                    Sign In
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
    </Card>
  );
};

export default Signup;
