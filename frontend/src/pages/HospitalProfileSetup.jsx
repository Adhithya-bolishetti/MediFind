import React, { useState, useContext } from 'react';
import {
  Box, Button, TextField, MenuItem, Typography, Grid, IconButton, Chip, Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import hospitalService from '../services/hospitalService';
import ProfileSetupLayout from '../components/profile/ProfileSetupLayout';
import ProfileInfoPanel from '../components/profile/ProfileInfoPanel';

const TEAL = '#079A9A';
const MAX_IMAGES = 10;

const steps = [
  { label: 'Basic Details', subtitle: 'Hospital information' },
  { label: 'Location & Contact', subtitle: 'Where patients can find you' },
  { label: 'Facilities & Services', subtitle: 'What you offer' },
  { label: 'Hospital Images', subtitle: 'Optional — up to 10 photos' },
];

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: 'var(--mf-input, #fff)',
    '& fieldset': { borderColor: 'var(--mf-border)' },
    '&:hover fieldset': { borderColor: TEAL },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: '1.5px' },
    '&.Mui-error fieldset': { borderColor: '#d32f2f' },
  },
};

const fieldLabel = {
  color: 'var(--mf-text)',
  fontWeight: 600,
  mb: 0.75,
  fontSize: '0.875rem',
};

const SectionHeader = ({ title, subtitle }) => (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--mf-text)', letterSpacing: '-0.3px' }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: 'var(--mf-muted)', mt: 0.4 }}>
      {subtitle}
    </Typography>
  </Box>
);

