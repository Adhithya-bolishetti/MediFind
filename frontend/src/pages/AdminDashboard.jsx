import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Button, Avatar, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import doctorService from '../services/doctorService';
import hospitalService from '../services/hospitalService';
import appointmentService from '../services/appointmentService';
import { TEAL, NAVY, MUTED, BORDER, StatusChip, formatDate, isToday } from './admin/shared';

const StatCard = ({ icon, label, value, delta, deltaLabel, color, onClick }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 3, borderRadius: 4, border: `1px solid ${BORDER}`,
      cursor: onClick ? 'pointer' : 'default', height: '100%',
      transition: 'all 0.2s ease',
      '&:hover': onClick ? { transform: 'translateY(-3px)', boxShadow: '0 10px 28px rgba(0,0,0,0.08)', borderColor: `${TEAL}40` } : {},
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
      </Box>
      {delta != null && delta > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: '#E6F7F5', px: 1, py: 0.4, borderRadius: 2 }}>
          <TrendingUpIcon sx={{ fontSize: 13, color: '#0F766E' }} />
          <Typography variant="caption" fontWeight={700} color="#0F766E">+{delta} today</Typography>
        </Box>
      )}
    </Box>
    <Typography variant="h4" fontWeight={800} color={NAVY}>
      {value}
    </Typography>
    <Typography variant="body2" color={MUTED} fontWeight={600} sx={{ mt: 0.3 }}>
      {label}
    </Typography>
    {deltaLabel && (
      <Typography variant="caption" color="text.secondary">{deltaLabel}</Typography>
    )}
  </Paper>
);

