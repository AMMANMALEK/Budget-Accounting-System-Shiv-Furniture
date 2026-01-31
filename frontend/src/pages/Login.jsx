import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import { Visibility, VisibilityOff, Business } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const from = location.state?.from?.pathname || null;

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const onValidationErrors = (errors) => {
    console.error("❌ Form Validation Errors:", errors);
    setError("Please fix the highlighted errors.");
  };

  const onSubmit = async (data) => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      console.log('🚀 Login form submitted with:', { email: data.email });
      await login(data.email, data.password);
      console.log('✅ Login successful, waiting for user state update...');
      // Do NOT set loading to false here, to prevent user interaction while diverting
    } catch (err) {
      console.error('❌ Login error:', err);

      let errorMessage = 'Failed to login. Please check your credentials.';

      if (err?.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // Unified redirection logic
  useEffect(() => {
    if (user) {
      console.log('🔄 User state detected:', user);

      try {
        const userRole = user.role?.toUpperCase();

        if (from) {
          console.log('➡️ Redirecting to origin:', from);
          navigate(from, { replace: true });
          return;
        }

        if (userRole === 'ADMIN') {
          console.log('➡️ Redirecting to admin dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else if (userRole === 'PORTAL') {
          console.log('➡️ Redirecting to portal dashboard');
          navigate('/portal/dashboard', { replace: true });
        } else {
          console.warn('⚠️ Unknown user role:', user.role);
          setError(`Login successful but unknown role: ${user.role}.`);
          setLoading(false);
        }
      } catch (e) {
        console.error("❌ Redirection Error:", e);
        setError("Login successful, but redirection failed. Please try refreshing.");
        setLoading(false);
      }
    }
  }, [user, navigate, from]);

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
        width: '100%',
        maxWidth: 400,
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
        <Typography variant="h5" component="h1" gutterBottom fontWeight="600">
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please enter your details to sign in
        </Typography>
      </Box>

      {error && (
        <Fade in={!!error}>
          <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
            {error}
          </Alert>
        </Fade>
      )}

      {user && !loading && (
        <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
          You are logged in! <Link to={user.role === 'ADMIN' ? '/admin/dashboard' : '/portal/dashboard'}>Click here to continue</Link>
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit, onValidationErrors)}
        noValidate
        sx={{ width: '100%' }}
      >
        {/* Email */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
            Email
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter your email"
            autoComplete="email"
            autoFocus
            disabled={loading}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        </Box>

        {/* Password */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
            Password
          </Typography>
          <TextField
            fullWidth
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={loading}
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
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                    size="small"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Remember + Forgot */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <FormControlLabel
            control={<Checkbox size="small" disabled={loading} />}
            label={
              <Typography variant="body2" color="text.secondary">
                Remember me
              </Typography>
            }
          />
          <Link to="#" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary" fontWeight={600}>
              Forgot Password?
            </Typography>
          </Link>
        </Box>

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mb: 3 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Sign In'
          )}
        </Button>

        {/* Signup */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <Typography component="span" color="primary" fontWeight={600}>
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
