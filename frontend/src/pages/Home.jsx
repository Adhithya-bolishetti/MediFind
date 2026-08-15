import { Box, Typography, Button, Container, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const TEAL = '#079A9A';

const features = [
  {
    title: 'Find Top Doctors',
    description: 'Search for specialists by name, specialty, or symptoms.',
    icon: <SearchIcon fontSize="large" sx={{ color: TEAL }} />,
    path: '/doctors'
  },
  {
    title: 'Locate Hospitals',
    description: 'Find nearby hospitals and check their emergency services.',
    icon: <LocalHospitalIcon fontSize="large" sx={{ color: TEAL }} />,
    path: '/hospitals'
  },
  {
    title: 'Book Appointments',
    description: 'Schedule consultations easily and manage your history.',
    icon: <CalendarMonthIcon fontSize="large" sx={{ color: TEAL }} />,
    path: '/login'
  }
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ pb: 8 }}>
      {/* Hero Section */}
      <Box 
        sx={{
          background: 'linear-gradient(135deg, #E0F5F0 0%, #BFE9E0 100%)',
          pt: 15,
          pb: 12,
          borderRadius: '0 0 40px 40px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          mb: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative background shapes */}
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
        <Box sx={{ position: 'absolute', bottom: -100, left: -50, width: 400, height: 400, borderRadius: '50%', background: 'rgba(7, 154, 154, 0.06)' }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography variant="h2" component="h1" fontWeight={800} gutterBottom sx={{ color: 'var(--mf-text)', letterSpacing: '-1px' }}>
              Your Health, <span className="gradient-text">Our Priority</span>
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}>
              Connect with top-rated doctors, locate nearby hospitals, and manage your medical appointments all in one seamless platform.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => navigate('/doctors')}
                sx={{ 
                  borderRadius: '30px', 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  bgcolor: TEAL,
                  boxShadow: '0 8px 20px rgba(7, 154, 154, 0.3)',
                  '&:hover': { transform: 'translateY(-2px)', bgcolor: '#068A8A', boxShadow: '0 12px 25px rgba(7, 154, 154, 0.4)' },
                  transition: 'all 0.3s'
                }}
              >
                Find a Doctor
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => navigate('/login')}
                sx={{ 
                  borderRadius: '30px', 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  borderWidth: '2px',
                  borderColor: TEAL,
                  color: TEAL,
                  '&:hover': { borderWidth: '2px', backgroundColor: 'rgba(7, 154, 154, 0.06)', transform: 'translateY(-2px)' },
                  transition: 'all 0.3s'
                }}
              >
                Book Appointment
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg">
        <Typography variant="h3" textAlign="center" fontWeight={800} sx={{ mb: 6, color: 'var(--mf-text)', letterSpacing: '-0.5px' }}>
          Platform Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 4, 
                    height: '100%', 
                    borderRadius: '24px',
                    backgroundColor: 'var(--mf-card)',
                    border: '1px solid var(--mf-border)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                      borderColor: 'transparent'
                    }
                  }}
                  onClick={() => navigate(feature.path)}
                >
                  <Box sx={{ 
                    width: 70, 
                    height: 70, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(7,154,154,0.10)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 3
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
