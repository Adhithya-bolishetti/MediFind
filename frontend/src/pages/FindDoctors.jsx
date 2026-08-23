import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Grid, Paper, TextField, Button, Avatar,
  Chip, CircularProgress, Tabs, Tab, Alert, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, IconButton,
  Divider,
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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import doctorService from '../services/doctorService';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';
const EMERGENCY_RED = '#DC2626';

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
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
};

// ─────────── Doctor Card ───────────

const DoctorCard = ({ doctor, onClick, showDistance }) => {
  const name = doctor.doctorName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Doctor';
  const spec = doctor.specialization || doctor.specialty || '—';
  const rating = doctor.rating > 0 ? doctor.rating.toFixed(1) : 'New';
  const reviews = doctor.totalReviews || 0;
  const exp = doctor.experience;
  const fee = doctor.consultationFee;
  const hospitalName = doctor.hospitalInfo?.hospitalName || doctor.hospital;
  const location = [doctor.city, doctor.state].filter(Boolean).join(', ');
  const distance = doctor._distanceKm ?? doctor.distanceKm;

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
        {distance != null && showDistance && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
            <MyLocationIcon sx={{ fontSize: 15, color: '#3B82F6' }} />
            <Typography variant="caption" fontWeight={600} color="#3B82F6">
              {formatDistance(distance)}
            </Typography>
          </Box>
        )}
        {doctor.rankingScore != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
            <Typography variant="caption" color="text.secondary">
              Match score: <strong>{doctor.rankingScore.toFixed(1)}/100</strong>
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

// ─────────── Hospital Card (for emergency nearest hospitals) ───────────

const HospitalCard = ({ hospital }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid var(--mf-border)',
        bgcolor: hospital.emergencyAvailable ? '#FEF2F2' : 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <LocalHospitalIcon sx={{ fontSize: 28, color: hospital.emergencyAvailable ? EMERGENCY_RED : TEAL }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={700} color={NAVY}>
            {hospital.hospitalName}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {hospital.address}{hospital.city ? `, ${hospital.city}` : ''}
          </Typography>
          {hospital.phoneNumber && (
            <Typography variant="caption" color="text.secondary">
              📞 {hospital.phoneNumber}
            </Typography>
          )}
          {hospital.emergencyAvailable && (
            <Chip
              label="24/7 Emergency"
              size="small"
              sx={{ mt: 0.5, bgcolor: '#FEE2E2', color: EMERGENCY_RED, fontWeight: 600, fontSize: '0.65rem' }}
            />
          )}
        </Box>
        {hospital.distanceKm != null && (
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography variant="caption" fontWeight={700} color="#3B82F6">
              {formatDistance(hospital.distanceKm)}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

// ─────────── Main FindDoctors Component ───────────

const FindDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('All');
  const [symptomInput, setSymptomInput] = useState('');
  const [symptomChips, setSymptomChips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoNote, setGeoNote] = useState('');

  // Symptom search results state
  const [symptomResult, setSymptomResult] = useState(null);

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

  const addSymptomChip = () => {
    const trimmed = symptomInput.trim();
    if (trimmed && !symptomChips.includes(trimmed)) {
      setSymptomChips([...symptomChips, trimmed]);
      setSymptomInput('');
    }
  };

  const removeSymptomChip = (chip) => {
    setSymptomChips(symptomChips.filter((c) => c !== chip));
  };

  const handleSymptomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSymptomChip();
    }
  };

  const fetchBySymptoms = async () => {
    if (symptomChips.length === 0) return;
    setLoading(true);
    setSymptomResult(null);
    try {
      // Request location if not already available
      let lat = userCoords?.lat ?? null;
      let lng = userCoords?.lng ?? null;

      if (!lat || !lng) {
        try {
          const pos = await new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) return reject(new Error('no geo'));
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
        } catch {
          // Location not available — proceed without it
        }
      }

      const data = await doctorService.searchBySymptoms(symptomChips, lat, lng);
      setSymptomResult(data);

      // Also update the doctors list with the recommended doctors
      if (data?.recommendedDoctors) {
        setDoctors(data.recommendedDoctors);
      }
    } catch (err) {
      console.error('Failed to fetch symptom recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  const clearSymptomSearch = () => {
    setSymptomChips([]);
    setSymptomInput('');
    setSymptomResult(null);
    fetchDoctors();
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
        d.hospital,
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
      // If we have ranking scores from symptom search, preserve that order
      if (symptomResult?.recommendedDoctors?.length > 0) {
        list = [...list].sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
      } else {
        list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
    }
    return list;
  }, [doctors, search, specFilter, sortBy, userCoords, symptomResult]);

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
          onChange={(e, v) => { setTab(v); if (v === 0) clearSymptomSearch(); }}
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

        <Box sx={{ p: 3 }}>
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
            /* ─────────── Symptom-Based Search UI ─────────── */
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                <TextField
                  fullWidth
                  placeholder="Type a symptom and press Enter to add (e.g., fever, cough, headache)..."
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyDown={handleSymptomKeyDown}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <HealingIcon sx={{ color: '#9CA3AF' }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 },
                    },
                  }}
                  size="small"
                />
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!symptomInput.trim()}
                  onClick={addSymptomChip}
                  sx={{
                    flexShrink: 0,
                    px: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: TEAL,
                    color: TEAL,
                    height: 40,
                    minWidth: 44,
                    '&:hover': { borderColor: '#068A8A', bgcolor: `${TEAL}08` },
                  }}
                >
                  <AddIcon />
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={loading || symptomChips.length === 0}
                  onClick={fetchBySymptoms}
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
                  {loading ? 'Analyzing...' : 'Find Doctors'}
                </Button>
              </Box>

              {/* Symptom Chips */}
              {symptomChips.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {symptomChips.map((chip) => (
                    <Chip
                      key={chip}
                      label={chip}
                      onDelete={() => removeSymptomChip(chip)}
                      sx={{
                        bgcolor: `${TEAL}15`,
                        color: TEAL,
                        fontWeight: 600,
                        '& .MuiChip-deleteIcon': { color: TEAL, '&:hover': { color: '#068A8A' } },
                      }}
                    />
                  ))}
                  <Button
                    size="small"
                    onClick={() => setSymptomChips([])}
                    sx={{ color: '#9CA3AF', textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Clear all
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* ─────────── Symptom Search Result Banner ─────────── */}
      {symptomResult && (
        <Box sx={{ mb: 3 }}>
          {/* Emergency Condition Banner */}
          {symptomResult.emergency && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 2,
                borderRadius: 3,
                border: `2px solid ${EMERGENCY_RED}`,
                bgcolor: '#FEF2F2',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <WarningAmberIcon sx={{ fontSize: 32, color: EMERGENCY_RED }} />
                <Typography variant="h6" fontWeight={800} color={EMERGENCY_RED}>
                  🚨 EMERGENCY CONDITION DETECTED
                </Typography>
              </Box>

              {/* Condition Summary Grid */}
              <Grid container spacing={2} sx={{ mb: 1.5 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Condition Type</Typography>
                    <Typography variant="body1" fontWeight={800} color={EMERGENCY_RED}>EMERGENCY</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Severity Score</Typography>
                    <Typography variant="body1" fontWeight={800} color={EMERGENCY_RED}>{symptomResult.severityScore ?? '—'}/100</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Confidence</Typography>
                    <Typography variant="body1" fontWeight={800} color={EMERGENCY_RED}>{symptomResult.confidence ?? '—'}%</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Specialist</Typography>
                    <Typography variant="body1" fontWeight={800} color={NAVY}>{(symptomResult.specialization || '').replace(/_/g, ' ')}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="body2" color="#991B1B" sx={{ mb: 0.5 }}>
                {symptomResult.message || 'Seek immediate medical attention.'}
              </Typography>
              <Typography variant="caption" color="#B91C1C" display="block">
                {symptomResult.explanation}
              </Typography>
              <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2, bgcolor: '#DC262615', border: '1px solid #DC262630' }}>
                Immediate medical attention recommended. Call emergency services or visit the nearest hospital below.
              </Alert>
            </Paper>
          )}

          {/* Normal Condition Banner */}
          {!symptomResult.emergency && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 2,
                borderRadius: 3,
                border: `2px solid #16A34A`,
                bgcolor: '#F0FDF4',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <HealingIcon sx={{ fontSize: 24, color: '#16A34A' }} />
                <Typography variant="h6" fontWeight={800} color="#16A34A">
                  ✅ NORMAL CONDITION DETECTED
                </Typography>
              </Box>

              {/* Condition Summary Grid */}
              <Grid container spacing={2} sx={{ mb: 1.5 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Condition Type</Typography>
                    <Typography variant="body1" fontWeight={800} color="#16A34A">NORMAL</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Severity Score</Typography>
                    <Typography variant="body1" fontWeight={800} color="#16A34A">{symptomResult.severityScore ?? '—'}/100</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Confidence</Typography>
                    <Typography variant="body1" fontWeight={800} color="#16A34A">{symptomResult.confidence ?? '—'}%</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Recommended Specialist</Typography>
                    <Typography variant="body1" fontWeight={800} color={NAVY}>{(symptomResult.specialization || '').replace(/_/g, ' ')}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="body2" color="#166534" sx={{ mb: 0.5 }}>
                Book an appointment with a specialist.
              </Typography>
              <Typography variant="caption" color="#15803D" display="block">
                {symptomResult.explanation}
              </Typography>
            </Paper>
          )}

          {/* Nearest Hospitals (Emergency only) */}
          {symptomResult.emergency && symptomResult.nearestHospitals?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} color={NAVY} sx={{ mb: 1.5 }}>
                🏥 Nearest Hospitals
              </Typography>
              <Grid container spacing={2}>
                {symptomResult.nearestHospitals.slice(0, 6).map((hospital, i) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={hospital.id || i}>
                    <HospitalCard hospital={hospital} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}

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
              {symptomResult && !symptomResult.emergency && symptomResult.specialization && (
                <> · {(symptomResult.specialization || '').replace(/_/g, ' ')}</>
              )}
            </Typography>
            {(search || specFilter !== 'All' || sortBy !== 'recommended' || symptomChips.length > 0) && (
              <Button size="small" onClick={() => { clearFilters(); clearSymptomSearch(); }} sx={{ color: TEAL, textTransform: 'none', fontWeight: 600 }}>
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
                  showDistance={sortBy === 'nearest' || (symptomResult != null)}
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
                    onClick={() => { clearFilters(); clearSymptomSearch(); }}
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
