import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Grid } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';

import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import userService from '../services/userService';
import ProfileSetupLayout from '../components/profile/ProfileSetupLayout';
import ProfileInfoPanel from '../components/profile/ProfileInfoPanel';
import ProfilePhotoUpload from '../components/profile/ProfilePhotoUpload';

const TEAL = '#079A9A';

const steps = [
  { label: 'Basic Details', subtitle: 'Personal information' },
  { label: 'Contact Details', subtitle: 'Location and emergency contact' },
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

const PatientProfileSetup = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      gender: '',
      dateOfBirth: '',
      mobileNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    }
  });

  const [profileImage, setProfileImage] = useState(null);

  // Pre-populate mobile from the account identifier (mobile-first registration)
  // or the legacy <mobile>@medifind.com email convention.
  useEffect(() => {
    if (user) {
      const mobile = user.mobileNumber
        || (user.email && user.email.includes('@medifind.com') ? user.email.split('@')[0] : '');
      if (mobile) setValue('mobileNumber', mobile);
    }
  }, [user, setValue]);

  const handleNext = async (data) => {
    if (activeStep === steps.length - 1) {
      // Final Submit
      setError('');
      setLoading(true);
      try {
        const payload = {
          fullName: data.fullName,
          phone: data.mobileNumber,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth || null,
          profileImage: profileImage,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone
        };

        await userService.updateProfile(user.id, payload);

        await refreshUser();
        showToast('Profile created successfully');
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to submit profile. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const getInfoPanel = () => (
    <ProfileInfoPanel
      title="Why this information?"
      description="Your basic information helps MediFind personalize your healthcare experience."
      items={[
        {
          icon: <FavoriteBorderOutlinedIcon />,
          title: "Personalized Care",
          description: "Get healthcare recommendations relevant to you."
        },
        {
          icon: <EventAvailableOutlinedIcon />,
          title: "Easier Appointments",
          description: "Help doctors understand basic information before your visit."
        },
        {
          icon: <PeopleOutlineOutlinedIcon />,
          title: "Better Communication",
          description: "Easily connect with healthcare providers."
        }
      ]}
    />
  );

  return (
    <ProfileSetupLayout
      title="Patient Profile Setup"
      subtitle="Complete your profile to help us personalize your healthcare experience."
      steps={steps}
      activeStep={activeStep}
      infoPanel={getInfoPanel()}
    >
      <Box component="form" onSubmit={handleSubmit(handleNext)}>
        {error && (
          <Typography color="error" sx={{ mb: 3 }}>{error}</Typography>
        )}

        {/* STEP 1: Basic Details */}
        {activeStep === 0 && (
          <Box>
            <SectionHeader
              title="Basic Details"
              subtitle="Tell us a little about yourself."
            />

            <ProfilePhotoUpload onChange={(base64) => setProfileImage(base64)} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Full Name *</Typography>
                <TextField fullWidth placeholder="Enter your full name" {...register("fullName", { required: true })} error={!!errors.fullName} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Date of Birth</Typography>
                <TextField fullWidth type="date" InputLabelProps={{ shrink: true }} {...register("dateOfBirth")} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Gender *</Typography>
                <Controller
                  name="gender"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <TextField select fullWidth value={field.value ?? ''} onChange={field.onChange} error={!!fieldState.error} sx={inputSx}>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Mobile Number *</Typography>
                <TextField fullWidth {...register("mobileNumber", { required: true })} error={!!errors.mobileNumber} sx={inputSx} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={fieldLabel}>
                  Email <Box component="span" sx={{ color: 'var(--mf-muted)', fontWeight: 400 }}>(Optional)</Box>
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your email address"
                  type="email"
                  {...register("email")}
                  sx={inputSx}
                />
                <Typography variant="caption" sx={{ color: 'var(--mf-muted)', display: 'block', mt: 0.6 }}>
                  Not required — you can add your email later from your profile.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 2: Contact Details */}
        {activeStep === 1 && (
          <Box>
            <SectionHeader
              title="Contact Details"
              subtitle="Help us know where you are located and who to contact in emergencies."
            />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography sx={fieldLabel}>Address</Typography>
                <TextField fullWidth placeholder="Street address" {...register("address")} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>City</Typography>
                <TextField fullWidth {...register("city")} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>State</Typography>
                <TextField fullWidth {...register("state")} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>Pincode</Typography>
                <TextField fullWidth {...register("pincode")} sx={inputSx} />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ ...fieldLabel, mt: 2 }}>Emergency Contact</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Contact Name</Typography>
                <TextField fullWidth {...register("emergencyContactName")} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Contact Phone</Typography>
                <TextField fullWidth {...register("emergencyContactPhone")} sx={inputSx} />
              </Grid>
            </Grid>
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
            {loading ? 'Processing...' : (activeStep === steps.length - 1 ? 'Complete Profile ✓' : 'Next →')}
          </Button>
        </Box>
      </Box>
    </ProfileSetupLayout>
  );
};

export default PatientProfileSetup;
