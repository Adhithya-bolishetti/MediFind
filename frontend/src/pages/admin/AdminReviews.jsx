import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, CircularProgress, IconButton, MenuItem,
  Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Typography, Rating, Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import doctorService from '../../services/doctorService';
import { useToast } from '../../context/ToastContext';
import { TEAL, NAVY, MUTED, BORDER, StatusChip, PageHeader, formatDateTime } from './shared';

const ROWS = 8;
const STATUSES = ['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'HIDDEN', 'FLAGGED'];

const AdminReviews = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [viewReview, setViewReview] = useState(null);
  const [acting, setActing] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getAllReviewsAdmin();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reviews', err);
      showToast('Unable to load reviews. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = reviews.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (ratingFilter !== 'ALL' && r.rating !== Number(ratingFilter)) return false;
      if (!q) return true;
      return [r.patientName, r.doctorName, r.comment, `#${r.userId}`, `#${r.doctorId}`]
        .some((f) => f && String(f).toLowerCase().includes(q));
    });
    if (sortBy === 'highest') list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'lowest') list = [...list].sort((a, b) => a.rating - b.rating);
    else list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [reviews, search, statusFilter, ratingFilter, sortBy]);

  const pageData = filtered.slice(page * ROWS, page * ROWS + ROWS);

  const setStatus = async (r, status, msg) => {
    setActing(true);
    try {
      await doctorService.updateReviewStatus(r.id, status);
      showToast(msg);
      fetchReviews();
    } catch (err) {
      showToast('Unable to update review. Please try again.', 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      <PageHeader
        title="Reviews & Ratings"
        subtitle="Moderate doctor reviews and ratings."
        action={
          <Button variant="outlined" onClick={fetchReviews} disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: BORDER, color: NAVY, fontWeight: 600, '&:hover': { borderColor: TEAL, color: TEAL } }}>
            Refresh
          </Button>
        }
      />

      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: `1px solid ${BORDER}`, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search by patient, doctor or review text..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: 20 }} /> } }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Rating</InputLabel>
          <Select value={ratingFilter} label="Rating" onChange={(e) => { setRatingFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="ALL">All Ratings</MenuItem>
            {[5, 4, 3, 2, 1].map((r) => <MenuItem key={r} value={String(r)}>{r} Star{r > 1 ? 's' : ''}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="newest">Date: Newest</MenuItem>
            <MenuItem value="highest">Rating: High → Low</MenuItem>
            <MenuItem value="lowest">Rating: Low → High</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box>
        ) : pageData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}><Typography variant="body1" color="text.secondary">No reviews found.</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                    {['Patient', 'Doctor', 'Rating', 'Review', 'Date', 'Status', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 800, color: NAVY, fontSize: '0.8rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageData.map((r) => (
                    <TableRow key={r.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell><Typography variant="body2" fontWeight={700} color={NAVY}>{r.patientName || `Patient #${r.userId}`}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{r.doctorName || `Doctor #${r.doctorId}`}</Typography></TableCell>
                      <TableCell><Rating value={r.rating} readOnly size="small" /></TableCell>
                      <TableCell>
                        <Typography variant="body2" color={MUTED} sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.comment || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{formatDateTime(r.createdAt)}</Typography></TableCell>
                      <TableCell><StatusChip status={r.status} /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => setViewReview(r)} title="View" sx={{ color: TEAL }}><VisibilityIcon fontSize="small" /></IconButton>
                        {r.status !== 'HIDDEN' ? (
                          <IconButton size="small" onClick={() => setStatus(r, 'HIDDEN', 'Review hidden.')} disabled={acting} title="Hide review" sx={{ color: '#EF4444' }}><VisibilityOffIcon fontSize="small" /></IconButton>
                        ) : (
                          <IconButton size="small" onClick={() => setStatus(r, 'APPROVED', 'Review restored.')} disabled={acting} title="Restore review" sx={{ color: '#0F766E' }}><RestoreIcon fontSize="small" /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={ROWS} onPageChange={(e, p) => setPage(p)} rowsPerPageOptions={[ROWS]} />
          </>
        )}
      </Paper>

      {/* View dialog */}
      <Dialog open={!!viewReview} onClose={() => setViewReview(null)} maxWidth="sm" fullWidth>
        {viewReview && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Review Details</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Rating value={viewReview.rating} readOnly />
                <StatusChip status={viewReview.status} />
              </Box>
              <Typography variant="body2" color={MUTED} sx={{ mb: 2, bgcolor: '#FAFBFC', p: 2, borderRadius: 2 }}>
                {viewReview.comment || 'No comment provided.'}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                ['Patient', viewReview.patientName || `Patient #${viewReview.userId}`],
                ['Doctor', viewReview.doctorName || `Doctor #${viewReview.doctorId}`],
                ['Appointment', viewReview.appointmentId || '—'],
                ['Recommendation', viewReview.recommendation == null ? '—' : (viewReview.recommendation ? 'Yes' : 'No')],
                ['Submitted', formatDateTime(viewReview.createdAt)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', mb: 1.2 }}>
                  <Typography variant="body2" fontWeight={700} color={NAVY} sx={{ width: 140, flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" color={MUTED}>{value || '—'}</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewReview(null)} sx={{ textTransform: 'none', color: MUTED }}>Close</Button>
              {viewReview.status !== 'HIDDEN' && (
                <Button color="error" variant="outlined" onClick={() => { setStatus(viewReview, 'HIDDEN', 'Review hidden.'); setViewReview(null); }} sx={{ textTransform: 'none', borderRadius: 2 }}>Hide Review</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminReviews;
