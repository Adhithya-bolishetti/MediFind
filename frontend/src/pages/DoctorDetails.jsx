import { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Button, Divider, CircularProgress,
  Alert, TextField, Rating, Chip, MenuItem,
} from '@mui/material';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import doctorService from '../services/doctorService';
import appointmentService from '../services/appointmentService';
import reviewService from '../services/reviewService';
import api from '../services/api';

const TEAL = '#079A9A';
const DARK = 'var(--mf-text)';
const MUTED = 'var(--mf-muted)';
const BORDER = 'var(--mf-border)';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: 'var(--mf-card)',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: TEAL },
    '&.Mui-focused fieldset': { borderColor: TEAL, borderWidth: '1.5px' },
  },
};

const titleCase = (s) => (s || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatSlot = (slot) => {
  const [hh, mm] = slot.split(':').map(Number);
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${suffix}`;
};

const formatReviewDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [date, setDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Review state
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [eligibleAppointment, setEligibleAppointment] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const { register: registerReview, handleSubmit: handleSubmitReview, setValue: setReviewValue, watch: watchReview, reset: resetReview, formState: { errors: reviewErrors } } = useForm({
    defaultValues: { rating: 5, comment: '' },
  });
  const ratingValue = watchReview('rating');

  // Local calendar date (avoid the UTC shift that can move the min date back a day).
  const todayStr = (() => {
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  })();

  // Consultation type — sent with the booking. "Online" is what unlocks the
  // video consultation room once the doctor accepts.
  const [consultationType, setConsultationType] = useState('In-person');

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const [docData, revData] = await Promise.all([
          doctorService.getById(id),
          reviewService.getByDoctorId(id),
        ]);
        setDoctor(docData);
        setReviews(Array.isArray(revData) ? revData : []);
      } catch (err) {
        console.error('Failed to fetch doctor details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, [id]);

  // Fetch slots when the date changes
  useEffect(() => {
    let cancelled = false;
    const fetchSlots = async () => {
      if (!date) return;
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const res = await doctorService.getAvailableSlots(id, date);
        if (!cancelled) setSlots(Array.isArray(res.slots) ? res.slots : []);
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setBookingError('Unable to load available slots. Please try again.');
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, [date, id]);

  // Determine whether the logged-in patient may review this doctor
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user || user.role !== 'PATIENT') return;
      setCheckingEligibility(true);
      try {
        const res = await api.get(`/appointments/user/${user.id}`);
        const appts = Array.isArray(res.data) ? res.data : [];
        const completed = appts.find(
          (a) => a.doctorId === parseInt(id, 10) && a.status === 'COMPLETED'
        );
        setEligibleAppointment(completed || null);
        setAlreadyReviewed(reviews.some((r) => r.userId === user.id));
      } catch (err) {
        console.error('Failed to check review eligibility', err);    } finally {
      setCheckingEligibility(false);
    }
  };
  checkEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, reviews]);

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (sortBy === 'highest') return list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'lowest') return list.sort((a, b) => a.rating - b.rating);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reviews, sortBy]);

  const visibleReviews = showAllReviews ? sortedReviews : sortedReviews.slice(0, 3);

  const onBook = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/doctors/${id}` } });
      return;
    }
    const missing = [];
    if (!date) missing.push('a date');
    if (!selectedSlot) missing.push('an available time slot');
    if (!reason.trim()) missing.push('a reason for visit');
    if (missing.length) {
      setBookingError(`Please select ${missing.join(', ')}.`);
      return;
    }

    setBooking(true);
    setBookingError('');
    try {
      await appointmentService.book({
        doctorId: parseInt(id, 10),
        appointmentDate: date,
        appointmentTime: selectedSlot,
        reason: reason.trim(),
        consultationType,
      });
      showToast('Appointment booked successfully!');
      navigate('/appointments');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 409) {
        setBookingError('Appointment slot is no longer available. Please pick another time.');
        // refresh slots so the booked slot disappears
        try {
          const res = await doctorService.getAvailableSlots(id, date);
          setSlots(Array.isArray(res.slots) ? res.slots : []);
        } catch { /* keep current slots */ }
      } else {
        setBookingError(msg || 'Unable to book the appointment. Please try again.');
      }
    } finally {
      setBooking(false);
    }
  };

  const onSubmitReview = async (data) => {
    if (!user) {
      navigate('/login', { state: { from: `/doctors/${id}` } });
      return;
    }
    if (!eligibleAppointment) {
      setReviewError('You can review this doctor after a completed appointment.');
      return;
    }
    setReviewing(true);
    setReviewError('');
    try {
      const newReview = await reviewService.submitReview(id, {
        appointmentId: eligibleAppointment.id,
        rating: data.rating,
        comment: data.comment,
        recommendation: data.rating >= 4,
      });
      setReviews([...reviews, newReview]);
      setAlreadyReviewed(true);
      showToast('Review submitted successfully!');
      resetReview();
      // Refresh the doctor summary so the average rating / counts update.
      try {
        const docData = await doctorService.getById(id);
        setDoctor(docData);
      } catch { /* keep current data */ }
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg && /already exists/i.test(msg)) {
        setReviewError('You have already reviewed this appointment.');
        setAlreadyReviewed(true);
      } else {
        setReviewError(msg || 'Failed to submit review. Please try again.');
      }
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (!doctor) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="h6">Doctor not found.</Typography>
        <Button variant="contained" sx={{ mt: 3, bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' } }} onClick={() => navigate('/doctors')}>
          Browse Doctors
        </Button>
      </Box>
    );
  }

  const doctorName = (doctor.doctorName || 'Doctor').replace(/^Dr\.?\s+/i, '');
  const spec = titleCase(doctor.specialization || doctor.specialty);
  const rating = doctor.rating || 0;
  const totalReviews = doctor.totalReviews || reviews.length || 0;
  const dist = doctor.ratingDistribution || {};

  return (
    <Box sx={{ pb: 8, pt: 4, background: 'var(--mf-bg)', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>
          {/* Doctor info card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', maxWidth: 340, flexShrink: 0, margin: '0 auto', marginBottom: 0 }}
          >
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid var(--mf-border)', textAlign: 'center' }}>
              <Avatar
                src={doctor.profileImage || `https://i.pravatar.cc/150?u=doc${doctor.id}`}
                sx={{ width: 130, height: 130, mx: 'auto', mb: 2.5, border: '4px solid #E0F2F1' }}
              />
              <Typography variant="h5" fontWeight={800} color={DARK} gutterBottom>
                Dr. {doctorName}
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: TEAL, mb: 1.5 }}>
                {spec || 'Doctor'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} gap={1} mb={1.5}>
                <StarIcon sx={{ color: '#F59E0B' }} />
                <Typography variant="h6" fontWeight={800} color={DARK}>
                  {rating > 0 ? rating.toFixed(1) : 'New'}
                </Typography>
                {totalReviews > 0 && (
                  <Typography variant="body2" color="text.secondary">({totalReviews} reviews)</Typography>
                )}
              </Box>
              {doctor.experience != null && doctor.experience > 0 && (
                <Typography variant="body2" color={MUTED} sx={{ mb: 1 }}>
                  {doctor.experience} Years Experience
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} gap={0.6} mb={1.5}>
                <LocationOnIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                <Typography variant="body2" color={MUTED}>
                  {[doctor.clinicName, doctor.city, doctor.state].filter(Boolean).join(', ') || 'Location not provided'}
                </Typography>
              </Box>
              {doctor.consultationFee > 0 && (
                <Typography variant="body2" fontWeight={700} color={DARK} sx={{ mb: 1 }}>
                  ₹{doctor.consultationFee} consultation fee
                </Typography>
              )}
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1.5} mb={1.5}>
                <SchoolIcon sx={{ color: '#9CA3AF' }} />
                <Typography variant="body2" color={MUTED} sx={{ textAlign: 'left' }}>
                  {doctor.qualification || 'Qualification not provided'}
                </Typography>
              </Box>
              {doctor.about && (
                <Typography variant="body2" color={MUTED} sx={{ mt: 2, textAlign: 'left' }}>
                  {doctor.about}
                </Typography>
              )}
            </Paper>
          </motion.div>

          {/* Booking + reviews */}
          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
            {/* ─────────── Booking ─────────── */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 4 }}>
                <Typography variant="h5" fontWeight={800} color={DARK} gutterBottom>
                  Book an Appointment
                </Typography>
                <Typography variant="body2" color={MUTED} mb={3}>
                  Select a date to see Dr. {doctorName}&apos;s available slots.
                </Typography>

                {bookingError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{bookingError}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                  <TextField
                    type="date"
                    label="Appointment Date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayStr } }}
                    sx={{ ...inputSx, flex: { sm: 1 } }}
                  />
                  <TextField
                    select
                    label="Consultation"
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value)}
                    sx={{ ...inputSx, flex: { sm: 1 } }}
                  >
                    <MenuItem value="In-person">In-person</MenuItem>
                    <MenuItem value="Online">Online</MenuItem>
                  </TextField>
                </Box>

                <Typography variant="subtitle2" fontWeight={700} color={DARK} mb={1}>
                  Available Time Slots
                </Typography>
                {!date ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Select a date above to see available slots.
                  </Typography>
                ) : slotsLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }} gap={2} py={2}>
                    <CircularProgress size={20} sx={{ color: TEAL }} />
                    <Typography variant="body2" color="text.secondary">Loading slots...</Typography>
                  </Box>
                ) : slots.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No slots available for this date. Please pick another day.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {slots.map((slot) => {
                      const active = selectedSlot === slot;
                      return (
                        <Box
                          key={slot}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedSlot(slot)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedSlot(slot);
                            }
                          }}
                          sx={{
                            px: 2, py: 1.1, borderRadius: 2, cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: active ? TEAL : BORDER,
                            bgcolor: active ? 'rgba(7,154,154,0.08)' : '#fff',
                            color: active ? TEAL : DARK,
                            fontWeight: 600, fontSize: '0.875rem',
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: TEAL },
                            '&:focus-visible': { outline: '2px solid rgba(7,154,154,0.5)', outlineOffset: 2 },
                          }}
                        >
                          {formatSlot(slot)}
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason for Visit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  slotProps={{ inputLabel: { shrink: Boolean(reason) } }}
                  sx={{ ...inputSx, mb: 3 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={booking}
                  onClick={onBook}
                  sx={{
                    py: 1.6, borderRadius: 2.5, fontSize: '1rem', fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: TEAL,
                    boxShadow: '0 6px 16px rgba(7,154,154,0.3)',
                    '&:hover': { bgcolor: '#068A8A' },
                    '&:disabled': { bgcolor: '#9CCFCF', color: '#fff' },
                  }}
                >
                  {booking ? 'Booking...' : (user ? 'Confirm Appointment' : 'Sign in to Book')}
                </Button>
              </Paper>
            </motion.div>

            {/* ─────────── Reviews ─────────── */}
            <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid var(--mf-border)' }}>
              <Typography variant="h5" fontWeight={800} color={DARK} gutterBottom>
                Patient Reviews
              </Typography>

              {/* Rating summary */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 3, md: 5 }, mb: 4, p: 3, bgcolor: '#F3FAF8', borderRadius: 3, flexWrap: 'wrap' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" fontWeight={800} sx={{ color: TEAL, lineHeight: 1 }}>
                    {rating > 0 ? rating.toFixed(1) : '—'}
                  </Typography>
                  <Rating value={rating} readOnly precision={0.1} sx={{ mt: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = dist[`rating${star}`] || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <Box key={star} sx={{ display: 'flex', alignItems: 'center' }} gap={1} mb={0.6}>
                        <Typography variant="body2" sx={{ width: 14, fontWeight: 600 }}>{star}</Typography>
                        <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                        <Box sx={{ flex: 1, height: 8, bgcolor: '#E5E9F0', borderRadius: 4, overflow: 'hidden' }}>
                          <Box height="100%" width={`${percentage}%`} bgcolor={TEAL} />
                        </Box>
                        <Typography variant="body2" sx={{ width: 24, textAlign: 'right', color: MUTED }}>{count}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} mb={2}>
                <Typography variant="h6" fontWeight={700} color={DARK}>All Reviews</Typography>
                <TextField
                  select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  sx={{ minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="highest">Highest Rating</MenuItem>
                  <MenuItem value="lowest">Lowest Rating</MenuItem>
                </TextField>
              </Box>

              {sortedReviews.length === 0 ? (
                <Typography variant="body2" color="text.secondary" mb={3}>
                  No reviews yet for this doctor.
                </Typography>
              ) : (
                <Box sx={{ mb: 3 }}>
                  {visibleReviews.map((review) => (
                    <Box key={review.id} sx={{ py: 2, borderBottom: '1px solid var(--mf-border)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1.5} mb={0.5}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: TEAL, fontSize: '0.85rem' }}>
                          {(review.patientName || 'P').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700} color={DARK}>
                            {review.patientName || `Patient #${review.userId}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatReviewDate(review.createdAt)}
                          </Typography>
                        </Box>
                        <Rating value={review.rating} readOnly size="small" />
                      </Box>
                      <Typography variant="body2" color={MUTED} sx={{ pl: 5.5 }}>
                        {review.comment || 'No comment provided.'}
                      </Typography>
                    </Box>
                  ))}
                  {sortedReviews.length > 3 && (
                    <Button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      sx={{ mt: 1, color: TEAL, fontWeight: 700, textTransform: 'none' }}
                    >
                      {showAllReviews ? 'Show Less' : `View all ${sortedReviews.length} reviews`}
                    </Button>
                  )}
                </Box>
              )}

              {/* Review form — only for a patient with a completed appointment who hasn't reviewed yet */}
              {user && user.role === 'PATIENT' && (
                checkingEligibility ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }} gap={2} py={2}>
                    <CircularProgress size={20} sx={{ color: TEAL }} />
                    <Typography variant="body2" color="text.secondary">Checking review eligibility...</Typography>
                  </Box>
                ) : alreadyReviewed ? (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    You have already reviewed this doctor. Thank you!
                  </Alert>
                ) : eligibleAppointment ? (
                  <Box component="form" onSubmit={handleSubmitReview(onSubmitReview)} sx={{ mt: 2 }}>
                    <Typography variant="h6" fontWeight={700} color={DARK} gutterBottom>
                      Leave a Review
                    </Typography>
                    {reviewError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{reviewError}</Alert>}

                    <Box mb={1.5}>
                      <Typography component="legend" variant="subtitle2" fontWeight={600} color={DARK}>
                        Rating
                      </Typography>
                      <Rating
                        name="rating"
                        value={ratingValue}
                        size="large"
                        onChange={(event, newValue) => setReviewValue('rating', newValue)}
                      />
                    </Box>
                    <TextField
                      fullWidth multiline rows={3}
                      label="Share your experience"
                      {...registerReview('comment', { required: 'Comment is required' })}
                      error={!!reviewErrors.comment}
                      helperText={reviewErrors.comment?.message}
                      slotProps={{ inputLabel: { shrink: Boolean(watchReview('comment')) } }}
                      sx={inputSx}
                    />
                    <Button
                      type="submit" variant="contained" disabled={reviewing}
                      sx={{
                        mt: 2, px: 4, py: 1.2, borderRadius: 2.5, textTransform: 'none', fontWeight: 700,
                        bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' },
                        '&:disabled': { bgcolor: '#9CCFCF', color: '#fff' },
                      }}
                    >
                      {reviewing ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    You can review this doctor after a completed appointment.
                  </Alert>
                )
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DoctorDetails;
