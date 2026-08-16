import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, MenuItem, Button, CircularProgress, Alert, Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '../context/ToastContext';
import hospitalService from '../services/hospitalService';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: 'var(--mf-input, #fff)',
    '& fieldset': { borderColor: 'var(--mf-border)' },
    '&:hover fieldset': { borderColor: TEAL },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: '1.5px' },
  },
};

const fieldLabel = { color: 'var(--mf-text)', fontWeight: 600, mb: 0.75, fontSize: '0.875rem' };

const HospitalProfile = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const load = async () => {
      try {
        const p = await hospitalService.getMyProfile();
        setProfile(p);
        reset({
          hospitalName: p.hospitalName || '',
          hospitalType: p.hospitalType || 'Multi-Speciality',
          description: p.description || '',
          website: p.website || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || '',
          phoneNumber: p.phoneNumber || '',
          email: p.email || '',
          facilities: p.facilities || '',
          specialties: p.specialties || '',
          operatingHours: p.operatingHours || '',
          emergencyAvailable: !!p.emergencyAvailable,
          ambulanceAvailable: !!p.ambulanceAvailable,
          ambulancePhone: p.ambulancePhone || '',
        });
      } catch (err) {
        setError('Unable to load your hospital profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      await hospitalService.updateProfile({
        hospitalName: data.hospitalName,
        hospitalType: data.hospitalType,
        description: data.description,
        website: data.website || null,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode || null,
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        facilities: data.facilities,
        specialties: data.specialties,
        operatingHours: data.operatingHours || null,
        emergencyAvailable: !!data.emergencyAvailable,
        ambulanceAvailable: !!data.ambulanceAvailable,
        ambulancePhone: data.ambulanceAvailable ? data.ambulancePhone : null,
      });
      const fresh = await hospitalService.getMyProfile();
      setProfile(fresh);
      showToast('Hospital profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      <Typography variant="h5" fontWeight={800} color={NAVY} mb={0.5}>Hospital Profile</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Keep your hospital information accurate so patients can find and reach you.
      </Typography>

      {profile?.status === 'PENDING' && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Your profile is pending admin approval. It will be listed publicly once approved.
        </Alert>
      )}
      {profile?.status === 'SUSPENDED' && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Your hospital account has been suspended by the administrator. Please contact MediFind support.
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box
            sx={{
              width: 72, height: 72, borderRadius: 3, overflow: 'hidden', flexShrink: 0,
              bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {profile?.imageUrl ? (
              <Box component="img" src={profile.imageUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <LocalHospitalIcon sx={{ fontSize: 34, color: 'var(--mf-muted)' }} />
            )}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color={NAVY}>{profile?.hospitalName}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip label={profile?.status || '—'} size="small" sx={{ bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)', color: NAVY, fontWeight: 700, fontSize: '0.7rem' }} />
              <Typography variant="caption" color="text.secondary">
                {(profile?.images || []).length}/10 images
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="subtitle2" fontWeight={800} color={NAVY} mb={2}>Basic Details</Typography>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={8}>
              <Typography sx={fieldLabel}>Hospital Name *</Typography>
              <TextField fullWidth {...register('hospitalName', { required: 'Hospital name is required' })} error={!!errors.hospitalName} helperText={errors.hospitalName?.message} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography sx={fieldLabel}>Hospital Type</Typography>
              <Controller
                name="hospitalType"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth value={field.value ?? ''} onChange={field.onChange} sx={inputSx}>
                    <MenuItem value="Multi-Speciality">Multi-Speciality</MenuItem>
                    <MenuItem value="Super-Speciality">Super-Speciality</MenuItem>
                    <MenuItem value="General Hospital">General Hospital</MenuItem>
                    <MenuItem value="Nursing Home">Nursing Home</MenuItem>
                    <MenuItem value="Clinic">Clinic</MenuItem>
                    <MenuItem value="Government Hospital">Government Hospital</MenuItem>
                    <MenuItem value="Maternity & Child Care">Maternity &amp; Child Care</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={fieldLabel}>Description</Typography>
              <TextField fullWidth multiline rows={4} {...register('description')} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={fieldLabel}>Website <Box component="span" sx={{ color: 'var(--mf-muted)', fontWeight: 400 }}>(Optional)</Box></Typography>
              <TextField fullWidth type="url" {...register('website')} sx={inputSx} />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={800} color={NAVY} mb={2}>Location & Contact</Typography>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12}>
              <Typography sx={fieldLabel}>Address *</Typography>
              <TextField fullWidth {...register('address', { required: 'Address is required' })} error={!!errors.address} helperText={errors.address?.message} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography sx={fieldLabel}>City *</Typography>
              <TextField fullWidth {...register('city', { required: 'City is required' })} error={!!errors.city} helperText={errors.city?.message} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography sx={fieldLabel}>State *</Typography>
              <TextField fullWidth {...register('state', { required: 'State is required' })} error={!!errors.state} helperText={errors.state?.message} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography sx={fieldLabel}>Pincode</Typography>
              <TextField fullWidth {...register('pincode')} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={fieldLabel}>Phone Number *</Typography>
              <TextField fullWidth {...register('phoneNumber', { required: 'Phone number is required' })} error={!!errors.phoneNumber} helperText={errors.phoneNumber?.message} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={fieldLabel}>Email <Box component="span" sx={{ color: 'var(--mf-muted)', fontWeight: 400 }}>(Optional)</Box></Typography>
              <TextField fullWidth type="email" {...register('email')} sx={inputSx} />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={800} color={NAVY} mb={2}>Facilities & Emergency</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography sx={fieldLabel}>Facilities</Typography>
              <TextField fullWidth placeholder="e.g. ICU, Pharmacy, Radiology, Ambulance" {...register('facilities')} sx={inputSx} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={fieldLabel}>Specialties</Typography>
              <TextField fullWidth placeholder="e.g. Cardiology, Orthopedics" {...register('specialties')} sx={inputSx} />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={fieldLabel}>Operating Hours</Typography>
              <TextField fullWidth {...register('operatingHours')} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={fieldLabel}>24×7 Emergency Available</Typography>
              <Controller
                name="emergencyAvailable"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth value={field.value ? 'Yes' : 'No'} onChange={(e) => field.onChange(e.target.value === 'Yes')} sx={inputSx}>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={fieldLabel}>Ambulance Service</Typography>
              <Controller
                name="ambulanceAvailable"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth value={field.value ? 'Yes' : 'No'} onChange={(e) => field.onChange(e.target.value === 'Yes')} sx={inputSx}>
                    <MenuItem value="Yes">Yes</MenuItem>
                    <MenuItem value="No">No</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={fieldLabel}>Ambulance Contact Number</Typography>
              <TextField fullWidth placeholder="e.g. 108" {...register('ambulancePhone')} sx={inputSx} />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' }, fontWeight: 700, px: 4, py: 1.2, borderRadius: 2.5, textTransform: 'none', boxShadow: '0 6px 16px rgba(7,154,154,0.3)' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default HospitalProfile;
