import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Grid } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';

import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import doctorService from '../services/doctorService';
import ProfileSetupLayout from '../components/profile/ProfileSetupLayout';
import ProfileInfoPanel from '../components/profile/ProfileInfoPanel';
import ProfilePhotoUpload from '../components/profile/ProfilePhotoUpload';

const steps = ['Basic Details', 'Professional Details', 'Additional Details'];

const DoctorProfileSetup = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      gender: '',
      dateOfBirth: '',
      mobileNumber: '',
      preferredLanguage: '',
      specialization: '',
      medicalLicenseNumber: '',
      experience: '',
      qualification: '',
      clinicName: '',
      consultationFee: '',
      about: '',
      languages: [],
      consultationMode: '',
      workingDays: '',
      consultationStartTime: '',
      consultationEndTime: '',
      clinicAddress: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  const [profileImage, setProfileImage] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const profile = await doctorService.getMyProfile();
        if (profile) {
          setIsUpdateMode(true);
          // Pre-populate fields
          setValue('fullName', profile.doctorName || '');
          setValue('email', profile.email || '');
          setValue('mobileNumber', profile.phoneNumber || '');
          setValue('gender', profile.gender || '');
          setValue('dateOfBirth', profile.dateOfBirth || '');
          setValue('specialization', profile.specialization || '');
          setValue('qualification', profile.qualification || '');
          setValue('medicalLicenseNumber', profile.medicalLicenseNumber || '');
          setValue('experience', profile.experience || '');
          setValue('about', profile.about || '');
          setValue('consultationFee', profile.consultationFee || '');
          if (profile.languages) setValue('languages', profile.languages.split(','));
          setValue('clinicName', profile.clinicName || '');
          setValue('clinicAddress', profile.clinicAddress || '');
          setValue('city', profile.city || '');
          setValue('state', profile.state || '');
          setValue('pincode', profile.pincode || '');
          setValue('workingDays', profile.workingDays || '');
          setValue('consultationStartTime', profile.consultationStartTime || '');
          setValue('consultationEndTime', profile.consultationEndTime || '');
          if (profile.availableForOnlineConsultation) {
            setValue('consultationMode', 'Online');
          }
        }
      } catch (e) {
        // If 404, it means profile doesn't exist, which is expected for new doctors
        if (user?.email && user.email.includes('@medifind.com')) {
          const mobile = user.email.split('@')[0];
          setValue('mobileNumber', mobile);
        }
      } finally {
        setInitialFetchDone(true);
      }
    };
    fetchExistingProfile();
  }, [user, setValue]);

  const handleNext = async (data) => {
    if (activeStep === steps.length - 1) {
      // Final Submit
      setError('');
      setLoading(true);
      try {
        const payload = {
          doctorName: data.fullName,
          email: data.email,
          phoneNumber: data.mobileNumber,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth || null,
          profileImage: profileImage,
          specialization: data.specialization,
          qualification: data.qualification,
          medicalLicenseNumber: data.medicalLicenseNumber,
          experience: data.experience ? parseInt(data.experience, 10) : null,
          about: data.about,
          consultationFee: data.consultationFee ? parseFloat(data.consultationFee) : null,
          languages: Array.isArray(data.languages) ? data.languages.join(',') : data.languages,
          clinicName: data.clinicName,
          clinicAddress: data.clinicAddress,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          workingDays: data.workingDays,
          consultationStartTime: data.consultationStartTime || null,
          consultationEndTime: data.consultationEndTime || null,
          availableForOnlineConsultation: data.consultationMode === 'Online' || data.consultationMode === 'Both'
        };

        if (isUpdateMode) {
          await doctorService.updateProfile(payload);
        } else {
          await doctorService.createProfile(payload);
        }
        await doctorService.submitProfile();
        
        await refreshUser();
        showToast('Successfully profile created');
        navigate('/dashboard');
      } catch (err) {
        console.error("Doctor profile creation/update error:", err.response?.data || err);
        const backendMessage = err.response?.data?.message || err.response?.data?.error;
        setError(backendMessage || 'Failed to submit profile. Please try again.');
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
          description="This information helps patients find and connect with the right doctor."
          items={[
            {
              icon: <VerifiedUserOutlinedIcon />,
              title: "Verified Profile",
              description: "Complete your profile to build trust with patients."
            },
            {
              icon: <SearchOutlinedIcon />,
              title: "Better Visibility",
              description: "Accurate details help patients find you easily."
            },
            {
              icon: <PeopleOutlineOutlinedIcon />,
              title: "Patient Communication",
              description: "Your language preference helps patients communicate better."
            }
          ]}
        />
      );
    }
    return null;
  };

  return (
    <ProfileSetupLayout
      title="Doctor Profile Setup"
      subtitle="Complete your profile to help patients learn more about you."
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
              Please provide your basic information.
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
                <TextField fullWidth {...register("mobileNumber", { required: true })} error={!!errors.mobileNumber} disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Email *</Typography>
                <TextField fullWidth {...register("email", { required: true })} error={!!errors.email} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Preferred Language *</Typography>
                <TextField select fullWidth {...register("preferredLanguage", { required: true })} error={!!errors.preferredLanguage} defaultValue="">
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                  <MenuItem value="Tamil">Tamil</MenuItem>
                  <MenuItem value="Telugu">Telugu</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 2: Professional Details */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#079A9A', mb: 1 }}>Professional Details</Typography>
            <Typography variant="body2" sx={{ color: '#5C6780', mb: 4 }}>Tell patients about your medical expertise and experience.</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Specialization *</Typography>
                <TextField select fullWidth {...register("specialization", { required: true })} error={!!errors.specialization} defaultValue="GENERAL_PHYSICIAN">
                  <MenuItem value="GENERAL_PHYSICIAN">General Physician</MenuItem>
                  <MenuItem value="CARDIOLOGIST">Cardiologist</MenuItem>
                  <MenuItem value="DERMATOLOGIST">Dermatologist</MenuItem>
                  <MenuItem value="NEUROLOGIST">Neurologist</MenuItem>
                  <MenuItem value="ORTHOPEDIC">Orthopedic</MenuItem>
                  <MenuItem value="PEDIATRICIAN">Pediatrician</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Medical Registration Number *</Typography>
                <TextField fullWidth placeholder="Enter registration number" {...register("medicalLicenseNumber", { required: true })} error={!!errors.medicalLicenseNumber} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Years of Experience *</Typography>
                <TextField fullWidth type="number" placeholder="Enter years of experience" {...register("experience", { required: true })} error={!!errors.experience} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Qualification *</Typography>
                <TextField fullWidth placeholder="e.g. MBBS, MD" {...register("qualification", { required: true })} error={!!errors.qualification} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Hospital / Clinic</Typography>
                <TextField fullWidth placeholder="Enter hospital or clinic name" {...register("clinicName")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Consultation Fee *</Typography>
                <TextField fullWidth type="number" placeholder="₹ Enter consultation fee" {...register("consultationFee", { required: true })} error={!!errors.consultationFee} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>About You</Typography>
                <TextField fullWidth multiline rows={4} placeholder="Tell patients about your experience, expertise and approach to patient care..." {...register("about")} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 3: Additional Details */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" sx={{ color: '#079A9A', mb: 1 }}>Additional Details</Typography>
            <Typography variant="body2" sx={{ color: '#5C6780', mb: 4 }}>Add information that helps patients make the right choice.</Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Languages Spoken</Typography>
                <Controller
                  name="languages"
                  control={control}
                  render={({ field }) => (
                    <TextField select SelectProps={{ multiple: true }} fullWidth {...field}>
                      <MenuItem value="English">English</MenuItem>
                      <MenuItem value="Hindi">Hindi</MenuItem>
                      <MenuItem value="Telugu">Telugu</MenuItem>
                      <MenuItem value="Tamil">Tamil</MenuItem>
                      <MenuItem value="Kannada">Kannada</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Consultation Mode</Typography>
                <TextField select fullWidth {...register("consultationMode")} defaultValue="In-person">
                  <MenuItem value="In-person">In-person</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                  <MenuItem value="Both">Both</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Working Days</Typography>
                <TextField fullWidth placeholder="e.g. Mon-Fri" {...register("workingDays")} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Start Time</Typography>
                <TextField fullWidth type="time" InputLabelProps={{ shrink: true }} {...register("consultationStartTime")} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>End Time</Typography>
                <TextField fullWidth type="time" InputLabelProps={{ shrink: true }} {...register("consultationEndTime")} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#101B36', fontWeight: 600, mb: 1 }}>Address</Typography>
                <TextField fullWidth placeholder="Street address" {...register("clinicAddress")} />
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

export default DoctorProfileSetup;
