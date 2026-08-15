import { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Paper, TextField, Button, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import StarIcon from '@mui/icons-material/Star';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import hospitalService from '../services/hospitalService';

const TEAL = '#079A9A';
const NAVY = '#101B36';

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
      const data = await hospitalService.getAll();
      setHospitals(Array.isArray(data) ? data : []);
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
    // Client-side filtering by name/city
    const q = search.toLowerCase();
    const filtered = hospitals.filter(h =>
      (h.hospitalName || '').toLowerCase().includes(q) ||
      (h.city || '').toLowerCase().includes(q) ||
      (h.address || '').toLowerCase().includes(q)
    );
    setHospitals(filtered);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      <Container maxWidth="lg" disableGutters>
        <Box mb={3}>
          <Typography variant="h5" fontWeight={800} color={NAVY}>
            Find Hospitals
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Locate medical centers near you and check their facilities and services.
          </Typography>
        </Box>

        <Paper
          component="form"
          onSubmit={handleSearch}
          elevation={0}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: 3,
            mb: 4,
            border: '1px solid #E8EDF2',
          }}
        >
          <TextField
            fullWidth
            placeholder="Search by hospital name or city..."
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
              '& fieldset': { borderColor: '#D9DEE8' },
              '&:hover fieldset': { borderColor: TEAL },
              '&.Mui-focused fieldset': { borderColor: TEAL },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: TEAL,
              '&:hover': { bgcolor: '#068A8A' },
            }}
          >
            Search
          </Button>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }} py={10}>
            <CircularProgress sx={{ color: TEAL }} size={60} />
          </Box>
        ) : (
          <Grid container spacing={4}>
            {hospitals.map((hospital, index) => (
              <Grid size={{ xs: 12, md: 6 }} key={hospital.id}>
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
                      border: '1px solid #E8EDF2',
                      transition: 'all 0.3s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', borderColor: `${TEAL}40` },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} mb={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1.5}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: `${TEAL}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <LocalHospitalIcon sx={{ color: TEAL }} />
                        </Box>
                        <Typography variant="h6" fontWeight={700} color={NAVY}>
                          {hospital.hospitalName || hospital.name}
                        </Typography>
                      </Box>
                      {hospital.emergencyAvailable && (
                        <Chip label="24/7 ER" color="error" size="small" sx={{ fontWeight: 700 }} />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1} mb={0.5} color="text.secondary">
                      <LocationOnIcon fontSize="small" />
                      <Typography variant="body2">
                        {[hospital.address, hospital.city, hospital.state].filter(Boolean).join(', ')}
                      </Typography>
                    </Box>
                    {hospital.phoneNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1} mb={1} color="text.secondary">
                        <LocalPhoneIcon fontSize="small" />
                        <Typography variant="body2">{hospital.phoneNumber}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center' }} gap={0.5} mb={3}>
                      <StarIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                      <Typography variant="body2" fontWeight={700} color="#F59E0B">
                        {hospital.rating > 0 ? hospital.rating : 'New'}
                      </Typography>
                      {hospital.totalReviews > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          ({hospital.totalReviews} reviews)
                        </Typography>
                      )}
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: '#E8EDF2',
                        color: NAVY,
                        '&:hover': { borderColor: TEAL, color: TEAL },
                      }}
                      onClick={() => setSelectedHospital(hospital)}
                    >
                      View Details
                    </Button>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
            {hospitals.length === 0 && !loading && (
              <Grid size={12}>
                <Box sx={{ textAlign: 'center' }} py={10}>
                  <SearchIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No hospitals found.</Typography>
                  <Button
                    variant="text"
                    sx={{ mt: 1, color: TEAL, textTransform: 'none' }}
                    onClick={() => { setSearch(''); fetchHospitals(); }}
                  >
                    Clear filters
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>

      {/* Hospital Details Dialog */}
      <Dialog open={!!selectedHospital} onClose={() => setSelectedHospital(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
        {selectedHospital && (
          <>
            <DialogTitle>
              <Typography variant="h4" fontWeight={700} color={NAVY}>
                {selectedHospital.hospitalName || selectedHospital.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Typography variant="h6" fontWeight={700} color={TEAL}>
                  {selectedHospital.rating > 0 ? selectedHospital.rating : 'New'}
                </Typography>
                <StarIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  ({selectedHospital.totalReviews || 0} reviews)
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box my={2}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Location</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {[selectedHospital.address, selectedHospital.city, selectedHospital.state].filter(Boolean).join(', ')}
                </Typography>

                <Typography variant="h6" fontWeight={600} gutterBottom>Contact</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Phone: {selectedHospital.phoneNumber || '—'}<br />
                  Email: {selectedHospital.email || '—'}
                </Typography>

                <Typography variant="h6" fontWeight={600} gutterBottom>Facilities</Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                  {selectedHospital.emergencyAvailable && <Chip label="Emergency Room" color="error" />}
                  <Chip label={`Lat: ${selectedHospital.latitude ?? '—'}`} variant="outlined" />
                  <Chip label={`Lng: ${selectedHospital.longitude ?? '—'}`} variant="outlined" />
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
