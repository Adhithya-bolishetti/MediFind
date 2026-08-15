import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Rating, TextField, Box } from '@mui/material';
import reviewService from '../services/reviewService';

const ReviewModal = ({ open, onClose, appointment, type, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const payload = {
        appointmentId: appointment.id,
        rating,
        comment: reviewText,
        recommendation: rating >= 4
      };

      if (type === 'doctor') {
        await reviewService.submitReview(appointment.doctorId, payload);
      } else {
        // Fetch doctor to get hospital id, or assume it's passed?
        // Since we don't have hospitalId in appointment, we might need to fetch doctor details first,
        // but for now let's assume we can fetch it, or the API handles it?
        // Actually, the prompt says POST /hospitals/{hospitalId}/reviews.
        // We need the hospitalId. Let's fetch the doctor details to get hospitalId.
        const { default: api } = await import('../services/api');
        const docRes = await api.get(`/doctors/${appointment.doctorId}`);
        const hospitalId = docRes.data.hospitalId;
        
        if (!hospitalId) throw new Error("No hospital associated with this doctor");
        await reviewService.submitHospitalReview(hospitalId, payload);
      }
      
      onSuccess(type);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Rate your experience ({type === 'doctor' ? 'Doctor' : 'Hospital'})
      </DialogTitle>
      <DialogContent>
        {error && <Typography color="error" variant="body2" mb={2}>{error}</Typography>}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} my={3}>
          <Typography component="legend">How was your visit?</Typography>
          <Rating
            name="rating"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            size="large"
          />
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Your review"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share details of your experience..."
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || rating === 0}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewModal;
