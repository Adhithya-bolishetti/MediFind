import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button, Chip,
  CircularProgress, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import doctorService from '../services/doctorService';
import appointmentService from '../services/appointmentService';

// Icons
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import notificationService from '../services/notificationService';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

const StatusChip = ({ status }) => {
  const colorMap = {
    CONFIRMED: { bg: '#DCFCE7', color: '#16A34A' },
    PENDING: { bg: '#FEF9C3', color: '#A16207' },
    COMPLETED: { bg: '#DBEAFE', color: '#1D4ED8' },
    CANCELLED: { bg: '#FEE2E2', color: '#DC2626' },
    DECLINED: { bg: '#FEE2E2', color: '#DC2626' },
    REJECTED: { bg: '#FEE2E2', color: '#DC2626' },
  };
  const c = colorMap[status] || { bg: 'var(--mf-border)', color: '#6B7280' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
    />
  );
};

// Convert "10:30:00" (LocalTime serialization) into "10:30 AM" display format.
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const t = String(timeStr);
  if (t.includes(' ')) {
    // Already formatted like "10:30 AM"
    const [hhmm, meridiem] = t.split(' ');
    return { time: hhmm, meridiem: meridiem?.toUpperCase() };
  }
  const [hh, mm] = t.split(':').map(Number);
  if (Number.isNaN(hh)) return { time: t, meridiem: '' };
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return { time: `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, meridiem: suffix };
};

const AppointmentRow = ({ appt, locationName, onAccept, onDecline, onComplete, busy }) => {
  const dateObj = new Date(appt.appointmentDate);
  const display = formatTime(appt.appointmentTime);
  const patientName = appt.user?.fullName || `Patient #${appt.userId}`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 2,
        borderBottom: '1px solid var(--mf-border)',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Time block */}
      <Box
        sx={{
          minWidth: 64,
          p: 1,
          borderRadius: 2,
          bgcolor: `${TEAL}10`,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <Typography variant="body1" fontWeight={800} color={TEAL} sx={{ lineHeight: 1.1 }}>
          {display.time || dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
        </Typography>
        {display.meridiem && (
          <Typography variant="caption" fontWeight={700} color={TEAL}>
            {display.meridiem}
          </Typography>
        )}
      </Box>

      {/* Details */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} color={NAVY} noWrap>
          {patientName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {appt.reason || 'Consultation'}
        </Typography>
        {locationName && (
          <Box sx={{ display: 'flex', alignItems: 'center' }} gap={0.5} mt={0.3}>
            <LocationOnIcon sx={{ fontSize: 12, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary" noWrap>{locationName}</Typography>
          </Box>
        )}
      </Box>

      <StatusChip status={appt.status} />

      {appt.status === 'PENDING' && onAccept && onDecline && (
        <Box display="flex" gap={1} flexShrink={0}>
          <Button
            variant="contained"
            size="small"
            disabled={busy}
            onClick={() => onAccept(appt)}
            sx={{
              textTransform: 'none', borderRadius: 2, fontWeight: 700,
              bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' },
            }}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={busy}
            onClick={() => onDecline(appt)}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
          >
            Decline
          </Button>
        </Box>
      )}

      {appt.status === 'CONFIRMED' && onComplete && (
        <Button
          variant="contained"
          color="success"
          size="small"
          disabled={busy}
          onClick={() => onComplete(appt)}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
        >
          Completed
        </Button>
      )}
    </Box>
  );
};

const StatCard = ({ icon, label, value, iconBg, iconColor }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: '1px solid var(--mf-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
    }}
  >
    <Box
      sx={{
        width: 44, height: 44,
        borderRadius: '12px',
        bgcolor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" fontWeight={800} color={NAVY}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [allAppts, setAllAppts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [doctorEntityId, setDoctorEntityId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch the doctor profile. The doctor entity id (not the auth user id)
        // is what the appointment service uses to look up the schedule.
        let doctorId = user.id;
        try {
          const profile = await doctorService.getMyProfile();
          setDoctorProfile(profile);
          setDoctorEntityId(profile?.id);
          if (profile?.id) doctorId = profile.id;
        } catch { }

        // Fetch appointments
        try {
          const res = await api.get(`/appointments/doctor/${doctorId}`);
          const appts = res.data || [];
          setAllAppts(appts);

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString().split('T')[0];
          const todayList = appts.filter(a => {
            const d = a.appointmentDate?.split('T')[0] || a.appointmentDate;
            return d === todayStr;
          });
          setTodayAppts(todayList);
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

  // Stats
  const total = allAppts.length;
  const confirmed = allAppts.filter(a => a.status === 'CONFIRMED').length;
  const pending = allAppts.filter(a => a.status === 'PENDING').length;

  const doctorName = doctorProfile?.doctorName || user?.fullName || 'Doctor';
  const displayName = doctorName.replace(/^Dr\.?\s+/i, '');
  const locationName = doctorProfile?.clinicName || doctorProfile?.clinicAddress || 'OPD Room 1';

  const handleAccept = async (appt) => {
    setActionLoadingId(appt.id);
    try {
      await appointmentService.accept(appt.id, doctorEntityId || appt.doctorId);
      setAllAppts(prev => prev.map(a => (a.id === appt.id ? { ...a, status: 'CONFIRMED' } : a)));
      setTodayAppts(prev => prev.map(a => (a.id === appt.id ? { ...a, status: 'CONFIRMED' } : a)));
      showToast('Appointment accepted successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept appointment.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (appt) => {
    setActionLoadingId(appt.id);
    try {
      await appointmentService.decline(appt.id, doctorEntityId || appt.doctorId);
      setAllAppts(prev => prev.map(a => (a.id === appt.id ? { ...a, status: 'DECLINED' } : a)));
      setTodayAppts(prev => prev.map(a => (a.id === appt.id ? { ...a, status: 'DECLINED' } : a)));
      showToast('Appointment declined.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to decline appointment.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (appt) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    setActionLoadingId(appt.id);
    try {
      await appointmentService.complete(appt.id, doctorEntityId || appt.doctorId);
      setAllAppts(prev => prev.map(a => (a.id === appt.id ? { ...a, status: 'COMPLETED' } : a)));
      setTodayAppts(prev => prev.map(a => (a.id === appt.id ? { ...a, status: 'COMPLETED' } : a)));
      showToast('Appointment marked as completed successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark appointment as completed.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color={NAVY}>
            Welcome, Dr. {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Here's your overview for today.
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

      {/* Today's Appointments */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} mb={2}>
          <Typography variant="subtitle1" fontWeight={700} color={NAVY}>
            Today's Appointments
          </Typography>
          <Button
            variant="outlined"
            size="small"
            endIcon={<ChevronRightIcon />}
            onClick={() => navigate('/appointments')}
            sx={{
              textTransform: 'none', borderRadius: 2,
              borderColor: TEAL, color: TEAL, fontWeight: 600,
              '&:hover': { bgcolor: `${TEAL}10` },
            }}
          >
            View All Appointments
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }} py={3}><CircularProgress size={32} sx={{ color: TEAL }} /></Box>
        ) : todayAppts.length === 0 ? (
          <Box py={3} sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No appointments scheduled for today.</Typography>
          </Box>
        ) : (
          <Box>
            {todayAppts.map(appt => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                locationName={locationName}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onComplete={handleComplete}
                busy={actionLoadingId === appt.id}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Upcoming + Stats */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} mb={3}>
          <Typography variant="subtitle1" fontWeight={700} color={NAVY}>
            Upcoming (Next 7 Days)
          </Typography>
          <Button
            size="small"
            endIcon={<ChevronRightIcon />}
            sx={{ textTransform: 'none', color: TEAL, fontWeight: 600 }}
            onClick={() => navigate('/appointments')}
          >
            View Schedule
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<EventAvailableIcon />}
              label="Total Appointments"
              value={total}
              iconBg="#EFF6FF"
              iconColor="#3B82F6"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<CheckCircleIcon />}
              label="Confirmed"
              value={confirmed}
              iconBg="#DCFCE7"
              iconColor="#16A34A"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              icon={<AccessTimeIcon />}
              label="Pending"
              value={pending}
              iconBg="#FEF9C3"
              iconColor="#A16207"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DoctorDashboard;
