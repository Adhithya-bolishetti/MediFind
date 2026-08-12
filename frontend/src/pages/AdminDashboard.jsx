import { useState, useEffect, useContext } from 'react';
import { Box, Typography, Container, Paper, Grid, CircularProgress, Card, CardContent } from '@mui/material';
import { motion } from 'framer-motion';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { AuthContext } from '../context/AuthContext';
import doctorService from '../services/doctorService';
import hospitalService from '../services/hospitalService';
// Assuming we have services to get counts, if not, we get all and count

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ doctors: 0, hospitals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [docs, hosps] = await Promise.all([
          doctorService.getAll(),
          hospitalService.getAll()
        ]);
        setStats({
          doctors: docs.length,
          hospitals: hosps.length
        });
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
          <Typography variant="h5" fontWeight={700} mb={2}>System Status</Typography>
          <Typography variant="body1">All microservices are operational.</Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
