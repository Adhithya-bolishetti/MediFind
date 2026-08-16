import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Chip, Avatar,
} from '@mui/material';
import hospitalService from '../services/hospitalService';
import userService from '../services/userService';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';

const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';

const StarRating = ({ value, size = 18 }) => (
  <Box sx={{ display: 'flex', gap: 0.2 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <StarIcon key={n} sx={{ fontSize: size, color: n <= Math.round(value || 0) ? '#F59E0B' : 'var(--mf-border)' }} />
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

const HospitalReviews = () => {
  const [hospital, setHospital] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [patientNames, setPatientNames] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await hospitalService.getMyProfile();
        setHospital(p);
        const data = await hospitalService.getReviews(p.id);
        const list = Array.isArray(data) ? data : [];
        setReviews(list);

        // Resolve patient display names (best effort — reviews stay readable without them).
        const names = {};
        await Promise.all(
          list.map(async (r) => {
            try {
              const u = await userService.getProfile(r.patientId);
              if (u?.fullName) names[r.patientId] = u.fullName;
            } catch { /* ignore */ }
          })
        );
        setPatientNames(names);
      } catch (err) {
        console.error('Failed to load hospital reviews', err);
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

  const dist = hospital?.ratingDistribution;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'var(--mf-bg)' }}>
      <Typography variant="h5" fontWeight={800} color={NAVY} mb={0.5}>Reviews & Ratings</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        See what patients say about your hospital.
      </Typography>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid var(--mf-border)', mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2" fontWeight={800} color={NAVY} sx={{ lineHeight: 1 }}>
            {hospital?.rating > 0 ? hospital.rating.toFixed(1) : '—'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
            <StarRating value={hospital?.rating || 0} size={20} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {hospital?.totalReviews || 0} reviews
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          {[5, 4, 3, 2, 1].map((n) => {
            const count = dist ? dist[`rating${n}`] || 0 : 0;
            const total = hospital?.totalReviews || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <Box key={n} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ width: 14 }}>{n}</Typography>
                <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                <Box sx={{ flex: 1, bgcolor: 'var(--mf-border)', borderRadius: 2, height: 8, overflow: 'hidden' }}>
                  <Box sx={{ width: `${pct}%`, bgcolor: '#F59E0B', height: '100%', borderRadius: 2 }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ width: 30, textAlign: 'right' }}>{count}</Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {reviews.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 4, textAlign: 'center', border: '1px dashed var(--mf-border)' }}>
          <RateReviewIcon sx={{ fontSize: 56, color: 'var(--mf-border)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No reviews yet.</Typography>
          <Typography variant="body2" color="text.secondary">
            Reviews from patients with completed appointments will appear here.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reviews.map((r) => (
            <Paper key={r.id} elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid var(--mf-border)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: `${TEAL}22`, color: TEAL, fontSize: '0.95rem', fontWeight: 700 }}>
                  {(patientNames[r.patientId] || `Patient #${r.patientId}`).charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color={NAVY}>
                    {patientNames[r.patientId] || `Patient #${r.patientId}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{formatDate(r.createdAt)}</Typography>
                </Box>
                <StarRating value={r.rating} size={16} />
                <Chip label={r.status || 'APPROVED'} size="small" sx={{ bgcolor: r.status === 'APPROVED' ? '#DCFCE7' : 'var(--mf-border)', color: r.status === 'APPROVED' ? '#16A34A' : '#6B7280', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
              </Box>
              {r.reviewText ? (
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{r.reviewText}</Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No written review.</Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default HospitalReviews;
