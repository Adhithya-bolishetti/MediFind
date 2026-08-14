import { useState, useContext } from 'react';
import { Box, Button, Typography, Paper, TextField, InputAdornment, IconButton, Divider, Select, MenuItem, FormControl } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import authService from '../services/authService';
import AuthLayout from '../components/auth/AuthLayout';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

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
      const { token, id, role } = res;
      
      login(token, { id, role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 4, md: 6 }, 
          borderRadius: 4, 
          width: '100%', 
          maxWidth: 480,
          boxShadow: '0px 10px 40px rgba(16, 27, 54, 0.08)' 
        }}
      >
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom color="#101B36">
          Welcome Back
        </Typography>
        <Typography variant="body1" textAlign="center" color="#5C6780" mb={4}>
          Login to your MediFind account
        </Typography>

        {error && (
          <Typography color="error" textAlign="center" mb={2} sx={{ fontSize: '0.9rem' }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>
              Mobile Number
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <FormControl sx={{ width: 100, mr: 1 }}>
                <Select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  sx={{ 
                    bgcolor: '#fff', 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D9DEE8' },
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
                {...register("mobileNumber", { 
                  required: "Mobile Number is required",
                  pattern: { value: /^[0-9]{10}$/, message: "Must be a 10-digit number" }
                })}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber?.message}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: '#fff',
                    '& fieldset': { borderColor: '#D9DEE8' },
                    '&:hover fieldset': { borderColor: '#079A9A' },
                    '&.Mui-focused fieldset': { borderColor: '#079A9A' },
                  } 
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>
              Password
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register("password", { required: "Password is required" })}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#9AA4B2' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff sx={{ color: '#9AA4B2' }}/> : <Visibility sx={{ color: '#9AA4B2' }}/>}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  bgcolor: '#fff',
                  '& fieldset': { borderColor: '#D9DEE8' },
                  '&:hover fieldset': { borderColor: '#079A9A' },
                  '&.Mui-focused fieldset': { borderColor: '#079A9A' },
                } 
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Link to="/forgot-password" style={{ color: '#079A9A', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
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
              py: 1.5, 
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: '#079A9A',
              '&:hover': { bgcolor: '#068A8A' },
              mb: 3
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Divider sx={{ flexGrow: 1, borderColor: '#E5E7EB' }} />
          <Typography variant="body2" sx={{ color: '#9CA3AF', mx: 2 }}>
            or
          </Typography>
          <Divider sx={{ flexGrow: 1, borderColor: '#E5E7EB' }} />
        </Box>

        <Typography textAlign="center" sx={{ color: '#5C6780', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#079A9A', textDecoration: 'none', fontWeight: 600 }}>
            Sign Up
          </Link>
        </Typography>
      </Paper>
    </AuthLayout>
  );
};

export default Login;
