import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, Button, Avatar,
  Chip, CircularProgress, Tabs, Tab, Alert, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import HealingIcon from '@mui/icons-material/Healing';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import doctorService from '../services/doctorService';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

const specializations = [
  'All', 'GENERAL_PHYSICIAN', 'CARDIOLOGIST', 'DERMATOLOGIST',
  'NEUROLOGIST', 'ORTHOPEDIC', 'PEDIATRICIAN', 'GYNECOLOGIST',
  'PSYCHIATRIST', 'OPHTHALMOLOGIST', 'ENT_SPECIALIST', 'DENTIST',
];

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
};

const DoctorCard = ({ doctor, onClick }) => {
  const name = doctor.doctorName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor';
  const spec = doctor.specialization || doctor.specialty || '—';
  const rating = doctor.rating > 0 ? doctor.rating.toFixed(1) : 'New';
  const reviews = doctor.totalReviews || 0;
  const exp = doctor.experience;
  const fee = doctor.consultationFee;
  const hospitalName = doctor.hospitalInfo?.hospitalName || doctor.clinicName;
  const location = [doctor.city, doctor.state].filter(Boolean).join(', ');

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 3,
        borderRadius: 4,
        border: '1px solid var(--mf-border)',
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Avatar
          src={doctor.profileImage || `https://i.pravatar.cc/150?u=doc${doctor.id}`}
          sx={{ width: 64, height: 64, border: `2px solid ${TEAL}25`, flexShrink: 0 }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" fontWeight={700} color={NAVY}>
            Dr. {name.replace(/^Dr\.?\s+/i, '')}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
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
      <Box sx={{ flex: 1 }}>
        {hospitalName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
            <LocalHospitalIcon sx={{ fontSize: 15, color: TEAL }} />
            <Typography variant="caption" fontWeight={600} color={NAVY} noWrap>
              {hospitalName}
            </Typography>
          </Box>
        )}
        {location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
            <LocationOnIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {location}
            </Typography>
          </Box>
        )}
        {exp !== undefined && exp !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
            <WorkHistoryIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary">
              {exp} year{exp !== 1 ? 's' : ''} experience
            </Typography>
          </Box>
        )}
        {fee !== undefined && fee !== null && fee > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Typography variant="caption" color="text.secondary">₹{fee} consultation fee</Typography>
          </Box>
        )}
        {doctor._distanceKm != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
            <MyLocationIcon sx={{ fontSize: 15, color: '#3B82F6' }} />
            <Typography variant="caption" fontWeight={600} color="#3B82F6">
              {formatDistance(doctor._distanceKm)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            borderColor: 'var(--mf-border)',
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
  const [sortBy, setSortBy] = useState('recommended');
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | loading | ok | denied
  const [geoNote, setGeoNote] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getAll();
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

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('denied');
      setGeoNote('Location is not supported by this browser, so nearest-first sorting is unavailable.');
      setSortBy('recommended');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('ok');
        setGeoNote('');
      },
      () => {
        setGeoStatus('denied');
        setGeoNote('Location access was denied. Enable location to sort by distance.');
        setSortBy('recommended');
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    if (value === 'nearest' && !userCoords) {
      requestLocation();
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = doctors.filter((d) => {
      if (specFilter !== 'All' && d.specialization !== specFilter) return false;
      if (!q) return true;
      const fields = [
        d.doctorName,
        d.specialization,
        (d.specialization || '').replace(/_/g, ' '),
        d.subSpecialization,
        d.qualification,
        d.city,
        d.state,
        d.clinicName,
        d.clinicAddress,
        d.hospitalInfo?.hospitalName,
      ];
      return fields.some((f) => f && f.toLowerCase().includes(q));
    });

    if (sortBy === 'nameAsc') {
      list = [...list].sort((a, b) =>
        (a.doctorName || '').localeCompare(b.doctorName || '', undefined, { sensitivity: 'base' })
      );
    } else if (sortBy === 'nameDesc') {
      list = [...list].sort((a, b) =>
        (b.doctorName || '').localeCompare(a.doctorName || '', undefined, { sensitivity: 'base' })
      );
    } else if (sortBy === 'nearest' && userCoords) {
      const withDist = list.map((d) => {
        const distance =
          d.latitude != null && d.longitude != null
            ? haversineKm(userCoords.lat, userCoords.lng, d.latitude, d.longitude)
            : null;
        return { ...d, _distanceKm: distance };
      });
      list = withDist.sort((a, b) => {
        if (a._distanceKm == null && b._distanceKm == null) return 0;
        if (a._distanceKm == null) return 1;
        if (b._distanceKm == null) return -1;
        return a._distanceKm - b._distanceKm;
      });
    } else if (sortBy === 'ratingDesc') {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'ratingAsc') {
      list = [...list].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortBy === 'locationAsc') {
      list = [...list].sort((a, b) =>
        ((a.city || '') + (a.state || '')).localeCompare(((b.city || '') + (b.state || '')), undefined, { sensitivity: 'base' })
      );
    } else if (sortBy === 'recommended') {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list;
  }, [doctors, search, specFilter, sortBy, userCoords]);

  const clearFilters = () => {
    setSearch('');
    setSpecFilter('All');
    setSortBy('recommended');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} color={NAVY}>
          Find Doctors
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
          Search our network of top-rated healthcare professionals.
        </Typography>
      </Box>

      {/* Search Card */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 4, border: '1px solid var(--mf-border)', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid var(--mf-border)',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: TEAL },
            '& .MuiTabs-indicator': { bgcolor: TEAL },
          }}
        >
          <Tab label="Standard Search" icon={<SearchIcon />} iconPosition="start" />
          <Tab label="Symptom-Based" icon={<HealingIcon />} iconPosition="start" />
        </Tabs>

        <Box component="form" onSubmit={(e) => { e.preventDefault(); if (tab === 1) fetchBySymptoms(symptoms); }} sx={{ p: 3 }}>
          {tab === 1 && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <strong>Disclaimer:</strong> This is a recommendation helper, NOT a medical diagnosis. In emergencies, call emergency services immediately.
            </Alert>
          )}

          {tab === 0 ? (
            <>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, gap: 1.5 }}>
                <TextField
                  fullWidth
                  placeholder="Search by doctor, specialization, hospital, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#9CA3AF' }} />
                        </InputAdornment>
                      ),
                      endAdornment: search ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearch('')} aria-label="Clear search">
                            <CloseIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                      sx: { borderRadius: 2 },
                    },
                  }}
                  size="small"
                />
                <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 200 }, flexShrink: 0 }}>
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    value={specFilter}
                    label="Specialization"
                    onChange={(e) => setSpecFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {specializations.map((s) => (
                      <MenuItem key={s} value={s}>{s === 'All' ? 'All Specializations' : s.replace(/_/g, ' ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 200 }, flexShrink: 0 }}>
                  <InputLabel>
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <SortIcon sx={{ fontSize: 16 }} /> Sort By
                    </Box>
                  </InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => handleSortChange(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="recommended">Recommended</MenuItem>
                    <MenuItem value="ratingDesc">Rating: High → Low</MenuItem>
                    <MenuItem value="ratingAsc">Rating: Low → High</MenuItem>
                    <MenuItem value="nearest">Location: Nearest First</MenuItem>
                    <MenuItem value="locationAsc">Location: A → Z</MenuItem>
                    <MenuItem value="nameAsc">Doctor Name: A → Z</MenuItem>
                    <MenuItem value="nameDesc">Doctor Name: Z → A</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {sortBy === 'nearest' && (
                <Alert
                  severity={geoStatus === 'denied' ? 'warning' : 'info'}
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  {geoStatus === 'loading' && 'Getting your location to sort by distance...'}
                  {geoStatus === 'ok' && 'Sorting doctors nearest to your current location.'}
                  {geoStatus === 'denied' && (geoNote || 'Location access was denied. Enable location to sort by distance.')}
                </Alert>
              )}
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
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
              <Button
                type="submit"
                variant="contained"
                size="medium"
                disabled={loading || symptoms.length < 5}
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
          )}
        </Box>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={48} sx={{ color: TEAL }} />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
            </Typography>
            {(search || specFilter !== 'All' || sortBy !== 'recommended') && (
              <Button size="small" onClick={clearFilters} sx={{ color: TEAL, textTransform: 'none', fontWeight: 600 }}>
                Clear search & filters
              </Button>
            )}
          </Box>
          <Grid container spacing={3}>
            {filtered.map((doctor, index) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={doctor.id || index}>
                <DoctorCard
                  doctor={doctor}
                  onClick={() => navigate(`/doctors/${doctor.id}`)}
                />
              </Grid>
            ))}
            {filtered.length === 0 && (
              <Grid size={12}>
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <SearchIcon sx={{ fontSize: 64, color: 'var(--mf-border)', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No doctors found matching your criteria.
                  </Typography>
                  <Button
                    variant="text"
                    sx={{ mt: 1, color: TEAL, textTransform: 'none' }}
                    onClick={clearFilters}
                  >
                    Clear search & filters
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