const QuickAction = ({ icon, label, onClick, color }) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 2.5, borderRadius: 3, border: `1px solid ${BORDER}`, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 1.5,
      transition: 'all 0.2s ease',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.07)', borderColor: `${TEAL}40` },
    }}
  >
    <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
    </Box>
    <Typography variant="body2" fontWeight={700} color={NAVY}>{label}</Typography>
    <ArrowForwardIcon sx={{ ml: 'auto', fontSize: 18, color: '#C0C8D4' }} />
  </Paper>
);

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ patients: [], doctors: [], hospitals: [], appointments: [], reviews: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [patients, doctors, hospitals, appointments, reviews] = await Promise.all([
          userService.listUsers({ role: 'PATIENT' }).catch(() => []),
          doctorService.getAllAdmin().catch(() => []),
          hospitalService.getAllWithInactive().catch(() => []),
          appointmentService.getAllAdmin().catch(() => []),
          doctorService.getAllReviewsAdmin().catch(() => []),
        ]);
        setData({
          patients: Array.isArray(patients) ? patients : [],
          doctors: Array.isArray(doctors) ? doctors : [],
          hospitals: Array.isArray(hospitals) ? hospitals : [],
          appointments: Array.isArray(appointments) ? appointments : [],
          reviews: Array.isArray(reviews) ? reviews : [],
        });
      } catch (err) {
        console.error('Failed to load admin dashboard', err);
        setError('Unable to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    const pendingDoctors = data.doctors.filter(d => d.verificationStatus === 'PENDING');
    const pendingAppointments = data.appointments.filter(a => a.status === 'PENDING');
    return {
      patients: data.patients.length,
      patientsToday: data.patients.filter(p => isToday(p.createdAt)).length,
      doctors: data.doctors.length,
      doctorsToday: data.doctors.filter(d => isToday(d.createdAt)).length,
      hospitals: data.hospitals.length,
      appointments: data.appointments.length,
      pendingDoctors: pendingDoctors.length,
      pendingAppointments: pendingAppointments.length,
    };
  }, [data]);

  const recentDoctors = useMemo(
    () => [...data.doctors].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [data.doctors]
  );
  const recentPatients = useMemo(
    () => [...data.patients].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [data.patients]
  );
  const recentAppointments = useMemo(
    () => [...data.appointments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [data.appointments]
  );
  const recentReviews = useMemo(
    () => [...data.reviews].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [data.reviews]
  );
  const pendingDoctors = useMemo(
    () => data.doctors.filter(d => d.verificationStatus === 'PENDING').slice(0, 5),
    [data.doctors]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (user?.role !== 'ADMIN') {
    return null; // ProtectedRoute handles this
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} color={NAVY}>
          Welcome, Admin 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
          Here&apos;s what&apos;s happening with MediFind today.
        </Typography>
      </Box>

      {error && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #FECACA', bgcolor: '#FEF2F2' }}>
          <Typography variant="body2" color="#B91C1C">{error}</Typography>
        </Paper>
      )}

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<PeopleAltIcon />} label="Total Patients" value={stats.patients} delta={stats.patientsToday} color="#0F766E" onClick={() => navigate('/admin/patients')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<MedicalServicesIcon />} label="Total Doctors" value={stats.doctors} delta={stats.doctorsToday} color="#0891B2" onClick={() => navigate('/admin/doctors')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<LocalHospitalIcon />} label="Total Hospitals" value={stats.hospitals} color="#7C3AED" onClick={() => navigate('/admin/hospitals')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<EventNoteIcon />} label="Total Appointments" value={stats.appointments} color="#D97706" onClick={() => navigate('/admin/appointments')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<HourglassTopIcon />} label="Pending Doctor Approvals" value={stats.pendingDoctors} color="#B45309" onClick={() => navigate('/admin/doctors')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard icon={<PendingActionsIcon />} label="Pending Appointments" value={stats.pendingAppointments} color="#BE185D" onClick={() => navigate('/admin/appointments')} />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" fontWeight={800} color={NAVY} sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Manage Patients', icon: <PeopleAltIcon />, path: '/admin/patients', color: '#0F766E' },
          { label: 'Manage Doctors', icon: <MedicalServicesIcon />, path: '/admin/doctors', color: '#0891B2' },
          { label: 'Approve Doctors', icon: <HourglassTopIcon />, path: '/admin/doctors', color: '#B45309' },
          { label: 'Manage Hospitals', icon: <LocalHospitalIcon />, path: '/admin/hospitals', color: '#7C3AED' },
          { label: 'View Appointments', icon: <EventNoteIcon />, path: '/admin/appointments', color: '#D97706' },
          { label: 'Manage Reviews', icon: <PendingActionsIcon />, path: '/admin/reviews', color: '#BE185D' },
        ].map((a) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.label}>
            <QuickAction {...a} onClick={() => navigate(a.path)} />
          </Grid>
        ))}
      </Grid>

      {/* Recent activity */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${BORDER}`, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={800} color={NAVY}>Pending Doctor Approvals</Typography>
              <Button size="small" onClick={() => navigate('/admin/doctors')} sx={{ color: TEAL, textTransform: 'none', fontWeight: 700 }}>
                View all
              </Button>
            </Box>
            {pendingDoctors.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No pending doctor approvals. 🎉</Typography>
            ) : (
              pendingDoctors.map((d) => (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                  <Avatar src={d.profileImage} sx={{ width: 40, height: 40, bgcolor: TEAL }}>
                    {(d.doctorName || 'D').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color={NAVY} noWrap>Dr. {(d.doctorName || '').replace(/^Dr\.?\s+/i, '')}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {(d.specialization || '').replace(/_/g, ' ')} · {[d.clinicName, d.city].filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                  <Button size="small" variant="contained" onClick={() => navigate('/admin/doctors')}
                    sx={{ textTransform: 'none', borderRadius: 2, bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' } }}>
                    Review
                  </Button>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${BORDER}`, height: '100%' }}>
            <Typography variant="h6" fontWeight={800} color={NAVY} sx={{ mb: 2 }}>Recent Appointments</Typography>
            {recentAppointments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No appointments yet.</Typography>
            ) : (
              recentAppointments.map((a) => (
                <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color={NAVY} noWrap>
                      {a.doctor?.doctorName || `Doctor #${a.doctorId}`} — {a.user?.fullName || `Patient #${a.userId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(a.appointmentDate)} · {a.appointmentTime}
                    </Typography>
                  </Box>
                  <StatusChip status={a.status} />
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${BORDER}`, height: '100%' }}>
            <Typography variant="h6" fontWeight={800} color={NAVY} sx={{ mb: 2 }}>Recent Doctor Registrations</Typography>
            {recentDoctors.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No doctors registered yet.</Typography>
            ) : (
              recentDoctors.map((d) => (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                  <Avatar src={d.profileImage} sx={{ width: 40, height: 40, bgcolor: '#0891B2' }}>
                    {(d.doctorName || 'D').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color={NAVY} noWrap>Dr. {(d.doctorName || '').replace(/^Dr\.?\s+/i, '')}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{(d.specialization || '').replace(/_/g, ' ')} · Registered {formatDate(d.createdAt)}</Typography>
                  </Box>
                  <StatusChip status={d.verificationStatus} />
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${BORDER}`, height: '100%' }}>
            <Typography variant="h6" fontWeight={800} color={NAVY} sx={{ mb: 2 }}>Recent Reviews</Typography>
            {recentReviews.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No reviews yet.</Typography>
            ) : (
              recentReviews.map((r) => (
                <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color={NAVY} noWrap>
                      {r.patientName || `Patient #${r.userId}`} → {r.doctorName || `Doctor #${r.doctorId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">★ {r.rating} · {formatDate(r.createdAt)}</Typography>
                  </Box>
                  <StatusChip status={r.status} />
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: BORDER }} />
    </Box>
  );
};

export default AdminDashboard;
