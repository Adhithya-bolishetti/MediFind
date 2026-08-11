import { useContext, useEffect, useState } from 'react';
import { Box, Typography, Container, Grid, Paper, CardActionArea } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const getPatientActions = () => [
    { title: 'Find a Doctor', icon: <PersonSearchIcon fontSize="large" color="primary" />, path: '/doctors', color: '#e3f2fd' },
    { title: 'My Appointments', icon: <EventAvailableIcon fontSize="large" color="secondary" />, path: '/appointments', color: '#f3e5f5' },
    { title: 'Search Hospitals', icon: <LocalHospitalIcon fontSize="large" color="error" />, path: '/hospitals', color: '#ffebee' },
    { title: 'Notifications', icon: <NotificationsActiveIcon fontSize="large" color="warning" />, path: '/notifications', color: '#fff8e1' },
  ];

  const getDoctorActions = () => [
    { title: 'My Schedule', icon: <EventAvailableIcon fontSize="large" color="primary" />, path: '/appointments', color: '#e3f2fd' },
    { title: 'Patient Records', icon: <PersonSearchIcon fontSize="large" color="secondary" />, path: '/patients', color: '#f3e5f5' },
    { title: 'Notifications', icon: <NotificationsActiveIcon fontSize="large" color="warning" />, path: '/notifications', color: '#fff8e1' },
  ];

  const actions = user?.role === 'DOCTOR' ? getDoctorActions() : getPatientActions();

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)', pt: 8, pb: 10, color: 'white', borderRadius: '0 0 30px 30px' }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {greeting}, {user?.role === 'DOCTOR' ? 'Dr. ' : ''}User {user?.id}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
              Welcome back to your MediFind dashboard. How can we help you today?
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -6 }}>
        <Grid container spacing={4}>
          {actions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Paper
                  elevation={4}
                  sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }
                  }}
                >
                  <CardActionArea onClick={() => navigate(action.path)} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                    <Box sx={{ 
                      width: 80, height: 80, borderRadius: '50%', 
                      backgroundColor: action.color, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mx: 'auto', mb: 2
                    }}>
                      {action.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      {action.title}
                    </Typography>
                  </CardActionArea>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
