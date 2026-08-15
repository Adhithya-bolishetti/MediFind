import { useState } from 'react';
import {
  Box, Button, Typography, Paper, TextField, Select, MenuItem,
  FormControl, Alert, CircularProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import authService from '../services/authService';
import AuthLayout from '../components/auth/AuthLayout';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';

const TEAL = '#079A9A';
const DARK = '#101B36';
const MUTED = '#5C6780';
const BORDER = '#D9DEE8';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: '#fff',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: TEAL },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: '1.5px' },
  },
};

const ForgotPassword = () => {
  const [countryCode, setCountryCode] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ mode: 'onTouched' });

  const onSubmit = async (data) => {
    if (loading) return;
    setError('');
    setSent(false);
    setLoading(true);

    try {
      const fakeEmail = `${countryCode.replace('+', '')}${data.mobileNumber}@medifind.com`;
      await authService.forgotPassword({ email: fakeEmail });
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
          Reset Password
        </Typography>
        <Typography variant="body1" color={MUTED} mb={3} sx={{ textAlign: 'center' }}>
          Enter your registered mobile number and we&apos;ll send you instructions to reset your password.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}>
            {error}
          </Alert>
        )}
        {sent && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}>
            If an account exists for this number, password reset instructions have been sent.
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                slotProps={{
                  htmlInput: { inputMode: 'numeric', maxLength: 10 },
                  input: {
                    startAdornment: (
                      <SmartphoneRoundedIcon sx={{ color: '#9AA4B2', mr: 1.25, alignSelf: 'center' }} />
                    ),
                  },
                }}
                {...register('mobileNumber', {
                  required: 'Mobile Number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Must be a 10-digit number' },
                })}
                error={!!errors.mobileNumber}
                helperText={errors.mobileNumber?.message}
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
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1.25 }} />
                Sending...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </Button>
        </form>

        <Typography textAlign="center" sx={{ color: MUTED, fontSize: '0.9rem' }}>
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
