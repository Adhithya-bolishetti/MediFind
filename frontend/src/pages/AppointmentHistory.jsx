import { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Paper, Chip, CircularProgress, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReviewModal from '../components/ReviewModal';
import api from '../services/api';
import doctorService from '../services/doctorService';
import appointmentService from '../services/appointmentService';
import userService from '../services/userService';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

const statusStyleMap = {
  PENDING: { bg: '#FEF9C3', color: '#A16207' },
  CONFIRMED: { bg: '#DCFCE7', color: '#16A34A' },
  COMPLETED: { bg: '#DBEAFE', color: '#1D4ED8' },
  CANCELLED: { bg: '#FEE2E2', color: '#DC2626' },
  DECLINED: { bg: '#FEE2E2', color: '#DC2626' },
  REJECTED: { bg: '#FEE2E2', color: '#DC2626' },
};

const StatusChip = ({ status }) => {
  const s = statusStyleMap[status] || { bg: 'var(--mf-border)', color: '#6B7280' };
  return (
    <Chip label={status} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
  );
};

const AppointmentHistory = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewType, setReviewType] = useState('doctor');
  const [reviewedStatus, setReviewedStatus] = useState({});

  const [declineTarget, setDeclineTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const [viewProfileAppt, setViewProfileAppt] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const handleOpenReview = (appt, type) => {
    setSelectedAppointment(appt);
    setReviewType(type);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setReviewedStatus(prev => ({
      ...prev,
      [selectedAppointment.id]: {
        ...(prev[selectedAppointment.id] || {}),
        [reviewType]: true,
      },
    }));
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        let targetId = user.id;
        // Doctors are identified by their doctor-profile id in the appointment
        // service, not the auth user id.
        if (user.role === 'DOCTOR') {
          try {
            const profile = await doctorService.getMyProfile();
            if (profile?.id) targetId = profile.id;
          } catch { /* fall back to auth user id */ }
        }

        const endpoint = user.role === 'DOCTOR'
          ? `/appointments/doctor/${targetId}`
          : `/appointments/user/${user.id}`;

        const res = await api.get(endpoint);
        setAppointments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch appointments', err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAppointments();
  }, [user]);

  const updateAppointmentStatus = (id, status) => {
    setAppointments(prev => prev.map(app => (app.id === id ? { ...app, status } : app)));
  };

  const acceptAppointment = async (appt) => {
    setActionLoadingId(appt.id);
    setActionError('');
    try {
      await appointmentService.accept(appt.id, appt.doctorId);
      updateAppointmentStatus(appt.id, 'CONFIRMED');
      showToast('Appointment accepted successfully!');
    } catch (err) {
      const msg = err.response?.data?.message;
      setActionError(msg || 'Failed to accept appointment. Please try again.');
      showToast(msg || 'Failed to accept appointment.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const declineAppointment = async () => {
    if (!declineTarget) return;
    setActionLoadingId(declineTarget.id);
    setActionError('');
    try {
      await appointmentService.decline(declineTarget.id, declineTarget.doctorId);
      updateAppointmentStatus(declineTarget.id, 'DECLINED');
      setDeclineTarget(null);
      showToast('Appointment declined.');
    } catch (err) {
      const msg = err.response?.data?.message;
      setActionError(msg || 'Failed to decline appointment. Please try again.');
      showToast(msg || 'Failed to decline appointment.', 'error');
      setDeclineTarget(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const completeAppointment = async () => {
    if (!completeTarget) return;
    setActionLoadingId(completeTarget.id);
    setActionError('');
    try {
      await appointmentService.complete(completeTarget.id, completeTarget.doctorId);
      updateAppointmentStatus(completeTarget.id, 'COMPLETED');
      setCompleteTarget(null);
      showToast('Appointment marked as completed successfully.');
    } catch (err) {
      const msg = err.response?.data?.message;
      setActionError(msg || 'Failed to mark appointment as completed. Please try again.');
      showToast(msg || 'Failed to mark appointment as completed.', 'error');
      setCompleteTarget(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await api.put(`/appointments/${id}/cancel`);
      updateAppointmentStatus(id, 'CANCELLED');
      showToast('Appointment cancelled.');
    } catch (err) {
      console.error('Failed to cancel appointment', err);
      showToast('Failed to cancel appointment.', 'error');
    }
  };

  const viewPatientProfile = async (appt) => {
    setViewProfileAppt(appt);
    setProfileLoading(true);
    setProfileError('');
    setPatientProfile(null);
    try {
      const data = await userService.getProfile(appt.userId);
      setPatientProfile(data);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Unable to load the patient profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age;
  };

  const profileRows = (p) => [
    ['Email', p.email || '—'],
    ['Phone', p.phone || '—'],
    ['Gender', p.gender || '—'],
    ['Date of Birth', p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
    ['Age', calcAge(p.dateOfBirth) != null ? `${calcAge(p.dateOfBirth)} years` : '—'],
    ['Address', [p.address, p.city, p.state].filter(Boolean).join(', ') || '—'],
    ['Pincode', p.pincode || '—'],
    ['Emergency Contact', p.emergencyContactName ? `${p.emergencyContactName}${p.emergencyContactPhone ? ` (${p.emergencyContactPhone})` : ''}` : '—'],
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color={NAVY}>
          {user.role === 'DOCTOR' ? 'My Schedule' : 'Booked Appointments'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.3}>
          {user.role === 'DOCTOR'
            ? 'Manage your patient appointments.'
            : 'View and manage your booked appointments.'}
        </Typography>
      </Box>

      {actionError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{actionError}</Alert>
      )}

      {appointments.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 4, textAlign: 'center', border: '1px dashed var(--mf-border)' }}>
          <EventIcon sx={{ fontSize: 56, color: 'var(--mf-border)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No appointments found.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.role === 'PATIENT' ? 'Book your first appointment with a doctor.' : 'No appointments in your schedule.'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {appointments.map((appt, index) => {
            const dateObj = new Date(appt.appointmentDate);
            const dateStr = dateObj.toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            });
            const borderColor = appt.status === 'CONFIRMED' ? TEAL
              : appt.status === 'PENDING' ? '#F59E0B'
              : appt.status === 'COMPLETED' ? '#22C55E'
              : '#EF4444';

            return (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid var(--mf-border)',
                    borderLeft: `4px solid ${borderColor}`,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: 2,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.07)' },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1.5} mb={1}>
                      <StatusChip status={appt.status} />
                      <Typography variant="body1" fontWeight={700} color={NAVY}>
                        {dateStr}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }} color="text.secondary">
                      <Box sx={{ display: 'flex', alignItems: 'center' }} gap={0.8}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="body2">{appt.appointmentTime || '—'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }} gap={0.8}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2">
                          {user.role === 'DOCTOR'
                            ? (appt.user?.fullName || `Patient #${appt.userId}`)
                            : (appt.doctor?.doctorName ? `Dr. ${appt.doctor.doctorName.replace(/^Dr\.?\s+/i, '')}` : `Doctor #${appt.doctorId}`)}
                        </Typography>
                      </Box>
                    </Box>

                    {appt.reason && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: '#6B7280' }}>
                        Reason: {appt.reason}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'stretch', md: 'flex-end' } }}>
                    {/* Doctor actions */}
                    {user.role === 'DOCTOR' && (
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={actionLoadingId === appt.id}
                        startIcon={<VisibilityIcon />}
                        onClick={() => viewPatientProfile(appt)}
                        sx={{
                          textTransform: 'none', borderRadius: 2, fontWeight: 600,
                          color: NAVY, borderColor: 'var(--mf-border)',
                          '&:hover': { borderColor: TEAL, color: TEAL, bgcolor: 'rgba(7,154,154,0.06)' },
                        }}
                      >
                        View Profile
                      </Button>
                    )}
                    {user.role === 'DOCTOR' && appt.status === 'PENDING' && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={actionLoadingId === appt.id}
                          startIcon={<CheckCircleIcon />}
                          onClick={() => acceptAppointment(appt)}
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
                          disabled={actionLoadingId === appt.id}
                          startIcon={<CancelIcon />}
                          onClick={() => setDeclineTarget(appt)}
                          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                        >
                          Decline
                        </Button>
                      </Box>
                    )}

                    {/* Doctor actions — accepted appointments can be completed */}
                    {user.role === 'DOCTOR' && appt.status === 'CONFIRMED' && (
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        disabled={actionLoadingId === appt.id}
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setCompleteTarget(appt)}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                      >
                        Completed
                      </Button>
                    )}

                    {/* Patient actions */}
                    {user.role === 'PATIENT' && (appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                      <Button
                        variant="outlined" color="error" size="small"
                        onClick={() => cancelAppointment(appt.id)}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                      >
                        Cancel Appointment
                      </Button>
                    )}

                    {appt.status === 'COMPLETED' && user.role === 'PATIENT' && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant={reviewedStatus[appt.id]?.doctor ? 'text' : 'contained'}
                          size="small"
                          disabled={reviewedStatus[appt.id]?.doctor}
                          onClick={() => handleOpenReview(appt, 'doctor')}
                          sx={{
                            textTransform: 'none', borderRadius: 2, fontWeight: 600,
                            bgcolor: reviewedStatus[appt.id]?.doctor ? undefined : TEAL,
                            '&:hover': { bgcolor: reviewedStatus[appt.id]?.doctor ? undefined : '#068A8A' },
                          }}
                        >
                          {reviewedStatus[appt.id]?.doctor ? 'Doctor Reviewed ✓' : 'Rate Doctor'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Complete confirmation */}
      <Dialog open={!!completeTarget} onClose={() => setCompleteTarget(null)}>
        <DialogTitle>Mark this appointment as completed?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will mark the consultation as completed and notify the patient.
            {completeTarget && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 600, color: NAVY }}>
                {completeTarget.user?.fullName || `Patient #${completeTarget.userId}`} — {completeTarget.appointmentTime} on {completeTarget.appointmentDate?.toString().slice(0, 10)}
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCompleteTarget(null)} disabled={actionLoadingId !== null}>
            Cancel
          </Button>
          <Button
            onClick={completeAppointment}
            variant="contained"
            disabled={actionLoadingId !== null}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' } }}
          >
            {actionLoadingId !== null ? 'Marking...' : 'Mark Completed'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decline confirmation */}
      <Dialog open={!!declineTarget} onClose={() => setDeclineTarget(null)}>
        <DialogTitle>Decline Appointment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to decline this appointment?
            {declineTarget && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 600, color: NAVY }}>
                {declineTarget.user?.fullName || `Patient #${declineTarget.userId}`} — {declineTarget.appointmentTime} on {declineTarget.appointmentDate?.toString().slice(0, 10)}
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeclineTarget(null)} disabled={actionLoadingId !== null}>
            Keep Appointment
          </Button>
          <Button
            onClick={declineAppointment}
            color="error"
            variant="contained"
            disabled={actionLoadingId !== null}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
          >
            {actionLoadingId !== null ? 'Declining...' : 'Decline Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient profile — lets the doctor review the patient before accepting */}
      <Dialog open={!!viewProfileAppt} onClose={() => setViewProfileAppt(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Patient Profile</DialogTitle>
        <DialogContent dividers>
          {profileLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: TEAL }} />
            </Box>
          ) : profileError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{profileError}</Alert>
          ) : patientProfile ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                {patientProfile.profileImage ? (
                  <Box
                    component="img"
                    src={patientProfile.profileImage}
                    alt={patientProfile.fullName}
                    sx={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--mf-border)' }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 64, height: 64, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: 'rgba(7,154,154,0.12)', color: TEAL, fontSize: '1.5rem', fontWeight: 800,
                    }}
                  >
                    {(patientProfile.fullName || 'P').charAt(0).toUpperCase()}
                  </Box>
                )}
                <Box>
                  <Typography variant="h6" fontWeight={800} color={NAVY}>
                    {patientProfile.fullName || `Patient #${viewProfileAppt?.userId}`}
                  </Typography>
                  <Chip label={patientProfile.role || 'PATIENT'} size="small" sx={{ mt: 0.5, bgcolor: 'rgba(7,154,154,0.12)', color: TEAL, fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '12px 24px' }}>
                {profileRows(patientProfile).map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" sx={{ color: 'var(--mf-muted)', fontWeight: 600, display: 'block' }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: NAVY, fontWeight: 500 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewProfileAppt(null)} sx={{ textTransform: 'none', borderRadius: 2, color: 'var(--mf-muted)' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {reviewModalOpen && selectedAppointment && (
        <ReviewModal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          appointment={selectedAppointment}
          type={reviewType}
          onSuccess={handleReviewSuccess}
        />
      )}
    </Box>
  );
};

export default AppointmentHistory;
