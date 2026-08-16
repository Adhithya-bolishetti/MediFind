import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Alert, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import EmailIcon from '@mui/icons-material/Email';
import StarIcon from '@mui/icons-material/Star';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EmergencyIcon from '@mui/icons-material/Emergency';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LanguageIcon from '@mui/icons-material/Language';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RateReviewIcon from '@mui/icons-material/RateReview';
import hospitalService from '../services/hospitalService';
import api from '../services/api';
import doctorService from '../services/doctorService';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

const StarRating = ({ value, onChange, size = 34 }) => (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <IconButton
        key={n}
        onClick={() => onChange?.(n)}
        disabled={!onChange}
        sx={{ p: 0 }}
      >
        <StarIcon sx={{ fontSize: size, color: n <= (value || 0) ? '#F59E0B' : 'var(--mf-border)' }} />
      </IconButton>
    ))}
  </Box>
);

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '—';
  }
};

const HospitalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [lightbox, setLightbox] = useState(null);
  const [ambulanceConfirm, setAmbulanceConfirm] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewError, setReviewError] = useState('');

  const [eligibleAppointments, setEligibleAppointments] = useState([]);
  const [reviewForm, setReviewForm] = useState({ appointmentId: '', rating: 0, reviewText: '' });
  const [submitting, setSubmitting] = useState(false);

  const images = hospital?.images || [];

  useEffect(() => {
    const load = async () => {
      try {
        const h = await hospitalService.getById(id);
        setHospital(h);
        const revs = await hospitalService.getReviews(id);
        setReviews(Array.isArray(revs) ? revs : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Hospital not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Build the list of completed appointments whose doctor belongs to this hospital.
  const loadEligibleAppointments = async () => {
    if (!user || user.role !== 'PATIENT') return;
    setReviewError('');
    try {
      const apptsRes = await api.get(`/appointments/user/${user.id}`);
      const completed = (apptsRes.data || []).filter((a) => a.status === 'COMPLETED');
      const eligible = [];
      for (const appt of completed) {
        try {
          const doc = await doctorService.getById(appt.doctorId);
          if (doc && doc.hospitalId && Number(doc.hospitalId) === Number(id)) {
            eligible.push({ ...appt, doctorName: doc.doctorName });
          }
        } catch { /* skip */ }
      }
      setEligibleAppointments(eligible);
      setReviewForm((f) => ({ ...f, appointmentId: eligible[0]?.id || '' }));
    } catch (err) {
      setReviewError('Unable to check your appointment eligibility.');
    }
  };

  const openReview = () => {
    setReviewOpen(true);
    loadEligibleAppointments();
  };

  const submitReview = async () => {
    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewError('Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!reviewForm.appointmentId) {
      setReviewError('Please select an appointment to attach this review to.');
      return;
    }
    setSubmitting(true);
    setReviewError('');
    try {
      await hospitalService.createReview(id, {
        appointmentId: Number(reviewForm.appointmentId),
        rating: reviewForm.rating,
        reviewText: reviewForm.reviewText || null,
      });
      showToast('Review submitted successfully!');
      setReviewOpen(false);
      setReviewForm({ appointmentId: '', rating: 0, reviewText: '' });
      const revs = await hospitalService.getReviews(id);
      setReviews(Array.isArray(revs) ? revs : []);
      const h = await hospitalService.getById(id);
      setHospital(h);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Unable to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const placeAmbulanceCall = () => {
    if (!hospital?.ambulancePhone) return;
    window.location.href = `tel:${hospital.ambulancePhone}`;
    setAmbulanceConfirm(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (error || !hospital) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', py: 10 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>{error || 'Hospital not found.'}</Typography>
        <Button sx={{ color: TEAL, textTransform: 'none' }} onClick={() => navigate('/hospitals')}>← Back to hospitals</Button>
      </Box>
    );
  }

  const facilities = (hospital.facilities || '').split(',').map((f) => f.trim()).filter(Boolean);
  const specialties = (hospital.specialties || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      <Box mb={2}>
        <Button startIcon={<ChevronLeftIcon />} onClick={() => navigate('/hospitals')} sx={{ color: 'var(--mf-muted)', textTransform: 'none', fontWeight: 600 }}>
          Back to hospitals
        </Button>
      </Box>

      {/* Gallery */}
      <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid var(--mf-border)', mb: 3 }}>
        {images.length === 0 ? (
          <Box sx={{ height: { xs: 220, md: 380 }, bgcolor: 'var(--mf-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <LocalHospitalIcon sx={{ fontSize: 90, color: 'var(--mf-border)' }} />
            <Typography variant="body2" color="text.secondary" mt={1}>No hospital images uploaded yet.</Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{ position: 'relative', height: { xs: 240, md: 400 }, bgcolor: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setLightbox(0)}
            >
              <Box
                component="img"
                src={images[0].imageUrl}
                alt={hospital.hospitalName}
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
            {images.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, p: 1.5, bgcolor: 'var(--mf-surface)', flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <Box
                    key={img.id}
                    component="img"
                    src={img.imageUrl}
                    alt={`Gallery ${i + 1}`}
                    onClick={() => setLightbox(i)}
                    sx={{
                      width: 84, height: 64, objectFit: 'cover', borderRadius: 2, cursor: 'pointer',
                      border: i === 0 ? `2px solid ${TEAL}` : '1px solid var(--mf-border)',
                      '&:hover': { opacity: 0.85 },
                    }}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Header */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="h4" fontWeight={800} color={NAVY}>{hospital.hospitalName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                  {hospital.hospitalType}{hospital.operatingHours ? ` · ${hospital.operatingHours}` : ''}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 17, color: 'var(--mf-muted)' }} />
                  <Typography variant="body2" color="text.secondary">
                    {[hospital.address, hospital.city, hospital.state, hospital.pincode].filter(Boolean).join(', ')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                  <StarRating value={hospital.rating || 0} size={22} />
                  <Typography variant="body1" fontWeight={800} color="#F59E0B">
                    {hospital.rating > 0 ? hospital.rating.toFixed(1) : 'New'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({hospital.totalReviews || 0} reviews)
                  </Typography>
                  {hospital.emergencyAvailable && (
                    <Chip icon={<EmergencyIcon sx={{ fontSize: 14 }} />} label="24×7 Emergency" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.7rem' }} />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 220 }}>
                {hospital.ambulanceAvailable && hospital.ambulancePhone ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<LocalTaxiIcon />}
                    onClick={() => setAmbulanceConfirm(true)}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, boxShadow: '0 6px 18px rgba(220,38,38,0.35)', fontSize: '0.95rem' }}
                  >
                    🚑 Call Ambulance
                  </Button>
                ) : (
                  <Chip label="Ambulance unavailable" sx={{ bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)', color: 'var(--mf-muted)', fontWeight: 600 }} />
                )}
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<LocalPhoneIcon />}
                  onClick={() => { if (hospital.phoneNumber) window.location.href = `tel:${hospital.phoneNumber}`; }}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: 'var(--mf-border)', color: NAVY, '&:hover': { borderColor: TEAL, color: TEAL } }}
                >
                  Contact Hospital
                </Button>
                {user?.role === 'PATIENT' && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<RateReviewIcon />}
                    onClick={openReview}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: TEAL, color: TEAL, '&:hover': { bgcolor: 'rgba(7,154,154,0.06)' } }}
                  >
                    Write Review
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          {/* About */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 3 }}>
            <Typography variant="h6" fontWeight={800} color={NAVY} mb={1.5}>About</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {hospital.description || 'No description provided by this hospital yet.'}
            </Typography>

            {facilities.length > 0 && (
              <>
                <Typography variant="h6" fontWeight={800} color={NAVY} mb={1} mt={3}>Facilities</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {facilities.map((f, i) => (
                    <Chip key={i} label={f} sx={{ bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)', color: NAVY, fontWeight: 600, fontSize: '0.78rem' }} />
                  ))}
                </Box>
              </>
            )}
            {specialties.length > 0 && (
              <>
                <Typography variant="h6" fontWeight={800} color={NAVY} mb={1} mt={3}>Specialties</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {specialties.map((s, i) => (
                    <Chip key={i} label={s} sx={{ bgcolor: `${TEAL}12`, color: TEAL, fontWeight: 700, fontSize: '0.78rem' }} />
                  ))}
                </Box>
              </>
            )}
          </Paper>

          {/* Reviews */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={800} color={NAVY}>Patient Reviews</Typography>
              {user?.role === 'PATIENT' && (
                <Button size="small" startIcon={<RateReviewIcon />} onClick={openReview} sx={{ color: TEAL, textTransform: 'none', fontWeight: 700 }}>
                  Write Review
                </Button>
              )}
            </Box>
            {reviews.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No reviews yet. Be the first to review this hospital.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reviews.map((r) => (
                  <Box key={r.id} sx={{ p: 2, borderRadius: 3, bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                      <StarRating value={r.rating} size={18} />
                      <Typography variant="caption" color="text.secondary">{formatDate(r.createdAt)}</Typography>
                    </Box>
                    {r.reviewText ? (
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{r.reviewText}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No written review.</Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Contact sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
            <Typography variant="h6" fontWeight={800} color={NAVY} mb={2}>Contact Information</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalPhoneIcon sx={{ fontSize: 19, color: TEAL }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Phone</Typography>
                  <Typography variant="body2" fontWeight={600} color={NAVY}>{hospital.phoneNumber}</Typography>
                </Box>
              </Box>
              {hospital.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 19, color: TEAL }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                    <Typography variant="body2" fontWeight={600} color={NAVY}>{hospital.email}</Typography>
                  </Box>
                </Box>
              )}
              {hospital.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LanguageIcon sx={{ fontSize: 19, color: TEAL }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Website</Typography>
                    <Typography variant="body2" fontWeight={600} color={NAVY} noWrap>
                      <Box component="a" href={hospital.website} target="_blank" rel="noreferrer" sx={{ color: TEAL, textDecoration: 'none' }}>
                        {hospital.website.replace(/^https?:\/\//, '')}
                      </Box>
                    </Typography>
                  </Box>
                </Box>
              )}
              {hospital.operatingHours && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 19, color: TEAL }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Operating Hours</Typography>
                    <Typography variant="body2" fontWeight={600} color={NAVY}>{hospital.operatingHours}</Typography>
                  </Box>
                </Box>
              )}
              {hospital.ambulanceAvailable && hospital.ambulancePhone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalTaxiIcon sx={{ fontSize: 19, color: '#DC2626' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Ambulance</Typography>
                    <Typography variant="body2" fontWeight={600} color={NAVY}>{hospital.ambulancePhone}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Lightbox */}
      <Dialog open={lightbox !== null} onClose={() => setLightbox(null)} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: '#0F172A' } }}>
        {lightbox !== null && images[lightbox] && (
          <>
            <IconButton onClick={() => setLightbox(null)} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
              <CloseIcon />
            </IconButton>
            <Box sx={{ position: 'relative', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box component="img" src={images[lightbox].imageUrl} alt={`Hospital image ${lightbox + 1}`} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, p: 1.5 }}>
              <IconButton disabled={lightbox === 0} onClick={() => setLightbox((p) => p - 1)} sx={{ color: '#fff' }}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography sx={{ color: '#fff', alignSelf: 'center' }}>{lightbox + 1} / {images.length}</Typography>
              <IconButton disabled={lightbox === images.length - 1} onClick={() => setLightbox((p) => p + 1)} sx={{ color: '#fff' }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Dialog>

      {/* Ambulance confirm */}
      <Dialog open={ambulanceConfirm} onClose={() => setAmbulanceConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalTaxiIcon sx={{ color: '#DC2626' }} /> Call Ambulance?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Call ambulance for <strong style={{ color: NAVY }}>{hospital.hospitalName}</strong>?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, bgcolor: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}>
            <LocalPhoneIcon sx={{ color: TEAL, fontSize: 20 }} />
            <Typography variant="body1" fontWeight={800} color={NAVY}>{hospital.ambulancePhone}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setAmbulanceConfirm(false)} sx={{ textTransform: 'none', color: 'var(--mf-muted)' }}>Cancel</Button>
          <Button variant="contained" onClick={placeAmbulanceCall} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
            Call
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review form */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Write a Review</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Review {hospital.hospitalName} based on your completed appointment.
          </Typography>

          {reviewError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{reviewError}</Alert>}

          {eligibleAppointments.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              You can review this hospital after a completed appointment with one of its doctors.
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle2" fontWeight={700} color={NAVY} mb={0.75}>Your Rating</Typography>
              <StarRating value={reviewForm.rating} onChange={(n) => setReviewForm((f) => ({ ...f, rating: n }))} size={40} />
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {reviewForm.rating > 0 ? `${reviewForm.rating} out of 5` : 'Tap a star to rate'}
              </Typography>

              <Typography variant="subtitle2" fontWeight={700} color={NAVY} mb={0.75}>Appointment</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <InputLabel>Select appointment</InputLabel>
                <Select
                  value={reviewForm.appointmentId || ''}
                  label="Select appointment"
                  onChange={(e) => setReviewForm((f) => ({ ...f, appointmentId: e.target.value }))}
                >
                  {eligibleAppointments.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {new Date(a.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {a.appointmentTime} · Dr. {(a.doctorName || '').replace(/^Dr\.?\s+/i, '')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle2" fontWeight={700} color={NAVY} mb={0.75}>
                Written Review <Box component="span" sx={{ color: 'var(--mf-muted)', fontWeight: 400 }}>(Optional)</Box>
              </Typography>
              <Box
                component="textarea"
                rows={4}
                placeholder="Share your experience..."
                value={reviewForm.reviewText}
                onChange={(e) => setReviewForm((f) => ({ ...f, reviewText: e.target.value }))}
                sx={{
                  width: '100%', p: 1.5, borderRadius: 2.5, border: '1px solid var(--mf-border)',
                  bgcolor: 'var(--mf-input)', color: 'var(--mf-text)', fontSize: '0.9rem', fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none', '&:focus': { borderColor: TEAL },
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setReviewOpen(false)} sx={{ textTransform: 'none', color: 'var(--mf-muted)' }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={submitting || eligibleAppointments.length === 0}
            onClick={submitReview}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' } }}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospitalDetails;
