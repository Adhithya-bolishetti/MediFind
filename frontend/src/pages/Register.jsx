import { useState, useContext } from 'react';
import {
  Box, Button, Typography, Paper, TextField, InputAdornment, IconButton,
  Select, MenuItem, FormControl, Alert, CircularProgress,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';

const TEAL = '#079A9A';

// Shared input styling — consistent height, borders, focus states.
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: 'var(--mf-input)',
    '& fieldset': { borderColor: 'var(--mf-border)' },
    '&:hover fieldset': { borderColor: TEAL },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: '1.5px' },
    '&.Mui-error fieldset': { borderColor: '#d32f2f' },
  },
};

// Map a 0..5 score to a strength label/color/fill.
const strengthFor = (score) => {
  if (score >= 5) return { label: 'Strong', color: '#079A9A', fill: 5 };
  if (score === 4) return { label: 'Good', color: '#079A9A', fill: 4 };
  if (score === 3) return { label: 'Fair', color: '#f59e0b', fill: 3 };
  if (score >= 1) return { label: 'Weak', color: '#f59e0b', fill: 2 };
  return { label: 'Too weak', color: '#ef4444', fill: 1 };
};

// 0..5 score based on length + character variety.
const passwordScore = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 10) score += 1;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return score;
};

// User-friendly messages — never surface raw backend exceptions.
const getFriendlyError = (err) => {
  if (err?.code === 'ERR_NETWORK') {
    return 'Cannot connect to the server. Please check your connection and try again.';
  }
  const status = err?.response?.status;
  const message = err?.response?.data?.message || '';
  if (status === 409) {
    return 'An account with this mobile number already exists. Please log in instead.';
  }
  if (status === 400) {
    if (/passwords? do not match/i.test(message)) return 'Passwords do not match.';
    if (/email/i.test(message)) return 'Please enter a valid email address.';
    if (/password/i.test(message)) return 'Password must be at least 6 characters long.';
    return 'Please review your details and try again.';
  }
  if (status === 401) {
    return 'Your account was created, but we could not sign you in. Please try logging in.';
  }
  return 'Unable to create your account. Please try again.';
};

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    defaultValues: { role: 'PATIENT' },
    mode: 'onTouched',
  });

  const watchPassword = watch('password', '');
  const score = passwordScore(watchPassword);
  const meta = strengthFor(score);

  const { login } = useContext(AuthContext);

  const onSubmit = async (data) => {
    if (loading) return; // prevent double submission
    setError('');
    setLoading(true);

    try {
      // Mobile-first registration — never generate a fake email. The mobile
      // number (with country code) becomes the account identifier, and the
      // user can add a real email later during profile creation.
      const mobileNumber = `${countryCode.replace('+', '')}${data.mobileNumber}`;

      const payload = {
        fullName: data.fullName,
        mobileNumber,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: data.role,
      };

      await authService.register(payload);

      // Immediately log the user in so auth state survives navigation
      const loginRes = await authService.login({
        email: mobileNumber,
        password: data.password,
      });

      const user = await login(loginRes.accessToken);

      // Determine where to route them
      if (user.role === 'DOCTOR') {
        navigate('/doctor/profile');
      } else if (user.role === 'PATIENT') {
        navigate('/patient/profile');
      } else if (user.role === 'HOSPITAL') {
        navigate('/hospital/setup');
      } else {
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
          maxWidth: 520,
          boxShadow: '0 12px 48px rgba(16, 27, 54, 0.10)',
          border: '1px solid var(--mf-border)',
        }}
      >
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ color: 'var(--mf-text)', letterSpacing: '-0.5px', textAlign: 'center' }}>
          Create Your Account
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--mf-muted)', mb: 3, textAlign: 'center' }}>
          Join MediFind and find the right care
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ─────────── Role Selection ─────────── */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
              I am a
            </Typography>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {[
                    { value: 'PATIENT', icon: <PersonRoundedIcon fontSize="medium" />, title: "I'm a Patient", desc: 'Find doctors & book appointments' },
                    { value: 'DOCTOR', icon: <MedicalServicesRoundedIcon fontSize="medium" />, title: "I'm a Doctor", desc: 'Manage patients & appointments' },
                    { value: 'HOSPITAL', icon: <LocalHospitalRoundedIcon fontSize="medium" />, title: "I'm a Hospital", desc: 'Manage your hospital & services' },
                  ].map((opt) => {
                    const active = field.value === opt.value;
                    return (
                      <Box
                        key={opt.value}
                        role="button"
                        tabIndex={0}
                        aria-pressed={active}
                        onClick={() => field.onChange(opt.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            field.onChange(opt.value);
                          }
                        }}
                        sx={{
                          border: '1.5px solid',
                          borderColor: active ? TEAL : 'var(--mf-border)',
                          bgcolor: active ? 'rgba(7,154,154,0.08)' : 'var(--mf-input)',
                          borderRadius: 3,
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          '&:hover': { borderColor: TEAL, boxShadow: '0 4px 14px rgba(7,154,154,0.14)' },
                          '&:focus-visible': { outline: '2px solid rgba(7,154,154,0.5)', outlineOffset: 2 },
                        }}
                      >
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '10px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: active ? TEAL : 'var(--mf-hover)',
                            color: active ? '#fff' : 'var(--mf-muted)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {opt.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--mf-text)', lineHeight: 1.2 }}>
                            {opt.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--mf-muted)', lineHeight: 1.3, display: 'block', mt: 0.25 }}>
                            {opt.desc}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            />
          </Box>

          {/* ─────────── Full Name ─────────── */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
              Full Name <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your full name"
              autoComplete="name"
              {...register('fullName', { required: 'Full name is required' })}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineRoundedIcon sx={{ color: '#9AA4B2' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={inputSx}
            />
          </Box>

          {/* ─────────── Mobile Number ─────────── */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
              Mobile Number <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
                placeholder="Enter your mobile number"
                autoComplete="tel-national"
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }}
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

          {/* ─────────── Password ─────────── */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
              Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              autoComplete="new-password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
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
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <VisibilityOff sx={{ color: '#9AA4B2' }} /> : <Visibility sx={{ color: '#9AA4B2' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={inputSx}
            />

            {/* Strength meter */}
            {watchPassword && (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        height: 4,
                        flex: 1,
                        borderRadius: 2,
                        bgcolor: i <= meta.fill ? meta.color : 'var(--mf-border)',
                        transition: 'background-color 0.2s ease',
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: meta.color, mt: 0.5, display: 'block', fontWeight: 600 }}>
                  {meta.label}
                </Typography>
              </Box>
            )}
          </Box>

          {/* ─────────── Confirm Password ─────────── */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'var(--mf-text)', fontWeight: 600, mb: 1 }}>
              Confirm Password <Box component="span" sx={{ color: '#ef4444' }}>*</Box>
            </Typography>
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              autoComplete="new-password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => (watchPassword === val ? undefined : 'Your passwords do not match'),
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#9AA4B2' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword((s) => !s)} edge="end" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                        {showConfirmPassword ? <VisibilityOff sx={{ color: '#9AA4B2' }} /> : <Visibility sx={{ color: '#9AA4B2' }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
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
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1.25 }} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <Typography textAlign="center" sx={{ color: 'var(--mf-muted)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: TEAL, textDecoration: 'none', fontWeight: 700 }}>
            Log In
          </Link>
        </Typography>
      </Paper>
    </AuthLayout>
  );
};

export default Register;
