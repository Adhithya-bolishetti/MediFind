import { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, MenuItem } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import authService from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      role: 'PATIENT'
    }
  });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    
    try {
      const payload = {
        fullName: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password
      };
      
      // Register with auth service
      await authService.register(payload);
      
      // Note: role and phoneNumber are not supported by the current auth-service's 
      // RegisterRequest, which defaults to Role.USER. A separate step is needed 
      // to create user/doctor profiles later if needed.
      
      navigate('/login');
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please ensure the backend services (API Gateway, Auth Service) are running.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', py: 4 }}>
      <Container maxWidth="sm">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Paper elevation={10} sx={{ p: 5, borderRadius: 4, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
            <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom color="primary">
              Create an Account
            </Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary" mb={4}>
              Join MediFind to manage your healthcare journey
            </Typography>

            {error && (
              <Typography color="error" textAlign="center" mb={2}>
                {error}
              </Typography>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  {...register("firstName", { required: "First Name is required" })}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  {...register("lastName", { required: "Last Name is required" })}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Box>
              
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                {...register("email", { 
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Password"
                type="password"
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters"} })}
                error={!!errors.password}
                helperText={errors.password?.message}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Phone Number"
                {...register("phoneNumber", { required: "Phone number is required" })}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
                margin="normal"
              />
              
              <TextField
                fullWidth
                select
                label="Account Type"
                {...register("role", { required: "Role is required" })}
                error={!!errors.role}
                helperText={errors.role?.message}
                margin="normal"
                sx={{ mb: 3 }}
                defaultValue="PATIENT"
              >
                <MenuItem value="PATIENT">Patient</MenuItem>
                <MenuItem value="DOCTOR">Doctor</MenuItem>
              </TextField>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  mb: 2,
                  background: 'linear-gradient(45deg, #1976d2, #9c27b0)'
                }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
            
            <Typography textAlign="center" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
                Sign In
              </Link>
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Register;
