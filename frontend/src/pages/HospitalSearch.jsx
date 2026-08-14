import { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Paper, TextField, Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';

const HospitalSearch = () => {
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/hospitals');
      setHospitals(res.data);
    } catch (err) {
      console.error("Failed to fetch hospitals", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search) {
      fetchHospitals();
      return;
    }
    // Client-side filtering for simplicity since we don't have a specific name search endpoint
    const filtered = hospitals.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase()));
    setHospitals(filtered);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ color: '#c62828' }}>
          Find a <span style={{ background: 'linear-gradient(45deg, #d32f2f, #f44336)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hospital</span>
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Locate medical centers near you, check bed availability, and emergency services.
        </Typography>

        <Paper 
          component="form" 
          onSubmit={handleSearch}
          elevation={2} 
          sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, mb: 6 }}
        >
          <TextField
            fullWidth
            placeholder="Search by hospital name or city..."
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Button 
            type="submit"
            variant="contained" 
            color="error"
            size="large"
            startIcon={<SearchIcon />}
            sx={{ py: 1.5, px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Search
          </Button>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress color="error" size={60} />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {hospitals.map((hospital, index) => (
              <Grid item xs={12} md={6} key={hospital.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.3s',
                      '&:hover': { transform: 'scale(1.02)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderColor: 'transparent' }
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h5" fontWeight={700} color="#1a237e">
                        {hospital.name}
                      </Typography>
                      {hospital.hasEmergencyRoom && (
                        <Chip label="24/7 ER" color="error" size="small" sx={{ fontWeight: 700 }} />
                      )}
                    </Box>

                    <Box display="flex" alignItems="center" gap={1} mb={1} color="text.secondary">
                      <LocationOnIcon fontSize="small" />
                      <Typography variant="body1">{hospital.address}, {hospital.city}, {hospital.state}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={3} color="text.secondary">
                      <LocalPhoneIcon fontSize="small" />
                      <Typography variant="body1">{hospital.contactPhone}</Typography>
                    </Box>

                    <Box display="flex" gap={2}>
                      <Button 
                        variant="outlined"
                        color="error"
                        fullWidth
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        onClick={() => setSelectedHospital(hospital)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
            {hospitals.length === 0 && !loading && (
              <Box width="100%" textAlign="center" py={10}>
                <Typography variant="h5" color="text.secondary">No hospitals found.</Typography>
              </Box>
            )}
          </Grid>
        )}
      </Container>

      {/* Hospital Details Dialog */}
      <Dialog open={!!selectedHospital} onClose={() => setSelectedHospital(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
        {selectedHospital && (
          <>
            <DialogTitle>
              <Typography variant="h4" fontWeight={700} color="#1a237e">
                {selectedHospital.name || selectedHospital.hospitalName}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {selectedHospital.rating || 'New'}
                </Typography>
                <StarIcon sx={{ color: '#ffb300', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  ({selectedHospital.totalReviews || 0} reviews)
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box my={2}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Location</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {selectedHospital.address}<br />
                  {selectedHospital.city}, {selectedHospital.state} {selectedHospital.zipCode}
                </Typography>

                <Typography variant="h6" fontWeight={600} gutterBottom>Contact</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Phone: {selectedHospital.contactPhone}<br />
                  Email: {selectedHospital.contactEmail}
                </Typography>

                <Typography variant="h6" fontWeight={600} gutterBottom>Facilities</Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                  <Chip label={`Total Beds: ${selectedHospital.totalBeds}`} variant="outlined" />
                  <Chip label={`Available Beds: ${selectedHospital.availableBeds}`} color={selectedHospital.availableBeds > 10 ? "success" : "warning"} />
                  {selectedHospital.hasEmergencyRoom && <Chip label="Emergency Room" color="error" />}
                  {selectedHospital.hasIcu && <Chip label="ICU Available" color="primary" />}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedHospital(null)} size="large" sx={{ textTransform: 'none', fontWeight: 600 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default HospitalSearch;