const HospitalProfileSetup = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const { user, refreshUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      hospitalName: '',
      hospitalType: 'Multi-Speciality',
      description: '',
      website: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phoneNumber: user?.mobileNumber || '',
      email: user?.email || '',
      facilities: '',
      specialties: '',
      operatingHours: '',
      emergencyAvailable: false,
      ambulanceAvailable: false,
      ambulancePhone: '',
    },
  });

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setError('');
    const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
    let room = MAX_IMAGES - images.length;
    for (const file of files) {
      if (room <= 0) {
        setError(`Maximum ${MAX_IMAGES} images allowed.`);
        break;
      }
      if (!okTypes.includes(file.type)) {
        setError('Only JPG, PNG and WEBP images are supported.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be smaller than 5MB.');
        continue;
      }
      room -= 1;
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, reader.result]));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSubmitProfile = async (data) => {
    setError('');
    setLoading(true);
    try {
      const payload = {
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
      };

      const created = await hospitalService.createProfile(payload);

      // Optional images — upload after the profile exists.
      if (images.length > 0 && created?.id) {
        for (const img of images) {
          try {
            await hospitalService.addImage(created.id, img);
          } catch (imgErr) {
            console.error('Image upload failed', imgErr);
          }
        }
      }

      await refreshUser();
      showToast('Profile created successfully');
      navigate('/hospital/dashboard');
    } catch (err) {
      console.error('Hospital profile creation error:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to create your hospital profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async (data) => {
    if (activeStep === steps.length - 1) {
      await handleSubmitProfile(data);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const getInfoPanel = () => (
    <ProfileInfoPanel
      title="Why this information?"
      description="Complete hospital details help patients find, trust and reach you quickly."
      items={[
        { icon: <LocalHospitalOutlinedIcon />, title: 'Verified Profile', description: 'Accurate details build trust with patients.' },
        { icon: <LocationCityOutlinedIcon />, title: 'Better Visibility', description: 'Complete location data helps patients find you.' },
        { icon: <MedicalServicesOutlinedIcon />, title: 'Emergency Readiness', description: 'Show your emergency & ambulance availability.' },
      ]}
    />
  );

  return (
    <ProfileSetupLayout
      title="Hospital Profile Setup"
      subtitle="Complete your hospital profile to get listed on MediFind."
      steps={steps}
      activeStep={activeStep}
      infoPanel={getInfoPanel()}
    >
      <Box component="form" onSubmit={handleSubmit(handleNext)}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* STEP 1: Basic Details */}
        {activeStep === 0 && (
          <Box>
            <SectionHeader title="Basic Details" subtitle="Tell patients about your hospital." />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={8}>
                <Typography sx={fieldLabel}>Hospital Name *</Typography>
                <TextField fullWidth placeholder="e.g. Apollo Multi-Speciality Hospital" {...register('hospitalName', { required: 'Hospital name is required' })} error={!!errors.hospitalName} helperText={errors.hospitalName?.message} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>Hospital Type *</Typography>
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
                <TextField fullWidth multiline rows={4} placeholder="Describe your hospital, departments and patient care approach..." {...register('description')} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Website <Box component="span" sx={{ color: 'var(--mf-muted)', fontWeight: 400 }}>(Optional)</Box></Typography>
                <TextField fullWidth placeholder="https://www.yourhospital.com" type="url" {...register('website')} sx={inputSx} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 2: Location & Contact */}
        {activeStep === 1 && (
          <Box>
            <SectionHeader title="Location & Contact" subtitle="Where patients can reach you." />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography sx={fieldLabel}>Address *</Typography>
                <TextField fullWidth placeholder="Street address, area" {...register('address', { required: 'Address is required' })} error={!!errors.address} helperText={errors.address?.message} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>City *</Typography>
                <TextField fullWidth placeholder="e.g. Hyderabad" {...register('city', { required: 'City is required' })} error={!!errors.city} helperText={errors.city?.message} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>State *</Typography>
                <TextField fullWidth placeholder="e.g. Telangana" {...register('state', { required: 'State is required' })} error={!!errors.state} helperText={errors.state?.message} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>Pincode</Typography>
                <TextField fullWidth placeholder="e.g. 500033" {...register('pincode')} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Phone Number *</Typography>
                <TextField fullWidth placeholder="Contact number" {...register('phoneNumber', { required: 'Phone number is required' })} error={!!errors.phoneNumber} helperText={errors.phoneNumber?.message} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Email <Box component="span" sx={{ color: 'var(--mf-muted)', fontWeight: 400 }}>(Optional)</Box></Typography>
                <TextField fullWidth placeholder="contact@yourhospital.com" type="email" {...register('email')} sx={inputSx} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 3: Facilities & Services */}
        {activeStep === 2 && (
          <Box>
            <SectionHeader title="Facilities & Services" subtitle="What your hospital offers patients." />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography sx={fieldLabel}>Facilities</Typography>
                <TextField fullWidth placeholder="e.g. ICU, Pharmacy, Radiology, Ambulance, Blood Bank, Cafeteria" {...register('facilities')} sx={inputSx} />
                <Typography variant="caption" sx={{ color: 'var(--mf-muted)', display: 'block', mt: 0.6 }}>
                  Comma-separated list.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography sx={fieldLabel}>Specialties</Typography>
                <TextField fullWidth placeholder="e.g. Cardiology, Orthopedics, Neurology, Pediatrics" {...register('specialties')} sx={inputSx} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={fieldLabel}>Operating Hours</Typography>
                <TextField fullWidth placeholder="e.g. Mon–Sat: 9 AM – 9 PM, Sun: Emergency only" {...register('operatingHours')} sx={inputSx} />
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
              <Grid item xs={12}>
                <Typography sx={fieldLabel}>Ambulance Contact Number</Typography>
                <TextField fullWidth placeholder="e.g. 108 or a 10-digit hotline" {...register('ambulancePhone')} sx={inputSx} />
                <Typography variant="caption" sx={{ color: 'var(--mf-muted)', display: 'block', mt: 0.6 }}>
                  Shown on the 'Call Ambulance' button for patients.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 4: Optional Images */}
        {activeStep === 3 && (
          <Box>
            <SectionHeader title="Hospital Images (Optional)" subtitle="Upload up to 10 images of your hospital, facilities, departments, rooms, or other areas." />
            <Box
              component="label"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 5,
                border: '2px dashed var(--mf-border)',
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: 'var(--mf-input, var(--mf-surface))',
                transition: 'all 0.2s',
                '&:hover': { borderColor: TEAL, bgcolor: 'rgba(7,154,154,0.06)' },
              }}
            >
              <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={handleImageFiles} />
              <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 44, color: TEAL, mb: 1.5 }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'var(--mf-text)' }}>
                Upload Hospital Images
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--mf-muted)', mt: 0.6 }}>
                JPG, PNG, WEBP (Max 5MB each) — you can skip this step
              </Typography>
            </Box>

            {images.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(4,1fr)' }, gap: 1.5, mt: 2 }}>
                {images.map((img, i) => (
                  <Box key={i} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--mf-border)' }}>
                    <Box component="img" src={img} alt={`Hospital image ${i + 1}`} sx={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                    <IconButton
                      size="small"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                    {i === 0 && <Chip label="Cover" size="small" sx={{ position: 'absolute', bottom: 4, left: 4, height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: TEAL, color: '#fff' }} />}
                  </Box>
                ))}
              </Box>
            )}
            <Typography variant="caption" sx={{ color: 'var(--mf-muted)', display: 'block', mt: 1.2 }}>
              {images.length}/10 images selected. Images can also be managed later from your dashboard.
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 3, borderTop: '1px solid var(--mf-border)' }}>
          {activeStep === 0 ? (
            <Typography variant="caption" sx={{ color: '#d32f2f', mt: 1 }}>* Required fields</Typography>
          ) : (
            <Button onClick={handleBack} sx={{ color: 'var(--mf-muted)', fontWeight: 600, textTransform: 'none' }}>
              ← Back
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: TEAL,
              '&:hover': { bgcolor: '#068A8A' },
              fontWeight: 700,
              px: 4,
              py: 1.2,
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 6px 16px rgba(7,154,154,0.3)',
            }}
          >
            {loading ? 'Creating Profile...' : (activeStep === steps.length - 1 ? 'Complete Profile ✓' : 'Next →')}
          </Button>
        </Box>
      </Box>
    </ProfileSetupLayout>
  );
};

export default HospitalProfileSetup;
