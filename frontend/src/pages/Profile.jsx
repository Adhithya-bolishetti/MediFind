import { useState, useEffect, useContext } from 'react';
import { Box, Typography, Container, Paper, Grid, TextField, Button, Avatar, Divider, Alert, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = user.role === 'DOCTOR' 
          ? `http://localhost:8080/api/doctors/${user.id}` // Wait, doctors login with user id or doctor id?
          : `http://localhost:8080/api/users/${user.id}`;
        
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const endpoint = user.role === 'DOCTOR' 
        ? `http://localhost:8080/api/doctors/${user.id}`
        : `http://localhost:8080/api/users/${user.id}`;
        
      await axios.put(endpoint, profile, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
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
    <Box sx={{ pb: 8, pt: 4, background: '#f8f9fa', minHeight: '100vh' }}>
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

            <form onSubmit={handleSave}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={profile.firstName || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={profile.lastName || ''}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={profile.phoneNumber || ''}
                    onChange={handleChange}
                  />
                </Grid>
                
                {user.role === 'PATIENT' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      name="dateOfBirth"
                      InputLabelProps={{ shrink: true }}
                      value={profile.dateOfBirth || ''}
                      onChange={handleChange}
                    />
                  </Grid>
                )}
                
                {user.role === 'PATIENT' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={profile.address || ''}
                      onChange={handleChange}
                    />
                  </Grid>
                )}

                {user.role === 'DOCTOR' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Specialty" name="specialty" value={profile.specialty || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Experience (Years)" type="number" name="experienceYears" value={profile.experienceYears || ''} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={3} label="Qualifications" name="qualifications" value={profile.qualifications || ''} onChange={handleChange} />
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
