import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Button, CircularProgress, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import hospitalService from '../services/hospitalService';
import notificationService from '../services/notificationService';

import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import EmergencyIcon from '@mui/icons-material/Emergency';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import RateReviewIcon from '@mui/icons-material/RateReview';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import BuildIcon from '@mui/icons-material/Build';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

const statusChip = (status) => {
  const map = {
    PENDING: { bg: '#FEF9C3', color: '#A16207', label: 'Pending Approval' },
    APPROVED: { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
    ACTIVE: { bg: '#DCFCE7', color: '#16A34A', label: 'Active' },
    REJECTED: { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
    SUSPENDED: { bg: '#FEE2E2', color: '#DC2626', label: 'Suspended' },
  };
  const s = map[status] || { bg: 'var(--mf-border)', color: '#6B7280', label: status || 'Unknown' };
  return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />;
};

const StatCard = ({ icon, label, value, color, bgColor, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: '1px solid var(--mf-border)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
      '&:hover': onClick ? { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' } : {},
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" fontWeight={800} color={NAVY} sx={{ lineHeight: 1.1 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      </Box>
    </Box>
  </Paper>
);

const HospitalDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  useEffect(() => {
    const load = async () => {
      try {
        const p = await hospitalService.getMyProfile();
        setProfile(p);
        try {
          const notifs = await notificationService.getAll();
          const arr = Array.isArray(notifs) ? notifs : [];
          setUnread(arr.filter((n) => !n.isRead).length);
        } catch { /* ignore */ }
      } catch (err) {
        console.error('Failed to load hospital profile', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
        <Paper elevation={0} sx={{ p: 6, borderRadius: 4, textAlign: 'center', border: '1px dashed var(--mf-border)' }}>
          <LocalHospitalIcon sx={{ fontSize: 56, color: 'var(--mf-border)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No hospital profile found.</Typography>
          <Button variant="contained" sx={{ mt: 1, bgcolor: TEAL, textTransform: 'none', fontWeight: 700 }} onClick={() => navigate('/hospital/setup')}>
            Create Hospital Profile
          </Button>
        </Paper>
      </Box>
    );
  }

  const suspended = profile.status === 'SUSPENDED';
  const facilities = (profile.facilities || '').split(',').map((f) => f.trim()).filter(Boolean);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      {suspended && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Your hospital account has been suspended by the administrator. Please contact MediFind support.
        </Alert>
      )}
      {profile.status === 'PENDING' && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Your hospital profile is awaiting admin approval. It will become visible to patients once approved.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color={NAVY}>
            Welcome back, {firstName}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Manage your hospital, services and patient visibility.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<NotificationsNoneIcon />}
            onClick={() => navigate('/hospital/notifications')}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: 'var(--mf-border)', color: NAVY }}
          >
            Notifications{unread > 0 ? ` (${unread})` : ''}
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate('/hospital/profile')}
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: TEAL, fontWeight: 700, '&:hover': { bgcolor: '#068A8A' } }}
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      {/* Hospital banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
          border: '1px solid var(--mf-border)',
          background: `linear-gradient(135deg, ${TEAL}12 0%, ${TEAL}04 100%)`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2.5,
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', sm: 120 },
            height: { xs: 160, sm: 120 },
            borderRadius: 3,
            overflow: 'hidden',
            flexShrink: 0,
            bgcolor: 'var(--mf-surface)',
            border: '1px solid var(--mf-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {profile.imageUrl ? (
            <Box component="img" src={profile.imageUrl} alt={profile.hospitalName} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <LocalHospitalIcon sx={{ fontSize: 56, color: 'var(--mf-muted)' }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h5" fontWeight={800} color={NAVY}>{profile.hospitalName}</Typography>
            {statusChip(profile.status)}
          </Box>
          {profile.hospitalType && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
              {profile.hospitalType}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.8 }}>
            <LocationOnIcon sx={{ fontSize: 15, color: 'var(--mf-muted)' }} />
            <Typography variant="body2" color="text.secondary">
              {[profile.address, profile.city, profile.state].filter(Boolean).join(', ')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
              <Typography variant="body2" fontWeight={700} color={NAVY}>
                {profile.rating > 0 ? profile.rating.toFixed(1) : 'New'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({profile.totalReviews || 0} reviews)
              </Typography>
            </Box>
            {profile.emergencyAvailable && (
              <Chip icon={<EmergencyIcon />} label="24×7 Emergency" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.7rem' }} />
            )}
            {profile.ambulanceAvailable && (
              <Chip icon={<LocalTaxiIcon />} label={`Ambulance${profile.ambulancePhone ? ` · ${profile.ambulancePhone}` : ''}`} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '0.7rem' }} />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={<StarIcon />} label="Average Rating" value={profile.rating > 0 ? profile.rating.toFixed(1) : '—'} color="#F59E0B" bgColor="#FFFBEB" onClick={() => navigate('/hospital/reviews')} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={<RateReviewIcon />} label="Reviews" value={profile.totalReviews || 0} color={TEAL} bgColor={`${TEAL}15`} onClick={() => navigate('/hospital/reviews')} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={<PhotoLibraryIcon />} label="Images" value={(profile.images || []).length} color="#8B5CF6" bgColor="#F5F3FF" onClick={() => navigate('/hospital/images')} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard icon={<BuildIcon />} label="Facilities" value={facilities.length} color="#3B82F6" bgColor="#EFF6FF" onClick={() => navigate('/hospital/profile')} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Facilities */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} color={NAVY} mb={2}>Facilities & Services</Typography>
            {facilities.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {facilities.map((f, i) => (
                  <Chip key={i} label={f} sx={{ bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)', color: NAVY, fontWeight: 600, fontSize: '0.78rem' }} />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No facilities listed yet.</Typography>
            )}
            {profile.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                {profile.description}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick actions */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
            <Typography variant="subtitle1" fontWeight={700} color={NAVY} mb={2}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate('/hospital/profile')} sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2, borderColor: 'var(--mf-border)', color: NAVY }}>
                Manage Hospital Profile
              </Button>
              <Button variant="outlined" startIcon={<PhotoLibraryIcon />} onClick={() => navigate('/hospital/images')} sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2, borderColor: 'var(--mf-border)', color: NAVY }}>
                Manage Images ({(profile.images || []).length}/10)
              </Button>
              <Button variant="outlined" startIcon={<RateReviewIcon />} onClick={() => navigate('/hospital/reviews')} sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2, borderColor: 'var(--mf-border)', color: NAVY }}>
                View Reviews & Ratings
              </Button>
              <Button variant="outlined" startIcon={<NotificationsNoneIcon />} onClick={() => navigate('/hospital/notifications')} sx={{ justifyContent: 'flex-start', textTransform: 'none', borderRadius: 2, borderColor: 'var(--mf-border)', color: NAVY }}>
                Notifications{unread > 0 ? ` (${unread} unread)` : ''}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HospitalDashboard;
