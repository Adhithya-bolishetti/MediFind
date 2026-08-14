import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, Button, Avatar,
  Chip, CircularProgress, Tabs, Tab, Alert, InputAdornment, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import HealingIcon from '@mui/icons-material/Healing';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import doctorService from '../services/doctorService';

const TEAL = '#079A9A';
const NAVY = '#101B36';

const specializations = [
  'All', 'GENERAL_PHYSICIAN', 'CARDIOLOGIST', 'DERMATOLOGIST',
  'NEUROLOGIST', 'ORTHOPEDIC', 'PEDIATRICIAN', 'GYNECOLOGIST',
  'PSYCHIATRIST', 'OPHTHALMOLOGIST', 'ENT_SPECIALIST', 'DENTIST',
];

const DoctorCard = ({ doctor, onClick }) => {
  const name = doctor.doctorName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor';
  const spec = doctor.specialization || doctor.specialty || '—';
  const rating = doctor.rating > 0 ? doctor.rating.toFixed(1) : 'New';
  const reviews = doctor.totalReviews || 0;
  const exp = doctor.experience;
  const fee = doctor.consultationFee;
  const city = doctor.city;

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 3,
        borderRadius: 4,
        border: '1px solid #E8EDF2',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
          borderColor: `${TEAL}40`,
        },
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
        <Avatar
          src={doctor.profileImage || `https://i.pravatar.cc/150?u=doc${doctor.id}`}
          sx={{ width: 64, height: 64, border: `2px solid ${TEAL}25`, flexShrink: 0 }}
        />
        <Box flex={1} minWidth={0}>
          <Typography variant="body1" fontWeight={700} color={NAVY}>
            Dr. {name}
          </Typography>
          <Chip
            label={spec.replace(/_/g, ' ')}
            size="small"
            sx={{
              mt: 0.5,
              bgcolor: `${TEAL}10`,
              color: TEAL,
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
            }}
          />
          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
            <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
            <Typography variant="caption" fontWeight={700} color="#F59E0B">
              {rating}
            </Typography>
            {reviews > 0 && (
              <Typography variant="caption" color="text.secondary">
                ({reviews})
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Info rows */}
      <Box flex={1}>
        {exp !== undefined && exp !== null && (
          <Box display="flex" alignItems="center" gap={0.8} mb={0.8}>
            <WorkHistoryIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary">
              {exp} year{exp !== 1 ? 's' : ''} experience
            </Typography>
          </Box>
        )}
        {city && (
          <Box display="flex" alignItems="center" gap={0.8} mb={0.8}>
            <LocationOnIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary" noWrap>{city}</Typography>
          </Box>
        )}
        {fee !== undefined && fee !== null && fee > 0 && (
          <Box display="flex" alignItems="center" gap={0.8}>
            <LocalHospitalIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary">₹{fee} consultation fee</Typography>
          </Box>
        )}
      </Box>

      {/* Buttons */}
      <Box display="flex" gap={1.5} mt={2.5}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            borderColor: '#E8EDF2',
            color: NAVY,
            fontWeight: 600,
            '&:hover': { borderColor: TEAL, color: TEAL },
          }}
        >
          View Profile
        </Button>
        <Button
          fullWidth
          variant="contained"
          size="small"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            bgcolor: TEAL,
            fontWeight: 600,
            '&:hover': { bgcolor: '#068A8A' },
          }}
        >
          Book
        </Button>
      </Box>
    </Paper>
  );
};

const FindDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('All');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);

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
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBySymptoms = async (symptomsText) => {
    setLoading(true);
    try {
      const data = await doctorService.getRecommendationsBySymptoms(symptomsText);
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch symptom recommendations', err);
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

  const filtered = specFilter !== 'All'
    ? doctors.filter(d => d.specialization === specFilter || d.specialty === specFilter)
    : doctors;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color={NAVY}>
          Find Doctors
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.3}>
          Search our network of top-rated healthcare professionals.
        </Typography>
      </Box>

      {/* Search Card */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 4, border: '1px solid #E8EDF2', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid #E8EDF2',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: TEAL },
            '& .MuiTabs-indicator': { bgcolor: TEAL },
          }}
        >
          <Tab label="Standard Search" icon={<SearchIcon />} iconPosition="start" />
          <Tab label="Symptom-Based" icon={<HealingIcon />} iconPosition="start" />
        </Tabs>

        <Box component="form" onSubmit={handleSearch} sx={{ p: 3 }}>
          {tab === 1 && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <strong>Disclaimer:</strong> This is a recommendation helper, NOT a medical diagnosis. In emergencies, call emergency services immediately.
            </Alert>
          )}
          <Box display="flex" alignItems="flex-start" gap={2} flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
            {tab === 0 ? (
              <TextField
                fullWidth
                placeholder="Search by specialty or doctor name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 },
                }}
                size="small"
              />
            ) : (
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Describe your symptoms (e.g., chest pain, breathing difficulty)..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                size="small"
              />
            )}
            <Button
              type="submit"
              variant="contained"
              size="medium"
              disabled={loading || (tab === 1 && symptoms.length < 5)}
              sx={{
                flexShrink: 0,
                px: 3,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: TEAL,
                height: 40,
                '&:hover': { bgcolor: '#068A8A' },
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>

          {/* Specialization Filter (standard search only) */}
          {tab === 0 && (
            <FormControl size="small" sx={{ mt: 2, minWidth: 220 }}>
              <InputLabel>Specialization</InputLabel>
              <Select
                value={specFilter}
                label="Specialization"
                onChange={(e) => setSpecFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {specializations.map(s => (
                  <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={48} sx={{ color: TEAL }} />
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
          </Typography>
          <Grid container spacing={3}>
            {filtered.map((doctor, index) => (
              <Grid item xs={12} sm={6} lg={4} key={doctor.id || index}>
                <DoctorCard
                  doctor={doctor}
                  onClick={() => navigate(`/doctors/${doctor.id}`)}
                />
              </Grid>
            ))}
            {filtered.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={8}>
                  <SearchIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No doctors found matching your criteria.
                  </Typography>
                  <Button
                    variant="text"
                    sx={{ mt: 1, color: TEAL, textTransform: 'none' }}
                    onClick={() => { setSearch(''); setSpecFilter('All'); fetchDoctors(); }}
                  >
                    Clear filters
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default FindDoctors;
