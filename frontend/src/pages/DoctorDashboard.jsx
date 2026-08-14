import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button,
  CircularProgress, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import doctorService from '../services/doctorService';

// Icons
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import notificationService from '../services/notificationService';

const TEAL = '#079A9A';
const NAVY = '#101B36';

const StatusChip = ({ status }) => {
  const colorMap = {
    CONFIRMED: { bg: '#DCFCE7', color: '#16A34A' },
    PENDING: { bg: '#FEF9C3', color: '#A16207' },
    COMPLETED: { bg: '#DBEAFE', color: '#1D4ED8' },
    CANCELLED: { bg: '#FEE2E2', color: '#DC2626' },
  };
  const c = colorMap[status] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
    />
  );
};

const AppointmentRow = ({ appt }) => {
  const timeStr = appt.appointmentTime || '';
  const dateObj = new Date(appt.appointmentDate);
  const timeDisplay = timeStr || dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 2,
        borderBottom: '1px solid #F3F4F6',
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
        <Typography variant="body1" fontWeight={800} color={TEAL} lineHeight={1.1}>
          {timeDisplay.split(' ')[0]}
        </Typography>
        {timeDisplay.includes(' ') && (
          <Typography variant="caption" fontWeight={700} color={TEAL}>
            {timeDisplay.split(' ')[1]}
          </Typography>
        )}
      </Box>

      {/* Details */}
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={700} color={NAVY} noWrap>
          Patient ID: {appt.userId}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {appt.reason || 'Consultation'}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5} mt={0.3}>
          <LocationOnIcon sx={{ fontSize: 12, color: '#9CA3AF' }} />
          <Typography variant="caption" color="text.secondary">OPD Room 1</Typography>
        </Box>
      </Box>

      <StatusChip status={appt.status} />
    </Box>
  );
};

const StatCard = ({ icon, label, value, iconBg, iconColor }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: '1px solid #E8EDF2',
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

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch doctor profile for name
        try {
          const profile = await doctorService.getMyProfile();
          setDoctorProfile(profile);
        } catch { }

        // Fetch appointments
        try {
          const res = await api.get(`/appointments/doctor/${user.id}`);
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color={NAVY}>
            Welcome, Dr. {doctorName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            Here's your overview for today.
          </Typography>
        </Box>
        <IconButton
          onClick={() => navigate('/notifications')}
          sx={{ bgcolor: '#fff', border: '1px solid #E8EDF2', borderRadius: 2 }}
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
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E8EDF2', mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
          <Box display="flex" justifyContent="center" py={3}><CircularProgress size={32} sx={{ color: TEAL }} /></Box>
        ) : todayAppts.length === 0 ? (
          <Box py={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">No appointments scheduled for today.</Typography>
          </Box>
        ) : (
          <Box>
            {todayAppts.map(appt => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </Box>
        )}
      </Paper>

      {/* Upcoming + Stats */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E8EDF2' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<EventAvailableIcon />}
              label="Total Appointments"
              value={total}
              iconBg="#EFF6FF"
              iconColor="#3B82F6"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<CheckCircleIcon />}
              label="Confirmed"
              value={confirmed}
              iconBg="#DCFCE7"
              iconColor="#16A34A"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
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
