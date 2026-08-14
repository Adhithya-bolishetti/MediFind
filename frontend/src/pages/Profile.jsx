import { useState, useEffect, useContext } from 'react';
import { Box, Typography, Container, Paper, Grid, TextField, Button, Avatar, Divider, Alert, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import userService from '../services/userService';
import doctorService from '../services/doctorService';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let data;
        if (user.role === 'DOCTOR') {
          // Attempt to get doctor profile
          try {
            data = await doctorService.getMyProfile();
          } catch (e) {
            // If not found, might be a new doctor who hasn't onboarded, default to empty
            data = { doctorName: '', email: user.email, specialization: '' };
          }
          // Mapping fields for the form
          reset({
            firstName: data.doctorName ? data.doctorName.split(' ')[0] : '',
            lastName: data.doctorName ? data.doctorName.split(' ').slice(1).join(' ') : '',
            phoneNumber: data.phoneNumber || '',
            specialization: data.specialization || '',
            experience: data.experience || '',
            about: data.about || '',
            consultationFee: data.consultationFee || ''
          });
        } else {
          data = await userService.getProfile(user.id);
          reset(data);
        }
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    setMessage('');
    try {
      if (user.role === 'DOCTOR') {
        const payload = {
          doctorName: `${data.firstName} ${data.lastName}`,
          phoneNumber: data.phoneNumber,
          specialization: data.specialization,
          experience: data.experience,
          about: data.about,
          consultationFee: data.consultationFee
        };
        await doctorService.updateProfile(payload);
      } else {
        await userService.updateProfile(user.id, data);
      }
      setMessage('Profile updated successfully!');
      setProfile({ ...profile, ...data });
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) return <Typography align="center" mt={10}>Profile not found.</Typography>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Container maxWidth="md">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Paper elevation={2} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              <Avatar sx={{ width: 120, height: 120, mb: 2, bgcolor: '#1976d2' }}>
                <PersonIcon sx={{ fontSize: 80 }} />
              </Avatar>
              <Typography variant="h4" fontWeight={800} color="#1a237e">
                {user.role === 'DOCTOR' ? 'Dr. ' : ''}{profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {profile.email}
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {message && (
              <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mb: 3 }}>
                {message}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    {...register("firstName", { required: "First Name is required" })}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    {...register("lastName", { required: "Last Name is required" })}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    {...register("phoneNumber")}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                {user.role === 'PATIENT' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      {...register("dateOfBirth")}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}
                
                {user.role === 'PATIENT' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      {...register("address")}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                )}

                {user.role === 'DOCTOR' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Specialization" select {...register("specialization")} defaultValue="CARDIOLOGY" InputLabelProps={{ shrink: true }}>
                        <MenuItem value="CARDIOLOGY">Cardiology</MenuItem>
                        <MenuItem value="NEUROLOGY">Neurology</MenuItem>
                        <MenuItem value="DERMATOLOGY">Dermatology</MenuItem>
                        <MenuItem value="ORTHOPEDICS">Orthopedics</MenuItem>
                        <MenuItem value="PEDIATRICS">Pediatrics</MenuItem>
                        <MenuItem value="GENERAL_MEDICINE">General Medicine</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Experience (Years)" type="number" {...register("experience")} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Consultation Fee" type="number" {...register("consultationFee")} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={3} label="About" {...register("about")} InputLabelProps={{ shrink: true }} />
                    </Grid>
                  </>
                )}

                <Grid item xs={12} display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving}
                    sx={{ px: 5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Profile;
