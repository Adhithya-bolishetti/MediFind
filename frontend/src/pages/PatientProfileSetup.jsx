import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';

import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import ProfileSetupLayout from '../components/profile/ProfileSetupLayout';
import ProfileInfoPanel from '../components/profile/ProfileInfoPanel';
import ProfilePhotoUpload from '../components/profile/ProfilePhotoUpload';

const steps = ['Basic Details', 'Contact Details'];

const PatientProfileSetup = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
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

  // Pre-populate mobile number if we stored it as email prefix
  useEffect(() => {
    if (user?.email && user.email.includes('@medifind.com')) {
      const mobile = user.email.split('@')[0];
      setValue('mobileNumber', mobile);
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
          dateOfBirth: data.dateOfBirth,
          profileImage: profileImage,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone
        };

        const updatedUser = await userService.updateProfile(user.id, payload);
        // Refresh context
        login(token, updatedUser);
        
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

  const getInfoPanel = () => {
    if (activeStep === 0) {
      return (
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
    }
    return null;
  };

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
            <Typography variant="h6" sx={{ color: '#079A9A', display: 'flex', alignItems: 'center', mb: 1 }}>
              <PeopleOutlineOutlinedIcon sx={{ mr: 1 }} /> Basic Details
            </Typography>
            <Typography variant="body2" sx={{ color: '#5C6780', mb: 4 }}>
              Tell us a little about yourself.
            </Typography>

            <ProfilePhotoUpload onChange={(base64) => setProfileImage(base64)} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Full Name *</Typography>
                <TextField fullWidth placeholder="Enter your full name" {...register("fullName", { required: true })} error={!!errors.fullName} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Date of Birth</Typography>
                <TextField fullWidth type="date" InputLabelProps={{ shrink: true }} {...register("dateOfBirth")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Gender *</Typography>
                <TextField select fullWidth {...register("gender", { required: true })} error={!!errors.gender} defaultValue="">
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Mobile Number *</Typography>
                <TextField fullWidth {...register("mobileNumber", { required: true })} error={!!errors.mobileNumber} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Email *</Typography>
                <TextField fullWidth disabled {...register("email", { required: true })} error={!!errors.email} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 2: Contact Details */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#079A9A', mb: 1 }}>Contact Details</Typography>
            <Typography variant="body2" sx={{ color: '#5C6780', mb: 4 }}>Help us know where you are located and who to contact in emergencies.</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Address</Typography>
                <TextField fullWidth placeholder="Street address" {...register("address")} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>City</Typography>
                <TextField fullWidth {...register("city")} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>State</Typography>
                <TextField fullWidth {...register("state")} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Pincode</Typography>
                <TextField fullWidth {...register("pincode")} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1, mt: 2 }}>Emergency Contact</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact Name" {...register("emergencyContactName")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact Phone" {...register("emergencyContactPhone")} />
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 3, borderTop: '1px solid #D9DEE8' }}>
          {activeStep === 0 ? (
            <Typography variant="caption" sx={{ color: '#d32f2f', mt: 1 }}>* Required fields</Typography>
          ) : (
            <Button onClick={handleBack} sx={{ color: '#5C6780', fontWeight: 600 }}>
              ← Back
            </Button>
          )}
          
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            sx={{ 
              bgcolor: '#079A9A', 
              '&:hover': { bgcolor: '#068A8A' },
              fontWeight: 600,
              px: 4,
              py: 1.2,
              borderRadius: 2,
              textTransform: 'none'
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
