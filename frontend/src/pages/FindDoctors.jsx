import { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Paper, TextField, Button, Avatar, Chip, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import axios from 'axios';

const FindDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Initial load
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async (query = '') => {
    setLoading(true);
    try {
      const url = query 
        ? `http://localhost:8080/api/doctors/search?specialty=${query}`
        : `http://localhost:8080/api/doctors`;
      const res = await axios.get(url);
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors(search);
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

        <Paper 
          component="form" 
          onSubmit={handleSearch}
          elevation={2} 
          sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, mb: 6 }}
        >
          <TextField
            fullWidth
            placeholder="Search by specialty (e.g., Cardiology, Neurology)..."
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button 
            type="submit"
            variant="contained" 
            size="large"
            startIcon={<SearchIcon />}
            sx={{ py: 1.5, px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Search
          </Button>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {doctors.map((doctor, index) => (
              <Grid item xs={12} sm={6} md={4} key={doctor.id}>
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
