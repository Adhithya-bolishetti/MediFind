import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, CircularProgress, Avatar, IconButton,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Typography, Rating, Divider, Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import doctorService from '../../services/doctorService';
import { useToast } from '../../context/ToastContext';
import { TEAL, NAVY, MUTED, BORDER, StatusChip, PageHeader, formatDate, formatDateTime } from './shared';

const ROWS = 8;
const SPECIALIZATIONS = ['ALL', 'GENERAL_PHYSICIAN', 'CARDIOLOGIST', 'DERMATOLOGIST', 'NEUROLOGIST', 'ORTHOPEDIC', 'PEDIATRICIAN', 'GYNECOLOGIST', 'PSYCHIATRIST', 'OPHTHALMOLOGIST', 'ENT_SPECIALIST', 'DENTIST'];
const STATUSES = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

const AdminDoctors = () => {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);

  const [viewDoctor, setViewDoctor] = useState(null);
  const [rejectDoctor, setRejectDoctor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getAllAdmin();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load doctors', err);
      showToast('Unable to load doctors. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = doctors.filter((d) => {
      if (specFilter !== 'ALL' && d.specialization !== specFilter) return false;
      if (statusFilter !== 'ALL' && d.verificationStatus !== statusFilter) return false;
      if (!q) return true;
      return [d.doctorName, d.email, d.phoneNumber, d.specialization, d.clinicName, d.city, d.state, d.qualification]
        .some((f) => f && f.toLowerCase().includes(q));
    });
    if (sortBy === 'nameAsc') list = [...list].sort((a, b) => (a.doctorName || '').localeCompare(b.doctorName || '', undefined, { sensitivity: 'base' }));
    else if (sortBy === 'nameDesc') list = [...list].sort((a, b) => (b.doctorName || '').localeCompare(a.doctorName || '', undefined, { sensitivity: 'base' }));
    else if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [doctors, search, specFilter, statusFilter, sortBy]);

  const pageData = filtered.slice(page * ROWS, page * ROWS + ROWS);

  const refreshAfter = (msg) => {
    showToast(msg);
    fetchDoctors();
  };

  const approve = async (d) => {
    setActing(true);
    try {
      await doctorService.approveDoctor(d.id);
      refreshAfter('Doctor approved successfully.');
    } catch (err) {
      showToast('Unable to approve doctor. Please try again.', 'error');
    } finally {
      setActing(false);
    }
  };

  const confirmReject = async () => {
    setActing(true);
    try {
      await doctorService.rejectDoctor(rejectDoctor.id, rejectReason.trim() || null);
      setRejectDoctor(null);
      setRejectReason('');
      refreshAfter('Doctor rejected.');
    } catch (err) {
      showToast('Unable to reject doctor. Please try again.', 'error');
    } finally {
      setActing(false);
    }
  };

  const suspend = async (d) => {
    setActing(true);
    try {
      await doctorService.suspendDoctor(d.id);
      refreshAfter('Doctor suspended.');
    } catch (err) {
      showToast('Unable to suspend doctor. Please try again.', 'error');
    } finally {
      setActing(false);
    }
  };

  const activate = async (d) => {
    setActing(true);
    try {
      await doctorService.activateDoctor(d.id);
      refreshAfter('Doctor activated successfully.');
    } catch (err) {
      showToast('Unable to activate doctor. Please try again.', 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      <PageHeader
        title="Doctor Management"
        subtitle="Review, approve and manage doctor profiles."
        action={
          <Button variant="outlined" onClick={fetchDoctors} disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: BORDER, color: NAVY, fontWeight: 600, '&:hover': { borderColor: TEAL, color: TEAL } }}>
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: `1px solid ${BORDER}`, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, specialization, clinic, location..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: 20 }} /> } }}
        />
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Specialization</InputLabel>
          <Select value={specFilter} label="Specialization" onChange={(e) => { setSpecFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
            {SPECIALIZATIONS.map((s) => <MenuItem key={s} value={s}>{s === 'ALL' ? 'All Specializations' : s.replace(/_/g, ' ')}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="newest">Registered: Newest</MenuItem>
            <MenuItem value="nameAsc">Name: A → Z</MenuItem>
            <MenuItem value="nameDesc">Name: Z → A</MenuItem>
            <MenuItem value="rating">Rating: High → Low</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box>
        ) : pageData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}><Typography variant="body1" color="text.secondary">No doctors found.</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                    {['Doctor', 'Specialization', 'Hospital', 'Location', 'Rating', 'Status', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 800, color: NAVY, fontSize: '0.8rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageData.map((d) => (
                    <TableRow key={d.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={d.profileImage} sx={{ width: 38, height: 38, bgcolor: '#0891B2' }}>
                            {(d.doctorName || 'D').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700} color={NAVY}>Dr. {(d.doctorName || '').replace(/^Dr\.?\s+/i, '')}</Typography>
                            <Typography variant="caption" color="text.secondary">{d.experience || 0} yrs · {d.qualification || '—'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{(d.specialization || '—').replace(/_/g, ' ')}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{d.clinicName || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{[d.city, d.state].filter(Boolean).join(', ') || '—'}</Typography></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                          <Typography variant="body2" fontWeight={700} color={NAVY}>{d.rating > 0 ? d.rating.toFixed(1) : 'New'}</Typography>
                          {d.totalReviews > 0 && <Typography variant="caption" color="text.secondary">({d.totalReviews})</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell><StatusChip status={d.verificationStatus} /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => setViewDoctor(d)} title="View" sx={{ color: TEAL }}><VisibilityIcon fontSize="small" /></IconButton>
                        {d.verificationStatus === 'PENDING' && (
                          <>
                            <IconButton size="small" onClick={() => approve(d)} disabled={acting} title="Approve" sx={{ color: '#0F766E' }}><CheckCircleIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => { setRejectDoctor(d); setRejectReason(''); }} disabled={acting} title="Reject" sx={{ color: '#EF4444' }}><CancelIcon fontSize="small" /></IconButton>
                          </>
                        )}
                        {d.verificationStatus === 'SUSPENDED' && (
                          <IconButton size="small" onClick={() => activate(d)} disabled={acting} title="Activate" sx={{ color: '#0F766E' }}><PlayArrowIcon fontSize="small" /></IconButton>
                        )}
                        {d.verificationStatus === 'APPROVED' && (
                          <IconButton size="small" onClick={() => suspend(d)} disabled={acting} title="Suspend" sx={{ color: '#EF4444' }}><BlockIcon fontSize="small" /></IconButton>
                        )}
                        {d.verificationStatus === 'REJECTED' && (
                          <IconButton size="small" onClick={() => approve(d)} disabled={acting} title="Re-approve" sx={{ color: '#0F766E' }}><CheckCircleIcon fontSize="small" /></IconButton>
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
      <Dialog open={!!viewDoctor} onClose={() => setViewDoctor(null)} maxWidth="sm" fullWidth>
        {viewDoctor && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Doctor Profile</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar src={viewDoctor.profileImage} sx={{ width: 64, height: 64, bgcolor: '#0891B2' }} />
                <Box>
                  <Typography variant="h6" fontWeight={800} color={NAVY}>Dr. {(viewDoctor.doctorName || '').replace(/^Dr\.?\s+/i, '')}</Typography>
                  <Typography variant="body2" color={TEAL} fontWeight={600}>{(viewDoctor.specialization || '—').replace(/_/g, ' ')}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <StatusChip status={viewDoctor.verificationStatus} />
                    <Rating value={viewDoctor.rating || 0} readOnly precision={0.1} size="small" />
                  </Box>
                </Box>
              </Box>
              {viewDoctor.rejectionReason && (
                <Chip size="small" label={`Rejection reason: ${viewDoctor.rejectionReason}`} sx={{ mb: 2, bgcolor: '#FEF2F2', color: '#B91C1C', fontWeight: 600 }} />
              )}
              <Divider sx={{ mb: 2 }} />
              {[
                ['Email', viewDoctor.email],
                ['Mobile', viewDoctor.phoneNumber],
                ['Gender', viewDoctor.gender],
                ['Date of Birth', viewDoctor.dateOfBirth],
                ['Qualification', viewDoctor.qualification],
                ['Experience', viewDoctor.experience ? `${viewDoctor.experience} years` : '—'],
                ['License No.', viewDoctor.medicalLicenseNumber],
                ['Clinic', viewDoctor.clinicName],
                ['Location', [viewDoctor.clinicAddress, viewDoctor.city, viewDoctor.state, viewDoctor.pincode].filter(Boolean).join(', ')],
                ['Languages', viewDoctor.languages],
                ['Consultation Fee', viewDoctor.consultationFee ? `₹${viewDoctor.consultationFee}` : '—'],
                ['Appointment Duration', viewDoctor.appointmentDuration ? `${viewDoctor.appointmentDuration} min` : '—'],
                ['Working Hours', [viewDoctor.consultationStartTime, viewDoctor.consultationEndTime].filter(Boolean).join(' – ')],
                ['Working Days', viewDoctor.workingDays],
                ['Registered', formatDateTime(viewDoctor.createdAt)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', mb: 1.2 }}>
                  <Typography variant="body2" fontWeight={700} color={NAVY} sx={{ width: 160, flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" color={MUTED}>{value || '—'}</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDoctor(null)} sx={{ textTransform: 'none', color: MUTED }}>Close</Button>
              {viewDoctor.verificationStatus === 'PENDING' && (
                <Button variant="contained" onClick={() => { approve(viewDoctor); setViewDoctor(null); }} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#0F766E', '&:hover': { bgcolor: '#0B5F5A' } }}>
                  Approve
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectDoctor} onClose={() => setRejectDoctor(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Reject Doctor</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Are you sure you want to reject Dr. {(rejectDoctor?.doctorName || '').replace(/^Dr\.?\s+/i, '')}?
          </Typography>
          <TextField
            fullWidth multiline rows={3} label="Rejection reason (optional)"
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDoctor(null)} sx={{ textTransform: 'none', color: MUTED }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmReject} disabled={acting} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {acting ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDoctors;
