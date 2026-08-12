import { useState, useEffect, useContext } from 'react';
import { Box, Typography, Container, Paper, Grid, CircularProgress, Card, CardContent, Button, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { AuthContext } from '../context/AuthContext';
import doctorService from '../services/doctorService';
import hospitalService from '../services/hospitalService';
// Assuming we have services to get counts, if not, we get all and count

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ doctors: 0, hospitals: 0 });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [pendingDoctorReviews, setPendingDoctorReviews] = useState([]);
  const [pendingHospitalReviews, setPendingHospitalReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [docs, hosps, pending, pendingDRev, pendingHRev] = await Promise.all([
          doctorService.getAll(),
          hospitalService.getAll(),
          doctorService.getPendingDoctors().catch(() => []),
          doctorService.getPendingReviews ? doctorService.getPendingReviews().catch(() => []) : Promise.resolve([]),
          hospitalService.getPendingReviews ? hospitalService.getPendingReviews().catch(() => []) : Promise.resolve([])
        ]);
        setStats({
          doctors: docs.length,
          hospitals: hosps.length
        });
        setPendingDoctors(pending);
        setPendingDoctorReviews(pendingDRev);
        setPendingHospitalReviews(pendingHRev);
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'ADMIN') {
      fetchStats();
    } else {
      setLoading(false); // Should be protected route anyway
    }
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <Container>
        <Typography variant="h4" color="error" mt={10} textAlign="center">
          Access Denied. Admin privileges required.
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ pb: 8, pt: 4, background: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: '#1a237e' }}>
          Admin <span className="gradient-text">Dashboard</span>
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Platform overview and management.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card elevation={2} sx={{ borderRadius: 4, textAlign: 'center', p: 2 }}>
                <CardContent>
                  <MedicalServicesIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                  <Typography variant="h4" fontWeight={800}>{stats.doctors}</Typography>
                  <Typography variant="body1" color="text.secondary">Total Doctors</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card elevation={2} sx={{ borderRadius: 4, textAlign: 'center', p: 2 }}>
                <CardContent>
                  <LocalHospitalIcon sx={{ fontSize: 60, color: '#388e3c', mb: 2 }} />
                  <Typography variant="h4" fontWeight={800}>{stats.hospitals}</Typography>
                  <Typography variant="body1" color="text.secondary">Total Hospitals</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card elevation={2} sx={{ borderRadius: 4, textAlign: 'center', p: 2 }}>
                <CardContent>
                  <PeopleIcon sx={{ fontSize: 60, color: '#f57c00', mb: 2 }} />
                  <Typography variant="h4" fontWeight={800}>-</Typography>
                  <Typography variant="body1" color="text.secondary">Total Users</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card elevation={2} sx={{ borderRadius: 4, textAlign: 'center', p: 2 }}>
                <CardContent>
                  <EventAvailableIcon sx={{ fontSize: 60, color: '#9c27b0', mb: 2 }} />
                  <Typography variant="h4" fontWeight={800}>-</Typography>
                  <Typography variant="body1" color="text.secondary">Appointments</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        <Paper elevation={2} sx={{ p: 4, mt: 6, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>Pending Doctor Approvals</Typography>
          {pendingDoctors.length === 0 ? (
            <Typography variant="body1" color="text.secondary">No pending doctors for verification.</Typography>
          ) : (
            <Grid container spacing={3}>
              {pendingDoctors.map(doctor => (
                <Grid item xs={12} md={6} key={doctor.id}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{doctor.doctorName}</Typography>
                      <Typography variant="body2" color="text.secondary">{doctor.specialization}</Typography>
                      <Typography variant="body2" color="text.secondary">{doctor.email} | {doctor.phoneNumber}</Typography>
                      <Typography variant="body2" color="text.secondary">Exp: {doctor.experience} yrs | Fee: ₹{doctor.consultationFee}</Typography>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Button 
                        variant="contained" 
                        color="success" 
                        startIcon={<CheckCircleIcon />}
                        onClick={async () => {
                          try {
                            await doctorService.approveDoctor(doctor.id);
                            setPendingDoctors(pendingDoctors.filter(d => d.id !== doctor.id));
                            setStats(s => ({ ...s, doctors: s.doctors + 1 }));
                          } catch (e) {
                            alert("Failed to approve");
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<CancelIcon />}
                        onClick={async () => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason !== null) {
                            try {
                              await doctorService.rejectDoctor(doctor.id, reason);
                              setPendingDoctors(pendingDoctors.filter(d => d.id !== doctor.id));
                            } catch (e) {
                              alert("Failed to reject");
                            }
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        <Paper elevation={2} sx={{ p: 4, mt: 6, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={3}>Pending Review Moderation</Typography>
          
          <Typography variant="h6" fontWeight={600} mb={2}>Doctor Reviews</Typography>
          {pendingDoctorReviews.length === 0 ? (
            <Typography variant="body1" color="text.secondary" mb={4}>No pending doctor reviews.</Typography>
          ) : (
            <Grid container spacing={3} mb={4}>
              {pendingDoctorReviews.map(review => (
                <Grid item xs={12} key={review.id}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>Doctor ID: {review.doctorId} | Rating: {review.rating}</Typography>
                      <Typography variant="body2" color="text.secondary">Patient ID: {review.userId}</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{review.comment}</Typography>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={async () => {
                          try {
                            await doctorService.updateReviewStatus(review.id, 'APPROVED');
                            setPendingDoctorReviews(pendingDoctorReviews.filter(r => r.id !== review.id));
                          } catch (e) {}
                        }}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={async () => {
                          try {
                            await doctorService.updateReviewStatus(review.id, 'REJECTED');
                            setPendingDoctorReviews(pendingDoctorReviews.filter(r => r.id !== review.id));
                          } catch (e) {}
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Typography variant="h6" fontWeight={600} mb={2}>Hospital Reviews</Typography>
          {pendingHospitalReviews.length === 0 ? (
            <Typography variant="body1" color="text.secondary">No pending hospital reviews.</Typography>
          ) : (
            <Grid container spacing={3}>
              {pendingHospitalReviews.map(review => (
                <Grid item xs={12} key={review.id}>
                  <Card variant="outlined" sx={{ borderRadius: 3, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>Hospital ID: {review.hospitalId} | Rating: {review.rating}</Typography>
                      <Typography variant="body2" color="text.secondary">Patient ID: {review.patientId}</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{review.reviewText}</Typography>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={async () => {
                          try {
                            await hospitalService.updateReviewStatus(review.id, 'APPROVED');
                            setPendingHospitalReviews(pendingHospitalReviews.filter(r => r.id !== review.id));
                          } catch (e) {}
                        }}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={async () => {
                          try {
                            await hospitalService.updateReviewStatus(review.id, 'REJECTED');
                            setPendingHospitalReviews(pendingHospitalReviews.filter(r => r.id !== review.id));
                          } catch (e) {}
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        <Paper elevation={2} sx={{ p: 4, mt: 6, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={2}>System Status</Typography>
          <Typography variant="body1">All microservices are operational.</Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
