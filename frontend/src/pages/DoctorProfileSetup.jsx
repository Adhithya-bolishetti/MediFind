import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Grid, IconButton } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';

import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import doctorService from '../services/doctorService';
import ProfileSetupLayout from '../components/profile/ProfileSetupLayout';
import ProfileInfoPanel from '../components/profile/ProfileInfoPanel';
import ProfilePhotoUpload from '../components/profile/ProfilePhotoUpload';

const TEAL = '#079A9A';

// 6-step wizard matching the reference design.
const steps = [
  { label: 'Basic Details', subtitle: 'Personal information' },
  { label: 'Professional Details', subtitle: 'Your professional information' },
  { label: 'Experience', subtitle: 'Your work experience' },
  { label: 'License & Verification', subtitle: 'License and documents' },
  { label: 'Practice Information', subtitle: 'Practice locations and timing' },
  { label: 'Consultation & Availability', subtitle: 'Consultation and availability' },
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
      specialization: 'GENERAL_PHYSICIAN',
      medicalLicenseNumber: '',
      experience: '',
      qualification: '',
      clinicName: '',
      consultationFee: '',
      about: '',
      languages: [],
      consultationMode: 'In-person',
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
  const [licenseCert, setLicenseCert] = useState(null); // base64
  const [licenseCertName, setLicenseCertName] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Derive the mobile number from the account (mobile-first registration) or
  // from the legacy <mobile>@medifind.com email convention.
  useEffect(() => {
    if (user) {
      const mobile = user.mobileNumber
        || (user.email && user.email.includes('@medifind.com') ? user.email.split('@')[0] : '');
      if (mobile) setValue('mobileNumber', mobile);
    }
  }, [user, setValue]);

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
          setValue('specialization', profile.specialization || 'GENERAL_PHYSICIAN');
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
          if (profile.licenseCertificate) {
            setLicenseCert(profile.licenseCertificate);
            setLicenseCertName('license-certificate.pdf');
          }
        }
      } catch (e) {
        // 404 means profile doesn't exist — expected for new doctors.
      } finally {
        setInitialFetchDone(true);
      }
    };
    fetchExistingProfile();
  }, [user, setValue]);

  const handleLicenseFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const okType = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
    if (!okType) {
      setError('License certificate must be a PDF, JPG or PNG file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('License certificate must be smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLicenseCert(reader.result);
      setLicenseCertName(file.name);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleNext = async (data) => {
    if (activeStep === steps.length - 1) {
      // Final Submit
      setError('');
      setLoading(true);
      try {
        const payload = {
          doctorName: data.fullName,
          email: data.email || null,
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
          availableForOnlineConsultation: data.consultationMode === 'Online' || data.consultationMode === 'Both',
          licenseCertificate: licenseCert
        };

        if (isUpdateMode) {
          await doctorService.updateProfile(payload);
        } else {
          await doctorService.createProfile(payload);
        }
        await doctorService.submitProfile();

        await refreshUser();
        showToast('Profile created successfully');
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
    const items = [
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
        description: "Languages and contact details help patients reach you."
      }
    ];
    return (
      <ProfileInfoPanel
        title="Why this information?"
        description="This information helps patients find and connect with the right doctor."
        items={items}
      />
    );
  };

  return (
    <ProfileSetupLayout
      title="Doctor Profile Setup"
      subtitle="Complete your profile to help patients find and trust you."
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
              subtitle="Please provide your basic personal information."
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
                <TextField select fullWidth {...register("gender", { required: true })} error={!!errors.gender} defaultValue="" sx={inputSx}>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
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

        {/* STEP 2: Professional Details */}
        {activeStep === 1 && (
          <Box>
            <SectionHeader
              title="Professional Details"
              subtitle="Tell patients about your medical expertise."
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Specialization *</Typography>
                <TextField select fullWidth {...register("specialization", { required: true })} error={!!errors.specialization} sx={inputSx}>
                  <MenuItem value="GENERAL_PHYSICIAN">General Physician</MenuItem>
                  <MenuItem value="CARDIOLOGIST">Cardiologist</MenuItem>
                  <MenuItem value="DERMATOLOGIST">Dermatologist</MenuItem>
                  <MenuItem value="NEUROLOGIST">Neurologist</MenuItem>
                  <MenuItem value="ORTHOPEDIC">Orthopedic</MenuItem>
                  <MenuItem value="PEDIATRICIAN">Pediatrician</MenuItem>
                  <MenuItem value="GYNECOLOGIST">Gynecologist</MenuItem>
                  <MenuItem value="PSYCHIATRIST">Psychiatrist</MenuItem>
                  <MenuItem value="DENTIST">Dentist</MenuItem>
                  <MenuItem value="ENT_SPECIALIST">ENT Specialist</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Qualification *</Typography>
                <TextField fullWidth placeholder="e.g. MBBS, MD" {...register("qualification", { required: true })} error={!!errors.qualification} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Consultation Fee *</Typography>
                <TextField fullWidth type="number" placeholder="₹ Enter consultation fee" {...register("consultationFee", { required: true })} error={!!errors.consultationFee} sx={inputSx} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 3: Experience */}
        {activeStep === 2 && (
          <Box>
            <SectionHeader
              title="Experience"
              subtitle="Tell patients about your work experience."
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Years of Experience *</Typography>
                <TextField fullWidth type="number" placeholder="Enter years of experience" {...register("experience", { required: true })} error={!!errors.experience} sx={inputSx} />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={fieldLabel}>About You</Typography>
                <TextField fullWidth multiline rows={5} placeholder="Tell patients about your experience, expertise and approach to patient care..." {...register("about")} sx={inputSx} />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 4: License & Verification */}
        {activeStep === 3 && (
          <Box>
            <SectionHeader
              title="License & Verification"
              subtitle="License and documents."
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Medical Registration Number *</Typography>
                <TextField fullWidth placeholder="Enter registration number" {...register("medicalLicenseNumber", { required: true })} error={!!errors.medicalLicenseNumber} sx={inputSx} />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={fieldLabel}>
                  Medical License / Registration Certificate{' '}
                  <Box component="span" sx={{ color: 'var(--mf-muted)', fontWeight: 400 }}>(Optional)</Box>
                </Typography>

                {!licenseCert ? (
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
                    <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleLicenseFile} />
                    <UploadFileRoundedIcon sx={{ fontSize: 44, color: TEAL, mb: 1.5 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'var(--mf-text)' }}>
                      Upload License Certificate
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--mf-muted)', mt: 0.6 }}>
                      PDF, JPG, PNG (Max. 5MB)
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px solid var(--mf-border)',
                      bgcolor: 'var(--mf-surface)',
                    }}
                  >
                    <InsertDriveFileRoundedIcon sx={{ fontSize: 36, color: TEAL }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--mf-text)', noWrap: 'ellipsis', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {licenseCertName || 'license-certificate.pdf'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--mf-muted)' }}>
                        Uploaded — you can replace or remove it.
                      </Typography>
                    </Box>
                    <Box component="label" sx={{ cursor: 'pointer' }}>
                      <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleLicenseFile} />
                      <Button component="span" size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Replace
                      </Button>
                    </Box>
                    <IconButton
                      aria-label="Remove certificate"
                      onClick={() => { setLicenseCert(null); setLicenseCertName(''); }}
                      sx={{ color: '#EF4444' }}
                    >
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </Box>
                )}

                <Typography variant="caption" sx={{ color: 'var(--mf-muted)', display: 'block', mt: 1.2 }}>
                  Upload your medical license or registration certificate. This can be added later from your profile.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 5: Practice Information */}
        {activeStep === 4 && (
          <Box>
            <SectionHeader
              title="Practice Information"
              subtitle="Practice locations and timing."
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Hospital / Clinic Name</Typography>
                <TextField fullWidth placeholder="Enter hospital or clinic name" {...register("clinicName")} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Address</Typography>
                <TextField fullWidth placeholder="Street address" {...register("clinicAddress")} sx={inputSx} />
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
            </Grid>
          </Box>
        )}

        {/* STEP 6: Consultation & Availability */}
        {activeStep === 5 && (
          <Box>
            <SectionHeader
              title="Consultation & Availability"
              subtitle="Consultation and availability."
            />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Consultation Mode</Typography>
                <TextField select fullWidth {...register("consultationMode")} sx={inputSx}>
                  <MenuItem value="In-person">In-person</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                  <MenuItem value="Both">Both</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={fieldLabel}>Languages Spoken</Typography>
                <Controller
                  name="languages"
                  control={control}
                  render={({ field }) => (
                    <TextField select SelectProps={{ multiple: true }} fullWidth {...field} sx={inputSx}>
                      <MenuItem value="English">English</MenuItem>
                      <MenuItem value="Hindi">Hindi</MenuItem>
                      <MenuItem value="Telugu">Telugu</MenuItem>
                      <MenuItem value="Tamil">Tamil</MenuItem>
                      <MenuItem value="Kannada">Kannada</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>Working Days</Typography>
                <TextField fullWidth placeholder="e.g. Mon-Fri" {...register("workingDays")} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>Start Time</Typography>
                <TextField fullWidth type="time" InputLabelProps={{ shrink: true }} {...register("consultationStartTime")} sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography sx={fieldLabel}>End Time</Typography>
                <TextField fullWidth type="time" InputLabelProps={{ shrink: true }} {...register("consultationEndTime")} sx={inputSx} />
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

export default DoctorProfileSetup;
