import { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress,
  Button
} from '@mui/material';
import { motion } from 'framer-motion';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import api from '../services/api';

const TEAL = '#079A9A';
const NAVY = '#101B36';

const AppointmentHistory = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewType, setReviewType] = useState('doctor');
  const [reviewedStatus, setReviewedStatus] = useState({});

  const handleOpenReview = (appt, type) => {
    setSelectedAppointment(appt);
    setReviewType(type);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setReviewedStatus(prev => ({
      ...prev,
      [selectedAppointment.id]: {
        ...(prev[selectedAppointment.id] || {}),
        [reviewType]: true,
      },
    }));
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Use the configured api client (has auth token interceptor)
        const endpoint = user.role === 'DOCTOR'
          ? `/appointments/doctor/${user.id}`
          : `/appointments/user/${user.id}`;

        const res = await api.get(endpoint);
        setAppointments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch appointments', err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAppointments();
  }, [user]);

  const cancelAppointment = async (id) => {
    try {
      await api.put(`/appointments/${id}/cancel`);
      setAppointments(appointments.map(app =>
        app.id === id ? { ...app, status: 'CANCELLED' } : app
      ));
    } catch (err) {
      console.error('Failed to cancel appointment', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'primary';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FEF9C3', color: '#A16207' };
      case 'CONFIRMED': return { bg: '#DBEAFE', color: '#1D4ED8' };
      case 'COMPLETED': return { bg: '#DCFCE7', color: '#16A34A' };
      case 'CANCELLED': return { bg: '#FEE2E2', color: '#DC2626' };
      default: return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color={NAVY}>
          {user.role === 'DOCTOR' ? 'My Schedule' : 'Booked Appointments'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.3}>
          {user.role === 'DOCTOR'
            ? 'Manage your patient appointments.'
            : 'View and manage your booked appointments.'}
        </Typography>
      </Box>

      {appointments.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 4, textAlign: 'center', border: '1px dashed #D1D5DB' }}>
          <EventIcon sx={{ fontSize: 56, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No appointments found.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.role === 'PATIENT' ? 'Book your first appointment with a doctor.' : 'No appointments in your schedule.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {appointments.map((appt, index) => {
            const statusStyle = getStatusBg(appt.status);
            const dateObj = new Date(appt.appointmentDate);
            const dateStr = dateObj.toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });

            return (
              <Grid item xs={12} key={appt.id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid #E8EDF2',
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: 2,
                      borderLeft: `4px solid`,
                      borderLeftColor: appt.status === 'CONFIRMED' ? TEAL
                        : appt.status === 'PENDING' ? '#F59E0B'
                        : appt.status === 'COMPLETED' ? '#22C55E'
                        : '#EF4444',
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.07)' },
                    }}
                  >
                    <Box>
                      <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                        <Chip
                          label={appt.status}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                        <Typography variant="body1" fontWeight={700} color={NAVY}>
                          {dateStr}
                        </Typography>
                      </Box>

                      <Box display="flex" gap={3} flexWrap="wrap" color="text.secondary">
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <AccessTimeIcon fontSize="small" />
                          <Typography variant="body2">{appt.appointmentTime || '—'}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <PersonIcon fontSize="small" />
                          <Typography variant="body2">
                            {user.role === 'DOCTOR'
                              ? `Patient ID: ${appt.userId}`
                              : `Doctor ID: ${appt.doctorId}`}
                          </Typography>
                        </Box>
                      </Box>

                      {appt.reason && (
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#6B7280' }}>
                          Reason: {appt.reason}
                        </Typography>
                      )}
                    </Box>

                    <Box display="flex" flexDirection="column" gap={1} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
                      {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => cancelAppointment(appt.id)}
                          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                        >
                          Cancel Appointment
                        </Button>
                      )}

                      {appt.status === 'COMPLETED' && user.role === 'PATIENT' && (
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Button
                            variant={reviewedStatus[appt.id]?.doctor ? 'text' : 'contained'}
                            size="small"
                            disabled={reviewedStatus[appt.id]?.doctor}
                            onClick={() => handleOpenReview(appt, 'doctor')}
                            sx={{
                              textTransform: 'none',
                              borderRadius: 2,
                              fontWeight: 600,
                              bgcolor: reviewedStatus[appt.id]?.doctor ? undefined : TEAL,
                              '&:hover': { bgcolor: reviewedStatus[appt.id]?.doctor ? undefined : '#068A8A' },
                            }}
                          >
                            {reviewedStatus[appt.id]?.doctor ? 'Doctor Reviewed ✓' : 'Rate Doctor'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      )}

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
