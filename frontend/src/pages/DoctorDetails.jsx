import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Grid, Paper, Avatar, Button, Divider, CircularProgress, Alert, TextField } from '@mui/material';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/doctors/${id}`);
        setDoctor(res.data);
      } catch (err) {
        console.error("Failed to fetch doctor", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    setBooking(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post(
        'http://localhost:8080/api/appointments', 
        { doctorId: parseInt(id), appointmentDate, appointmentTime, reason },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSuccess('Appointment booked successfully!');
      setTimeout(() => navigate('/appointments'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!doctor) return <Typography align="center" mt={10}>Doctor not found.</Typography>;

  return (
    <Box sx={{ pb: 8, pt: 4, background: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Paper elevation={2} sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
                <Avatar 
                  src={`https://i.pravatar.cc/150?u=${doctor.id}`} 
                  sx={{ width: 160, height: 160, mx: 'auto', mb: 3, border: '4px solid #e3f2fd' }}
                />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  Dr. {doctor.firstName} {doctor.lastName}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom fontWeight={600}>
                  {doctor.specialty}
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={2}>
                  <StarIcon sx={{ color: '#ffb300' }} />
                  <Typography variant="h6" fontWeight={700}>{doctor.rating || 'New'}</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {doctor.experienceYears} Years Experience
                </Typography>
                <Divider sx={{ my: 3 }} />
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <SchoolIcon color="action" />
                  <Typography variant="body1">{doctor.qualifications}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <WorkspacePremiumIcon color="action" />
                  <Typography variant="body1">Medical License: {doctor.licenseNumber}</Typography>
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={8}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Paper elevation={2} sx={{ p: 5, borderRadius: 4 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom color="#1a237e">
                  Book an Appointment
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                  Select a date and time to schedule your consultation with Dr. {doctor.lastName}.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                <form onSubmit={handleBook}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Appointment Date"
                        InputLabelProps={{ shrink: true }}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Appointment Time"
                        InputLabelProps={{ shrink: true }}
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Reason for Visit"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={booking || !user}
                        sx={{ 
                          py: 2, 
                          borderRadius: 2, 
                          fontSize: '1.2rem', 
                          fontWeight: 700,
                          textTransform: 'none',
                          background: 'linear-gradient(45deg, #1976d2, #0d47a1)'
                        }}
                      >
                        {booking ? 'Booking...' : (user ? 'Confirm Appointment' : 'Sign in to Book')}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DoctorDetails;
