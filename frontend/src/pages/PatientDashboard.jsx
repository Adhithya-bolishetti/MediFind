import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Avatar, Button, Chip,
  CircularProgress, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import doctorService from '../services/doctorService';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import VideocamIcon from '@mui/icons-material/Videocam';
import notificationService from '../services/notificationService';
import { getCallAvailability } from '../services/videoService';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

// "10:30:00" (LocalTime) -> "10:30 AM"
const formatApptTime = (timeStr) => {
  if (!timeStr) return '';
  const t = String(timeStr);
  if (t.includes(' ')) return t;
  const [hh, mm] = t.split(':').map(Number);
  if (Number.isNaN(hh)) return t;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${suffix}`;
};

const QuickAction = ({ icon, label, color, bgColor, onClick }) => (
  <Paper
    onClick={onClick}
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 3,
      border: '1px solid var(--mf-border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)', transform: 'translateY(-2px)' },
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '14px',
        bgcolor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
      }}
    >
      {icon}
    </Box>
    <Typography variant="caption" fontWeight={600} color={NAVY} sx={{ textAlign: 'center' }} fontSize="0.75rem">
      {label}
    </Typography>
  </Paper>
);

const DoctorCard = ({ doctor, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2,
      borderRadius: 3,
      border: '1px solid var(--mf-border)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)', transform: 'translateY(-2px)' },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1.5}>
      <Avatar
        src={doctor.profileImage || `https://i.pravatar.cc/150?u=doc${doctor.id}`}
        sx={{ width: 52, height: 52, border: `2px solid ${TEAL}20` }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} color={NAVY} noWrap>
          {doctor.doctorName ? `Dr. ${doctor.doctorName.replace(/^Dr\.?\s+/i, '')}` : 'Doctor'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {doctor.specialization?.replace(/_/g, ' ') || '—'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }} gap={0.5} mt={0.3}>
          <StarIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
          <Typography variant="caption" fontWeight={600} color="#F59E0B">
            {doctor.rating > 0 ? doctor.rating.toFixed(1) : 'New'}
          </Typography>
          {doctor.totalReviews > 0 && (
            <Typography variant="caption" color="text.secondary">
              ({doctor.totalReviews})
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
    {doctor.city && (
      <Box sx={{ display: 'flex', alignItems: 'center' }} gap={0.5} mt={1}>
        <LocationOnIcon sx={{ fontSize: 13, color: '#9CA3AF' }} />
        <Typography variant="caption" color="text.secondary">{doctor.city}</Typography>
      </Box>
    )}
  </Paper>
);

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [upcomingAppt, setUpcomingAppt] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const firstName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch upcoming appointment
        try {
          const appts = await api.get(`/appointments/user/${user.id}`);
          const upcoming = (appts.data || [])
            .filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING')
            .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];
          setUpcomingAppt(upcoming || null);
        } catch { /* appointment service may be down */ }

        // Fetch top doctors
        try {
          const docs = await doctorService.getAll();
          setDoctors((docs || []).slice(0, 3));
        } catch { }

        // Fetch hospitals
        try {
          const res = await api.get('/hospitals');
          setHospitals((res.data || []).slice(0, 3));
        } catch { }

        // Unread notifications
        try {
          const notifs = await notificationService.getAll();
          const arr = Array.isArray(notifs) ? notifs : [];
          setUnreadCount(arr.filter(n => !n.isRead).length);
        } catch { }
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color={NAVY}>
            Welcome back, {firstName}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Here's what's happening with your health today.
          </Typography>
        </Box>
        <IconButton
          onClick={() => navigate('/notifications')}
          sx={{ bgcolor: 'var(--mf-card)', border: '1px solid var(--mf-border)', borderRadius: 2 }}
        >
          <Box position="relative">
            <NotificationsNoneIcon sx={{ color: NAVY }} />
            {unreadCount > 0 && (
              <Box
                sx={{
                  position: 'absolute', top: -4, right: -4,
                  bgcolor: '#EF4444', borderRadius: '50%',
                  width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Typography>
              </Box>
            )}
          </Box>
        </IconButton>
      </Box>

      {/* Health Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${TEAL}15 0%, ${TEAL}05 100%)`,
          border: `1px solid ${TEAL}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }} gap={2}>
          <Box
            sx={{
              width: 52, height: 52, bgcolor: TEAL, borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <FavoriteIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color={NAVY}>
              Your Health, Our Priority
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Book appointments, consult experts and find the best care – all in one place.
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, lg: 7 }}>

          {/* Upcoming Appointment */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} mb={2}>
              <Typography variant="subtitle1" fontWeight={700} color={NAVY}>
                Upcoming Appointment
              </Typography>
              <Button
                size="small"
                endIcon={<ChevronRightIcon />}
                sx={{ textTransform: 'none', color: TEAL, fontWeight: 600 }}
                onClick={() => navigate('/appointments')}
              >
                View All
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={2}><CircularProgress size={28} sx={{ color: TEAL }} /></Box>
            ) : upcomingAppt ? (
              <Box
                sx={{
                  p: 2, borderRadius: 3,
                  border: '1px solid var(--mf-border)',
                  display: 'flex', alignItems: 'center', gap: 2,
                }}
              >
                {/* Date block */}
                <Box
                  sx={{
                    minWidth: 60, p: 1.5, borderRadius: 3,
                    bgcolor: `${TEAL}15`, textAlign: 'center',
                  }}
                >
                  <Typography variant="h5" fontWeight={800} color={TEAL} sx={{ lineHeight: 1 }}>
                    {new Date(upcomingAppt.appointmentDate).getDate()}
                  </Typography>
                  <Typography variant="caption" fontWeight={600} color={TEAL} sx={{ textTransform: 'uppercase' }}>
                    {new Date(upcomingAppt.appointmentDate).toLocaleString('en', { month: 'short' })}
                  </Typography>
                  <Typography variant="caption" display="block" color={TEAL} fontWeight={600} mt={0.5}>
                    {formatApptTime(upcomingAppt.appointmentTime)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={700} color={NAVY}>
                    {upcomingAppt.doctor?.doctorName ? `Dr. ${upcomingAppt.doctor.doctorName.replace(/^Dr\.?\s+/i, '')}` : `Doctor #${upcomingAppt.doctorId}`}
                  </Typography>
                  {upcomingAppt.doctor?.specialization && (
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {upcomingAppt.doctor.specialization.replace(/_/g, ' ')}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center' }} gap={0.5} mt={0.3}>
                    <LocationOnIcon sx={{ fontSize: 12, color: '#9CA3AF' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {upcomingAppt.doctor?.city || 'City Care Clinic'}
                    </Typography>
                  </Box>
                  <Chip
                    label={upcomingAppt.status}
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: upcomingAppt.status === 'CONFIRMED' ? '#DCFCE7' : '#FEF9C3',
                      color: upcomingAppt.status === 'CONFIRMED' ? '#16A34A' : '#A16207',
                      fontWeight: 700, fontSize: '0.7rem',
                    }}
                  />
                  {getCallAvailability(upcomingAppt).joinable && (
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      startIcon={<VideocamIcon />}
                      onClick={() => navigate(`/appointments/${upcomingAppt.id}/call`)}
                      sx={{
                        mt: 1.5, bgcolor: TEAL, textTransform: 'none',
                        borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: '#068A8A' },
                      }}
                    >
                      Join Video Call
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
              <Box py={2} sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No upcoming appointments.</Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/doctors')}
                  sx={{ mt: 1.5, bgcolor: TEAL, textTransform: 'none', borderRadius: 2 }}
                >
                  Book Now
                </Button>
              </Box>
            )}
          </Paper>

          {/* Find Doctors Strip */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} mb={2}>
              <Typography variant="subtitle1" fontWeight={700} color={NAVY}>Find Doctors</Typography>
              <Button
                size="small"
                endIcon={<ChevronRightIcon />}
                sx={{ textTransform: 'none', color: TEAL, fontWeight: 600 }}
                onClick={() => navigate('/doctors')}
              >
                View All
              </Button>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" py={2}><CircularProgress size={28} sx={{ color: TEAL }} /></Box>
            ) : (
              <Grid container spacing={2}>
                {doctors.map(doc => (
                  <Grid size={{ xs: 12, sm: 4 }} key={doc.id}>
                    <DoctorCard doctor={doc} onClick={() => navigate(`/doctors/${doc.id}`)} />
                  </Grid>
                ))}
                {doctors.length === 0 && (
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>No doctors found.</Typography>
                  </Grid>
                )}
              </Grid>
            )}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/doctors')}
              sx={{ mt: 2, borderRadius: 2, textTransform: 'none', borderColor: 'var(--mf-border)', color: NAVY, '&:hover': { borderColor: TEAL, color: TEAL } }}
            >
              Search More Doctors
            </Button>
          </Paper>

          {/* Health Tips Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5, borderRadius: 4,
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1px solid #BFDBFE',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }} gap={2}>
              <HealthAndSafetyIcon sx={{ color: '#3B82F6', fontSize: 32 }} />
              <Box>
                <Typography variant="body1" fontWeight={700} color={NAVY}>
                  Stay Updated with Your Health
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Book regular check-ups and stay informed about your health.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              sx={{ flexShrink: 0, textTransform: 'none', borderRadius: 2, borderColor: '#3B82F6', color: '#3B82F6', whiteSpace: 'nowrap' }}
            >
              Explore Health Tips
            </Button>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, lg: 5 }}>
          {/* Quick Actions */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} color={NAVY} mb={2}>
              Quick Actions
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={6}>
                <QuickAction
                  icon={<SearchIcon />}
                  label="Find Doctors"
                  color={TEAL}
                  bgColor={`${TEAL}15`}
                  onClick={() => navigate('/doctors')}
                />
              </Grid>
              <Grid size={6}>
                <QuickAction
                  icon={<LocalHospitalIcon />}
                  label="Find Hospitals"
                  color="#3B82F6"
                  bgColor="#EFF6FF"
                  onClick={() => navigate('/hospitals')}
                />
              </Grid>
              <Grid size={6}>
                <QuickAction
                  icon={<EventNoteIcon />}
                  label="Booked Appointment"
                  color="#8B5CF6"
                  bgColor="#F5F3FF"
                  onClick={() => navigate('/appointments')}
                />
              </Grid>
              <Grid size={6}>
                <QuickAction
                  icon={<PersonOutlinedIcon />}
                  label="View Profile"
                  color="#F59E0B"
                  bgColor="#FFFBEB"
                  onClick={() => navigate('/profile')}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Find Hospitals Strip */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} mb={2}>
              <Typography variant="subtitle1" fontWeight={700} color={NAVY}>Find Hospitals</Typography>
              <Button
                size="small"
                endIcon={<ChevronRightIcon />}
                sx={{ textTransform: 'none', color: TEAL, fontWeight: 600 }}
                onClick={() => navigate('/hospitals')}
              >
                View All
              </Button>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" py={2}><CircularProgress size={28} sx={{ color: TEAL }} /></Box>
            ) : (
              <Box>
                {hospitals.map((h, i) => (
                  <Box
                    key={h.id || i}
                    sx={{
                      display: 'flex', gap: 2, alignItems: 'center',
                      py: 1.5,
                      borderBottom: i < hospitals.length - 1 ? '1px solid var(--mf-border)' : 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: 48, height: 48, flexShrink: 0, borderRadius: 2,
                        bgcolor: 'var(--mf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <LocalHospitalIcon sx={{ color: '#9CA3AF' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} color={NAVY} noWrap>
                        {h.hospitalName || h.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <StarIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                        <Typography variant="caption" fontWeight={600} color="#F59E0B">
                          {h.rating || 'New'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <LocationOnIcon sx={{ fontSize: 13, color: '#9CA3AF' }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {h.city}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
                {hospitals.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                    No hospitals found.
                  </Typography>
                )}
              </Box>
            )}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/hospitals')}
              sx={{ mt: 2, borderRadius: 2, textTransform: 'none', borderColor: 'var(--mf-border)', color: NAVY, '&:hover': { borderColor: TEAL, color: TEAL } }}
            >
              Search More Hospitals
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientDashboard;
