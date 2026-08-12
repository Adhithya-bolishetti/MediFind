import { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Paper, TextField, Button, Avatar, Chip, CircularProgress, Tabs, Tab, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealingIcon from '@mui/icons-material/Healing';
import doctorService from '../services/doctorService';

const FindDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0); // 0 for standard search, 1 for symptom search

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (query = '') => {
    setLoading(true);
    try {
      let data;
      if (query) {
        data = await doctorService.search({ specialty: query });
      } else {
        data = await doctorService.getAll();
      }
      setDoctors(data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBySymptoms = async (symptomsText) => {
    setLoading(true);
    try {
      const data = await doctorService.getRecommendationsBySymptoms(symptomsText);
      // Backend might return an object wrapper or list, assuming list of doctors with recommendationScore
      setDoctors(data);
    } catch (err) {
      console.error("Failed to fetch symptom recommendations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (tab === 0) {
      fetchDoctors(search);
    } else {
      fetchBySymptoms(symptoms);
    }
  };

  return (
    <Box sx={{ pb: 8, pt: 4, background: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: '#1a237e' }}>
          Find a <span className="gradient-text">Specialist</span>
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Search our extensive network of top-rated healthcare professionals.
        </Typography>

        <Paper elevation={2} sx={{ mb: 6, borderRadius: 3, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
            <Tab label="Standard Search" icon={<SearchIcon />} iconPosition="start" />
            <Tab label="Symptom-Based Search" icon={<HealingIcon />} iconPosition="start" />
          </Tabs>

          <Box component="form" onSubmit={handleSearch} sx={{ p: 3 }}>
            {tab === 1 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Disclaimer:</strong> This is a recommendation helper and NOT a medical diagnosis. In case of emergency, please call your local emergency services immediately.
              </Alert>
            )}

            <Box display="flex" alignItems="center" gap={2}>
              {tab === 0 ? (
                <TextField
                  fullWidth
                  placeholder="Search by specialty (e.g., Cardiology, Neurology)..."
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Describe your symptoms (e.g., I have chest pain and breathing difficulty)..."
                  variant="outlined"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              )}
              <Button 
                type="submit"
                variant="contained" 
                size="large"
                disabled={loading || (tab === 0 ? false : symptoms.length < 5)}
                sx={{ py: { xs: 2, md: tab === 1 ? 3 : 2 }, px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 600, height: '100%' }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {doctors.map((doctor, index) => (
              <Grid item xs={12} sm={6} md={4} key={doctor.id || index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      borderRadius: 4, 
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.3s',
                      cursor: 'pointer',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 15px 30px rgba(0,0,0,0.1)', borderColor: 'transparent' }
                    }}
                    onClick={() => navigate(`/doctors/${doctor.id}`)}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar 
                        src={`https://i.pravatar.cc/150?u=${doctor.id}`} 
                        sx={{ width: 80, height: 80, border: '3px solid #e3f2fd' }}
                      />
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          Dr. {doctor.firstName} {doctor.lastName}
                        </Typography>
                        <Chip 
                          label={doctor.specialty} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ mt: 0.5, fontWeight: 600 }}
                        />
                      </Box>
                    </Box>

                    {doctor.recommendationScore && (
                      <Box mb={2}>
                        <Chip label={`Match Score: ${Math.round(doctor.recommendationScore * 100)}%`} color="success" size="small" />
                      </Box>
                    )}
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1} color="text.secondary">
                      <LocalHospitalIcon fontSize="small" />
                      <Typography variant="body2">Hospital ID: {doctor.hospitalId}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={3} color="text.secondary">
                      <StarIcon fontSize="small" sx={{ color: '#ffb300' }} />
                      <Typography variant="body2" fontWeight={600}>{doctor.rating || 'New'}</Typography>
                    </Box>

                    <Button 
                      fullWidth 
                      variant="outlined"
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/doctors/${doctor.id}`); }}
                    >
                      View Profile & Book
                    </Button>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
            {doctors.length === 0 && !loading && (
              <Box width="100%" textAlign="center" py={10}>
                <Typography variant="h5" color="text.secondary">No doctors found matching your criteria.</Typography>
              </Box>
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default FindDoctors;
