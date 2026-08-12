import { useState, useEffect, useContext } from 'react';
import { Box, Typography, Container, Paper, Grid, Chip, CircularProgress, Button } from '@mui/material';
import { motion } from 'framer-motion';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';

const AppointmentHistory = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewType, setReviewType] = useState('doctor');
  
  // Track reviewed status locally for demo purposes
  // Ideally, backend should return this with the appointment
  const [reviewedStatus, setReviewedStatus] = useState({});

  const handleOpenReview = (appt, type) => {
    setSelectedAppointment(appt);
    setReviewType(type);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = (type) => {
    setReviewedStatus(prev => ({
      ...prev,
      [selectedAppointment.id]: {
        ...(prev[selectedAppointment.id] || {}),
        [type]: true
      }
    }));
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const endpoint = user.role === 'DOCTOR' 
          ? `http://localhost:8080/api/appointments/doctor/${user.id}`
          : `http://localhost:8080/api/appointments/user/${user.id}`;
          
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setAppointments(res.data);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAppointments();
  }, [user]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'primary';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/appointments/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Refresh list
      setAppointments(appointments.map(app => app.id === id ? { ...app, status: 'CANCELLED' } : app));
    } catch (err) {
      console.error("Failed to cancel appointment", err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8, pt: 4, background: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: '#1a237e', mb: 6 }}>
          {user.role === 'DOCTOR' ? 'My Schedule' : 'My Appointments'}
        </Typography>

        {appointments.length === 0 ? (
          <Paper elevation={0} sx={{ p: 5, borderRadius: 4, textAlign: 'center', border: '1px dashed #ccc' }}>
            <Typography variant="h6" color="text.secondary">No appointments found.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {appointments.map((appt, index) => (
              <Grid item xs={12} key={appt.id}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 3, 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: 2,
                      borderLeft: '6px solid',
                      borderColor: (theme) => theme.palette[getStatusColor(appt.status)].main
                    }}
                  >
                    <Box>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Chip label={appt.status} color={getStatusColor(appt.status)} size="small" sx={{ fontWeight: 700 }} />
                        <Typography variant="h6" fontWeight={700}>
                          {new Date(appt.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" gap={4} color="text.secondary" flexWrap="wrap">
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body1">{appt.appointmentTime}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" />
                          <Typography variant="body1">
                            {user.role === 'DOCTOR' ? `Patient ID: ${appt.userId}` : `Doctor ID: ${appt.doctorId}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#666' }}>
                        Reason: {appt.reason}
                      </Typography>
                    </Box>

                    <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                      {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => cancelAppointment(appt.id)}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          Cancel Appointment
                        </Button>
                      )}

                      {appt.status === 'COMPLETED' && user.role === 'PATIENT' && (
                        <Box display="flex" gap={1}>
                          <Button 
                            variant={reviewedStatus[appt.id]?.doctor ? "text" : "contained"} 
                            color="primary"
                            disabled={reviewedStatus[appt.id]?.doctor}
                            onClick={() => handleOpenReview(appt, 'doctor')}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            {reviewedStatus[appt.id]?.doctor ? 'Doctor Reviewed ✓' : 'Rate Doctor'}
                          </Button>
                          <Button 
                            variant={reviewedStatus[appt.id]?.hospital ? "text" : "contained"} 
                            color="secondary"
                            disabled={reviewedStatus[appt.id]?.hospital}
                            onClick={() => handleOpenReview(appt, 'hospital')}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            {reviewedStatus[appt.id]?.hospital ? 'Hospital Reviewed ✓' : 'Rate Hospital'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      
      {reviewModalOpen && selectedAppointment && (
        <ReviewModal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          appointment={selectedAppointment}
          type={reviewType}
          onSuccess={handleReviewSuccess}
        />
      )}
    </Box>
  );
};

export default AppointmentHistory;
