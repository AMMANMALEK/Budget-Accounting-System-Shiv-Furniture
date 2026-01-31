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
} from '@mui/material';
import { Visibility, VisibilityOff, Business } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const user = await login(data.email, data.password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/portal/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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
          <Business sx={{ fontSize: 30, color: '#fff' }} />
        </Box>
        <Typography variant="h5" component="h1" gutterBottom color="text.primary">
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please enter your details to sign in
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: '100%' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.5, fontWeight: 600 }}>
            Email
          </Typography>
          <TextField
            fullWidth
            id="email"
            placeholder="Enter your email"
            autoComplete="email"
            autoFocus
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              sx: { fontSize: 14 }
            }}
          />
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="text.primary" sx={{ mb: 0.5, fontWeight: 600 }}>
            Password
          </Typography>
          <TextField
            fullWidth
            name="password"
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
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
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" size="small" />}
            label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
          />
          <Link to="#" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary" fontWeight={600}>
              Forgot Password?
            </Typography>
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mb: 3 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <Typography component="span" variant="body2" color="primary" fontWeight={600}>
                Sign up
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default Login;
