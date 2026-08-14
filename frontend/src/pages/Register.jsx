import { useState, useContext } from 'react';
import { Box, Button, Typography, Paper, TextField, InputAdornment, IconButton, Select, MenuItem, FormControl, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      role: 'PATIENT'
    }
  });

  const watchPassword = watch("password", "");

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  const { login } = useContext(AuthContext);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    
    try {
      const fakeEmail = `${countryCode.replace('+', '')}${data.mobileNumber}@medifind.com`;
      
      const payload = {
        fullName: data.fullName,
        email: fakeEmail,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role
      };
      
      await authService.register(payload);
      
      // Immediately log the user in
      const loginRes = await authService.login({
        email: fakeEmail,
        password: data.password
      });

      const user = await login(loginRes.accessToken);

      // Determine where to route them
      if (user.role === 'DOCTOR') {
        navigate('/doctor/profile');
      } else if (user.role === 'PATIENT') {
        navigate('/patient/profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please ensure the backend services are running.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 4, md: 5 }, 
          borderRadius: 4, 
          width: '100%', 
          maxWidth: 500,
          boxShadow: '0px 10px 40px rgba(16, 27, 54, 0.08)' 
        }}
      >
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom color="#101B36">
          Create Your Account
        </Typography>
        <Typography variant="body1" textAlign="center" color="#5C6780" mb={4}>
          Join MediFind and find the right care
        </Typography>

        {error && (
          <Typography color="error" textAlign="center" mb={2} sx={{ fontSize: '0.9rem' }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <ToggleButtonGroup
                  {...field}
                  exclusive
                  onChange={(_, newValue) => {
                    if (newValue !== null) {
                      field.onChange(newValue);
                    }
                  }}
                  sx={{
                    '& .MuiToggleButtonGroup-grouped': {
                      border: '1px solid #D9DEE8',
                      borderRadius: '8px !important',
                      mx: 1,
                      px: 4,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      color: '#5C6780',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(7, 154, 154, 0.1)',
                        color: '#079A9A',
                        borderColor: '#079A9A',
                        '&:hover': {
                          bgcolor: 'rgba(7, 154, 154, 0.2)',
                        }
                      }
                    }
                  }}
                >
                  <ToggleButton value="PATIENT">
                    Patient
                  </ToggleButton>
                  <ToggleButton value="DOCTOR">
                    Doctor
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>
              Full Name
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your full name"
              {...register("fullName", { required: "Full name is required" })}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineRoundedIcon sx={{ color: '#9AA4B2' }} />
                  </InputAdornment>
                ),
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

          <Box sx={{ mb: 2 }}>
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

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>
              Password
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters"} })}
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

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>
              Confirm Password
            </Typography>
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              {...register("confirmPassword", { 
                required: "Please confirm your password",
                validate: val => {
                  if (watchPassword !== val) {
                    return "Your passwords do not match";
                  }
                }
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#9AA4B2' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowConfirmPassword} edge="end">
                      {showConfirmPassword ? <VisibilityOff sx={{ color: '#9AA4B2' }}/> : <Visibility sx={{ color: '#9AA4B2' }}/>}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
        
        <Typography textAlign="center" sx={{ color: '#5C6780', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#079A9A', textDecoration: 'none', fontWeight: 600 }}>
            Log In
          </Link>
        </Typography>
      </Paper>
    </AuthLayout>
  );
};

export default Register;
