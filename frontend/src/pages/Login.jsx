import { useState, useContext } from 'react';
import { Box, Button, Typography, Paper, TextField, InputAdornment, IconButton, Divider, Select, MenuItem, FormControl, Alert, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import authService from '../services/authService';
import AuthLayout from '../components/auth/AuthLayout';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const TEAL = '#079A9A';
const DARK = '#101B36';
const MUTED = '#5C6780';
const BORDER = '#D9DEE8';

// Shared input styling — consistent with the signup page.
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fff',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: TEAL },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: '1.5px' },
  },
};

const getFriendlyError = (err) => {
  if (err?.code === 'ERR_NETWORK') {
    return 'Cannot connect to the server. Please check your connection and try again.';
  }
  const status = err?.response?.status;
  if (status === 401) return 'Invalid mobile number or password. Please try again.';
  return 'Unable to log in. Please try again.';
};

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const onSubmit = async (data) => {
    if (loading) return; // prevent double submission
    setError('');
    setLoading(true);
    
    try {
      // Transform mobile number to a fake email to satisfy the existing backend API
      const fakeEmail = `${countryCode.replace('+', '')}${data.mobileNumber}@medifind.com`;
      
      const payload = {
        email: fakeEmail,
        password: data.password
      };

      const res = await authService.login(payload);
      
      // We now await login which fetches the full user and profile completion status
      const user = await login(res.accessToken);
      
      // Determine post-login routing
      if (user.role === 'DOCTOR') {
        navigate(user.isProfileComplete ? '/dashboard' : '/doctor/profile');
      } else if (user.role === 'PATIENT') {
        navigate(user.isProfileComplete ? '/dashboard' : '/patient/profile');
      } else {
        // ADMIN or other roles
        navigate('/dashboard');
      }

    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, sm: 4, md: 5 }, 
          borderRadius: '20px', 
          width: '100%', 
          maxWidth: 480,
          boxShadow: '0 12px 48px rgba(16, 27, 54, 0.10)',
          border: '1px solid #EDF1F5',
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom color={DARK} sx={{ letterSpacing: '-0.5px', textAlign: 'center' }}>
          Welcome Back
        </Typography>
        <Typography variant="body1" color={MUTED} mb={3} sx={{ textAlign: 'center' }}>
          Login to your MediFind account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: DARK, fontWeight: 600, mb: 1 }}>
              Mobile Number
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <FormControl sx={{ width: 96, mr: 1 }}>
                <Select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  sx={{ 
                    bgcolor: '#fff', 
                    borderRadius: 2.5,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: TEAL },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: TEAL },
                  }}
                >
                  <MenuItem value="+91">+91</MenuItem>
                  <MenuItem value="+1">+1</MenuItem>
                  <MenuItem value="+44">+44</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                placeholder="Enter your mobile number"
                autoComplete="tel-national"
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }}
                {...register("mobileNumber", { 
                  required: "Mobile Number is required",
                  pattern: { value: /^[0-9]{10}$/, message: "Must be a 10-digit number" }
                })}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber?.message}
                sx={inputSx}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: DARK, fontWeight: 600, mb: 1 }}>
              Password
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register("password", { required: "Password is required" })}
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#9AA4B2' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClickShowPassword} edge="end" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <VisibilityOff sx={{ color: '#9AA4B2' }}/> : <Visibility sx={{ color: '#9AA4B2' }}/>}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={inputSx}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Link to="/forgot-password" style={{ color: TEAL, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              Forgot Password?
            </Link>
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            disableElevation
            sx={{ 
              py: 1.6, 
              borderRadius: 2.5,
              fontSize: '1rem',
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: TEAL,
              boxShadow: '0 6px 16px rgba(7,154,154,0.3)',
              '&:hover': { bgcolor: '#068A8A', boxShadow: '0 8px 20px rgba(7,154,154,0.38)' },
              '&:disabled': { bgcolor: '#9CCFCF', color: '#fff' },
              mb: 3
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1.25 }} />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </Button>
        </form>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Divider sx={{ flexGrow: 1, borderColor: '#E5E7EB' }} />
          <Typography variant="body2" sx={{ color: '#9CA3AF', mx: 2 }}>
            or
          </Typography>
          <Divider sx={{ flexGrow: 1, borderColor: '#E5E7EB' }} />
        </Box>

        <Typography textAlign="center" sx={{ color: MUTED, fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: TEAL, textDecoration: 'none', fontWeight: 700 }}>
            Sign Up
          </Link>
        </Typography>
      </Paper>
    </AuthLayout>
  );
};

export default Login;
