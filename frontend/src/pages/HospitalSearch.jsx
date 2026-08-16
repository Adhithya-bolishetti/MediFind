import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Typography, Container, Grid, Paper, TextField, Button, Chip,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, InputAdornment, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import StarIcon from '@mui/icons-material/Star';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EmergencyIcon from '@mui/icons-material/Emergency';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import hospitalService from '../services/hospitalService';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

// Haversine distance in km.
const distanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const sortOptions = [
  { value: 'ratingDesc', label: 'Rating: High to Low' },
  { value: 'ratingAsc', label: 'Rating: Low to High' },
  { value: 'nameAsc', label: 'Hospital Name: A-Z' },
  { value: 'nameDesc', label: 'Hospital Name: Z-A' },
  { value: 'locationAsc', label: 'Location: A-Z' },
  { value: 'distanceAsc', label: 'Distance: Nearest First' },
  { value: 'distanceDesc', label: 'Distance: Farthest First' },
];

const HospitalCard = ({ hospital, distance, onView, onCallAmbulance }) => {
  const cover = hospital.imageUrl;
  const facilities = (hospital.facilities || '').split(',').map((f) => f.trim()).filter(Boolean).slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid var(--mf-border)',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.25s',
          '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 34px rgba(0,0,0,0.10)', borderColor: `${TEAL}55` },
        }}
      >
        {/* Cover */}
        <Box
          sx={{
            height: 170,
            bgcolor: 'var(--mf-surface)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={onView}
        >
          {cover ? (
            <Box component="img" src={cover} alt={hospital.hospitalName} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <LocalHospitalIcon sx={{ fontSize: 64, color: 'var(--mf-muted)' }} />
          )}
          {hospital.emergencyAvailable && (
            <Chip
              icon={<EmergencyIcon sx={{ fontSize: 13 }} />}
              label="24×7 Emergency"
              size="small"
              sx={{ position: 'absolute', top: 10, left: 10, bgcolor: '#EF4444', color: '#fff', fontWeight: 700, fontSize: '0.66rem', height: 22, boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}
            />
          )}
        </Box>

        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          <Typography variant="h6" fontWeight={800} color={NAVY} sx={{ lineHeight: 1.25, cursor: 'pointer' }} onClick={onView}>
            {hospital.hospitalName}
          </Typography>
          {hospital.hospitalType && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {hospital.hospitalType}
            </Typography>
          )}

          {/* Rating + distance */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <StarIcon sx={{ fontSize: 17, color: '#F59E0B' }} />
              <Typography variant="body2" fontWeight={800} color="#F59E0B">
                {hospital.rating > 0 ? hospital.rating.toFixed(1) : 'New'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({hospital.totalReviews || 0})
              </Typography>
            </Box>
            {distance != null && (
              <Chip
                icon={<MyLocationIcon sx={{ fontSize: 13 }} />}
                label={`${distance.toFixed(1)} km`}
                size="small"
                sx={{ bgcolor: `${TEAL}12`, color: TEAL, fontWeight: 700, fontSize: '0.68rem', height: 22 }}
              />
            )}
          </Box>

          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <LocationOnIcon sx={{ fontSize: 15, color: 'var(--mf-muted)' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {[hospital.city, hospital.state].filter(Boolean).join(', ')}
            </Typography>
          </Box>

          {/* Facilities */}
          {facilities.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {facilities.map((f, i) => (
                <Chip key={i} label={f} size="small" sx={{ bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)', color: 'var(--mf-muted)', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
              ))}
              {facilities.length < (hospital.facilities || '').split(',').filter(Boolean).length && (
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>+more</Typography>
              )}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {hospital.ambulanceAvailable && hospital.ambulancePhone ? (
              <Button
                variant="contained"
                fullWidth
                startIcon={<LocalTaxiIcon />}
                onClick={() => onCallAmbulance(hospital)}
                sx={{
                  textTransform: 'none', fontWeight: 800, borderRadius: 2,
                  bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' },
                  boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              >
                🚑 Call Ambulance
              </Button>
            ) : (
              <Chip
                label="Ambulance unavailable"
                size="small"
                sx={{ width: '100%', bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)', color: 'var(--mf-muted)', fontWeight: 600, fontSize: '0.72rem', height: 34, borderRadius: 2 }}
              />
            )}
          </Box>
          <Button
            variant="outlined"
            fullWidth
            onClick={onView}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: 'var(--mf-border)', color: NAVY, '&:hover': { borderColor: TEAL, color: TEAL, bgcolor: 'rgba(7,154,154,0.05)' } }}
          >
            View Hospital
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
};

const HospitalSearch = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('ratingDesc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [ambulanceTarget, setAmbulanceTarget] = useState(null);
  const locRequested = useRef(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const data = await hospitalService.getAll();
        setHospitals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch hospitals', err);
        setError('Unable to load hospitals. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  // Ask for location only when the user wants distance sorting (graceful if denied).
  const requestLocation = () => {
    if (locRequested.current || coords) return;
    if (!('geolocation' in navigator)) {
      setLocationError('Location is not supported by this browser.');
      return;
    }
    locRequested.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError('Location unavailable — distance sorting is disabled.'),
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (sortBy === 'distanceAsc' || sortBy === 'distanceDesc') requestLocation();
  }, [sortBy]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = hospitals;
    if (q) {
      list = hospitals.filter((h) =>
        [h.hospitalName, h.address, h.city, h.state, h.hospitalType, h.facilities, h.specialties]
          .some((f) => f && f.toLowerCase().includes(q))
      );
    }
    const withDist = (list || []).map((h) => ({
      ...h,
      distance: coords && h.latitude != null && h.longitude != null
        ? distanceKm(coords.lat, coords.lng, h.latitude, h.longitude)
        : null,
    }));
    switch (sortBy) {
      case 'ratingAsc':
        return [...withDist].sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'nameAsc':
        return [...withDist].sort((a, b) => (a.hospitalName || '').localeCompare(b.hospitalName || '', undefined, { sensitivity: 'base' }));
      case 'nameDesc':
        return [...withDist].sort((a, b) => (b.hospitalName || '').localeCompare(a.hospitalName || '', undefined, { sensitivity: 'base' }));
      case 'locationAsc':
        return [...withDist].sort((a, b) => (a.city || '').localeCompare(b.city || '', undefined, { sensitivity: 'base' }));
      case 'distanceAsc':
        return [...withDist].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      case 'distanceDesc':
        return [...withDist].sort((a, b) => (b.distance ?? -Infinity) - (a.distance ?? -Infinity));
      default:
        return [...withDist].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  }, [hospitals, search, sortBy, coords]);

  const confirmAmbulance = (hospital) => {
    if (!hospital.ambulanceAvailable || !hospital.ambulancePhone) return;
    setAmbulanceTarget(hospital);
  };

  const placeAmbulanceCall = () => {
    if (!ambulanceTarget?.ambulancePhone) return;
    window.location.href = `tel:${ambulanceTarget.ambulancePhone}`;
    setAmbulanceTarget(null);
  };

  const distanceSortActive = sortBy === 'distanceAsc' || sortBy === 'distanceDesc';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      <Container maxWidth="lg" disableGutters>
        <Box mb={3}>
          <Typography variant="h5" fontWeight={800} color={NAVY}>
            Find Hospitals
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Locate medical centers near you, check facilities and call an ambulance in emergencies.
          </Typography>
        </Box>

        {/* Search + Sort */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 1, border: '1px solid var(--mf-border)' }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search by hospital, city, type or facility — try 'apollo' or 'Hyderabad'"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                flex: '1 1 320px',
                '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'var(--mf-input)' },
                '& fieldset': { borderColor: 'var(--mf-border)' },
                '&:hover fieldset': { borderColor: TEAL },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'var(--mf-muted)' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl sx={{ minWidth: 230, flex: '0 1 auto' }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2.5, bgcolor: 'var(--mf-input)' }}>
                {sortOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {distanceSortActive && !coords && (
            <Typography variant="caption" sx={{ color: locationError ? '#DC2626' : 'var(--mf-muted)', display: 'block', mt: 1 }}>
              {locationError || 'Using your location for distances…'}
            </Typography>
          )}
          {distanceSortActive && coords && (
            <Typography variant="caption" sx={{ color: 'var(--mf-muted)', display: 'block', mt: 1 }}>
              Showing approximate distances from your current location.
            </Typography>
          )}
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }} py={10}>
            <CircularProgress sx={{ color: TEAL }} size={60} />
          </Box>
        ) : filtered.length === 0 ? (
          <Paper elevation={0} sx={{ p: 8, borderRadius: 4, textAlign: 'center', border: '1px dashed var(--mf-border)' }}>
            <SearchIcon sx={{ fontSize: 64, color: 'var(--mf-border)', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No hospitals found.</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {search ? `Nothing matches "${search}".` : 'No hospitals are listed yet.'}
            </Typography>
            <Button variant="text" sx={{ color: TEAL, textTransform: 'none', fontWeight: 700 }} onClick={() => setSearch('')}>
              Clear search
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((hospital) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={hospital.id}>
                <HospitalCard
                  hospital={hospital}
                  distance={hospital.distance}
                  onView={() => navigate(`/hospitals/${hospital.id}`)}
                  onCallAmbulance={confirmAmbulance}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Call ambulance confirmation */}
      <Dialog open={!!ambulanceTarget} onClose={() => setAmbulanceTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalTaxiIcon sx={{ color: '#DC2626' }} /> Call Ambulance?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Call ambulance for <strong style={{ color: NAVY }}>{ambulanceTarget?.hospitalName}</strong>?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}>
            <LocalPhoneIcon sx={{ color: TEAL, fontSize: 20 }} />
            <Typography variant="body1" fontWeight={800} color={NAVY}>
              {ambulanceTarget?.ambulancePhone}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            This will start a phone call from your device.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setAmbulanceTarget(null)} sx={{ textTransform: 'none', color: 'var(--mf-muted)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={placeAmbulanceCall}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            Call {ambulanceTarget?.ambulancePhone}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospitalSearch;
