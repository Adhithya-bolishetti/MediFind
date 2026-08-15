import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Grid, Paper, Avatar, Button, Divider, CircularProgress, Alert, TextField, Rating, List, ListItem, ListItemAvatar, ListItemText, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../context/AuthContext';
import doctorService from '../services/doctorService';
import appointmentService from '../services/appointmentService';
import reviewService from '../services/reviewService';

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  
  const [sortBy, setSortBy] = useState('recent');
  
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    // default to recent
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const { register: registerBook, handleSubmit: handleSubmitBook, formState: { errors: bookErrors } } = useForm();
  const { register: registerReview, handleSubmit: handleSubmitReview, setValue: setReviewValue, watch: watchReview, reset: resetReview, formState: { errors: reviewErrors } } = useForm({
    defaultValues: { rating: 5, comment: '' }
  });

  const ratingValue = watchReview('rating');

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const [docData, revData] = await Promise.all([
          doctorService.getById(id),
          reviewService.getByDoctorId(id)
        ]);
        setDoctor(docData);
        setReviews(revData);
      } catch (err) {
        console.error("Failed to fetch doctor details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, [id]);

  const onBook = async (data) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setBooking(true);
    setError('');
    setSuccess('');
    
    try {
      await appointmentService.book({
        doctorId: parseInt(id),
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        reason: data.reason
      });
      setSuccess('Appointment booked successfully!');
      setTimeout(() => navigate('/appointments'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setBooking(false);
    }
  };

  const onSubmitReview = async (data) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setReviewing(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const newReview = await reviewService.submitReview(id, data);
      setReviews([...reviews, newReview]);
      setReviewSuccess('Review submitted successfully!');
      resetReview();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review. You may have already reviewed this doctor.');
    } finally {
      setReviewing(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(id, reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!doctor) return <Typography align="center" mt={10}>Doctor not found.</Typography>;

  return (
    <Box sx={{ pb: 8, pt: 4, background: '#f8f9fa', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Paper elevation={2} sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
                <Avatar
                  src={doctor.profileImage || `https://i.pravatar.cc/150?u=${doctor.id}`}
                  sx={{ width: 160, height: 160, mx: 'auto', mb: 3, border: '4px solid #e3f2fd' }}
                />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  Dr. {(doctor.doctorName || 'Doctor').replace(/^Dr\.?\s+/i, '')}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom fontWeight={600}>
                  {(doctor.specialization || doctor.specialty || '').replace(/_/g, ' ')}
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={2}>
                  <StarIcon sx={{ color: '#ffb300' }} />
                  <Typography variant="h6" fontWeight={700}>{doctor.rating > 0 ? doctor.rating : 'New'}</Typography>
                  <Typography variant="body2" color="text.secondary">({doctor.totalReviews || reviews.length} reviews)</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {doctor.experience != null ? `${doctor.experience} Years Experience` : ''}
                </Typography>
                {doctor.city && (
                  <Typography variant="body1" color="text.secondary" paragraph>
                    📍 {doctor.city}{doctor.state ? `, ${doctor.state}` : ''}
                  </Typography>
                )}
                {doctor.consultationFee > 0 && (
                  <Typography variant="body1" color="text.secondary" paragraph>
                    ₹{doctor.consultationFee} consultation fee
                  </Typography>
                )}
                <Divider sx={{ my: 3 }} />
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <SchoolIcon color="action" />
                  <Typography variant="body1">{doctor.qualification || 'Qualification not provided'}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <WorkspacePremiumIcon color="action" />
                  <Typography variant="body1">Medical License: {doctor.medicalLicenseNumber || '—'}</Typography>
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={8}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Paper elevation={2} sx={{ p: 5, borderRadius: 4, mb: 4 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom color="#1a237e">
                  Book an Appointment
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                  Select a date and time to schedule your consultation with Dr. {(doctor.doctorName || 'the doctor').replace(/^Dr\.?\s+/i, '')}.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

                <form onSubmit={handleSubmitBook(onBook)}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Appointment Date"
                        InputLabelProps={{ shrink: true }}
                        {...registerBook("appointmentDate", { required: "Date is required" })}
                        error={!!bookErrors.appointmentDate}
                        helperText={bookErrors.appointmentDate?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Appointment Time"
                        InputLabelProps={{ shrink: true }}
                        {...registerBook("appointmentTime", { required: "Time is required" })}
                        error={!!bookErrors.appointmentTime}
                        helperText={bookErrors.appointmentTime?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Reason for Visit"
                        {...registerBook("reason", { required: "Reason is required" })}
                        error={!!bookErrors.reason}
                        helperText={bookErrors.reason?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={booking || !user}
                        sx={{ 
                          py: 2, 
                          borderRadius: 2, 
                          fontSize: '1.2rem', 
                          fontWeight: 700,
                          textTransform: 'none',
                          background: 'linear-gradient(45deg, #1976d2, #0d47a1)'
                        }}
                      >
                        {booking ? 'Booking...' : (user ? 'Confirm Appointment' : 'Sign in to Book')}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>

              <Paper elevation={2} sx={{ p: 5, borderRadius: 4 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom color="#1a237e">
                  Patient Reviews
                </Typography>
                
                {/* Rating Summary */}
                {doctor.ratingDistribution && (
                  <Box display="flex" alignItems="center" gap={4} mb={4} p={3} bgcolor="#f5f5f5" borderRadius={3}>
                    <Box textAlign="center">
                      <Typography variant="h2" fontWeight={800} color="primary">{doctor.rating}</Typography>
                      <Rating value={doctor.rating} readOnly precision={0.1} />
                      <Typography variant="body2" color="text.secondary">{doctor.totalReviews} Reviews</Typography>
                    </Box>
                    <Box flex={1}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = doctor.ratingDistribution[`rating${star}`] || 0;
                        const percentage = doctor.totalReviews > 0 ? (count / doctor.totalReviews) * 100 : 0;
                        return (
                          <Box key={star} display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography variant="body2" sx={{ width: 12 }}>{star}</Typography>
                            <StarIcon fontSize="small" color="action" />
                            <Box flex={1} height={8} bgcolor="#e0e0e0" borderRadius={4} overflow="hidden">
                              <Box height="100%" width={`${percentage}%`} bgcolor="#ffb300" />
                            </Box>
                            <Typography variant="body2" sx={{ width: 24, textAlign: 'right' }}>{count}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={600}>All Reviews</Typography>
                  <TextField
                    select
                    size="small"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    SelectProps={{ native: true }}
                    variant="outlined"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </TextField>
                </Box>
                
                {sortedReviews.length > 0 ? (
                  <List sx={{ mb: 4 }}>
                    {sortedReviews.map((review) => (
                      <Box key={review.id}>
                        <ListItem alignItems="flex-start" secondaryAction={
                           user && (user.id === review.userId || user.role === 'ADMIN') ? (
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteReview(review.id)}>
                              <DeleteIcon />
                            </IconButton>
                          ) : null
                        }>
                          <ListItemAvatar>
                            <Avatar src={`https://i.pravatar.cc/150?u=${review.userId}`} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {review.patientName || `Patient #${review.userId}`}
                                </Typography>
                                <Chip label="Verified Patient" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                                <Rating value={review.rating} readOnly size="small" sx={{ ml: 'auto' }} />
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {review.comment}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1" color="text.secondary" mb={4}>
                    No reviews yet for this doctor.
                  </Typography>
                )}

                {user && user.role === 'PATIENT' && (
                  <Box component="form" onSubmit={handleSubmitReview(onSubmitReview)}>
                    <Typography variant="h6" gutterBottom>Leave a Review</Typography>
                    {reviewError && <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>}
                    {reviewSuccess && <Alert severity="success" sx={{ mb: 2 }}>{reviewSuccess}</Alert>}
                    
                    <Box mb={2}>
                      <Typography component="legend">Rating</Typography>
                      <Rating
                        name="rating"
                        value={ratingValue}
                        onChange={(event, newValue) => {
                          setReviewValue("rating", newValue);
                        }}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Share your experience"
                      {...registerReview("comment", { required: "Comment is required" })}
                      error={!!reviewErrors.comment}
                      helperText={reviewErrors.comment?.message}
                      sx={{ mb: 2 }}
                    />
                    <Button type="submit" variant="outlined" disabled={reviewing}>
                      {reviewing ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DoctorDetails;
