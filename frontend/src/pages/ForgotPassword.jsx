import { useState } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Select, MenuItem,
  FormControl, Alert, CircularProgress,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import authService from '../services/authService';
import AuthLayout from '../components/auth/AuthLayout';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';

const TEAL = '#079A9A';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: 'var(--mf-input)',
    '& fieldset': { borderColor: 'var(--mf-border)' },
    '&:hover fieldset': { borderColor: TEAL },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: '1.5px' },
  },
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [identifier, setIdentifier] = useState('');

  const { register: registerForgot, handleSubmit: handleSubmitForgot, formState: { errors: errorsForgot } } = useForm({ mode: 'onTouched' });
  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: errorsReset } } = useForm({ mode: 'onTouched' });

  const onSubmitForgot = async (data) => {
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const raw = (data.mobileNumber || '').trim();
      const resolvedIdentifier = raw.includes('@') ? raw : `${countryCode.replace('+', '')}${raw}`;
      await authService.forgotPassword({ email: resolvedIdentifier });
      setIdentifier(resolvedIdentifier);
      setSent(true);
    } catch (err) {
      if (err?.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please check your connection and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitReset = async (data) => {
    if (loading) return;
    setError('');
    setLoading(true);

    if (data.newPassword !== data.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authService.resetPassword({
        email: identifier,
        otp: data.otp,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      alert('Password reset successful. Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
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
          border: '1px solid var(--mf-border)',
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ color: 'var(--mf-text)', letterSpacing: '-0.5px', textAlign: 'center' }}>
          Reset Password
        </Typography>
        
        {!sent ? (
          <Typography variant="body1" sx={{ color: 'var(--mf-muted)', mb: 3, textAlign: 'center' }}>
            Enter your registered mobile number or email and we&apos;ll send you instructions to reset your password.
          </Typography>
        ) : (
          <Typography variant="body1" sx={{ color: 'var(--mf-muted)', mb: 3, textAlign: 'center' }}>
            An OTP has been sent to your registered contact. Please enter it below.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}>
            {error}
          </Alert>
        )}

        {!sent ? (
          <form onSubmit={handleSubmitForgot(onSubmitForgot)} noValidate>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
                Mobile Number / Email
              </Typography>
              <Box sx={{ display: 'flex' }}>
                <FormControl sx={{ width: 96, mr: 1 }}>
                  <Select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    sx={{
                      bgcolor: 'var(--mf-input)',
                      borderRadius: 2.5,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--mf-border)' },
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
                  placeholder="Enter mobile number or email"
                  autoComplete="username"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <SmartphoneRoundedIcon sx={{ color: '#9AA4B2', mr: 1.25, alignSelf: 'center' }} />
                      ),
                    },
                  }}
                  {...registerForgot('mobileNumber', {
                    required: 'Mobile number or email is required',
                  })}
                  error={!!errorsForgot.mobileNumber}
                  helperText={errorsForgot.mobileNumber?.message}
                  sx={inputSx}
                />
              </Box>
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
                mb: 3,
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Send Reset Instructions'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitReset(onSubmitReset)} noValidate>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
                OTP Code
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter 6-digit OTP"
                {...registerReset('otp', { required: 'OTP is required' })}
                error={!!errorsReset.otp}
                helperText={errorsReset.otp?.message}
                sx={inputSx}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
                New Password
              </Typography>
              <TextField
                fullWidth
                type="password"
                placeholder="Enter new password"
                {...registerReset('newPassword', { required: 'Password is required' })}
                error={!!errorsReset.newPassword}
                helperText={errorsReset.newPassword?.message}
                sx={inputSx}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
                Confirm Password
              </Typography>
              <TextField
                fullWidth
                type="password"
                placeholder="Confirm new password"
                {...registerReset('confirmPassword', { required: 'Confirm password is required' })}
                error={!!errorsReset.confirmPassword}
                helperText={errorsReset.confirmPassword?.message}
                sx={inputSx}
              />
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
                mb: 3,
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Reset Password'}
            </Button>
          </form>
        )}

        <Typography textAlign="center" sx={{ color: 'var(--mf-muted)', fontSize: '0.9rem' }}>
          Remembered your password?{' '}
          <Link to="/login" style={{ color: TEAL, textDecoration: 'none', fontWeight: 700 }}>
            Back to Log In
          </Link>
        </Typography>
      </Paper>
    </AuthLayout>
  );
};

export default ForgotPassword;
