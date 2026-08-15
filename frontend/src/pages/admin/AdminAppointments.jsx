import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, CircularProgress, IconButton, MenuItem,
  Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Typography, Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import appointmentService from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';
import { TEAL, NAVY, MUTED, BORDER, BG, SURFACE, StatusChip, PageHeader, formatDate, formatDateTime } from './shared';

const ROWS = 8;
const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED'];

const AdminAppointments = () => {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [viewAppt, setViewAppt] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [acting, setActing] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAllAdmin();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load appointments', err);
      showToast('Unable to load appointments. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = appointments.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (dateFilter && a.appointmentDate !== dateFilter) return false;
      if (!q) return true;
      return [
        a.user?.fullName, `#${a.userId}`, a.doctor?.doctorName, `#${a.doctorId}`,
        a.reason, a.appointmentDate, a.appointmentTime,
      ].some((f) => f && String(f).toLowerCase().includes(q));
    });
    list = [...list].sort((a, b) => {
      const da = `${a.appointmentDate} ${a.appointmentTime}`;
      const db = `${b.appointmentDate} ${b.appointmentTime}`;
      return db.localeCompare(da);
    });
    return list;
  }, [appointments, search, statusFilter, dateFilter]);

  const pageData = filtered.slice(page * ROWS, page * ROWS + ROWS);

  const doCancel = async () => {
    setActing(true);
    try {
      await appointmentService.cancelAdmin(confirmCancel.id);
      showToast('Appointment cancelled.');
      setConfirmCancel(null);
      fetchAppointments();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to cancel appointment. Please try again.', 'error');
      setConfirmCancel(null);
    } finally {
      setActing(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: BG }}>
      <PageHeader
        title="Appointment Management"
        subtitle="View and manage all appointments across the platform."
        action={
          <Button variant="outlined" onClick={fetchAppointments} disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: BORDER, color: NAVY, fontWeight: 600, '&:hover': { borderColor: TEAL, color: TEAL } }}>
            Refresh
          </Button>
        }
      />

      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: `1px solid ${BORDER}`, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search by patient, doctor, reason..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: 20 }} /> } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small" type="date" label="Date" value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(0); }}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 170, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box>
        ) : pageData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}><Typography variant="body1" color="text.secondary">No appointments found.</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: SURFACE }}>
                    {['Patient', 'Doctor', 'Date', 'Time', 'Consultation', 'Reason', 'Status', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 800, color: NAVY, fontSize: '0.8rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageData.map((a) => (
                    <TableRow key={a.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color={NAVY}>{a.user?.fullName || `Patient #${a.userId}`}</Typography>
                        <Typography variant="caption" color="text.secondary">{a.user?.phone || ''}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{a.doctor?.doctorName || `Doctor #${a.doctorId}`}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{formatDate(a.appointmentDate)}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{a.appointmentTime}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{a.consultationType || 'In-person'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED} sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason}</Typography></TableCell>
                      <TableCell><StatusChip status={a.status} /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => setViewAppt(a)} title="View" sx={{ color: TEAL }}><VisibilityIcon fontSize="small" /></IconButton>
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                          <IconButton size="small" onClick={() => setConfirmCancel(a)} title="Cancel" sx={{ color: '#EF4444' }}><CancelIcon fontSize="small" /></IconButton>
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
      <Dialog open={!!viewAppt} onClose={() => setViewAppt(null)} maxWidth="sm" fullWidth>
        {viewAppt && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Appointment Details</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <StatusChip status={viewAppt.status} />
                <Typography variant="caption" color="text.secondary">Booked {formatDateTime(viewAppt.createdAt)}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {[
                ['Patient', viewAppt.user?.fullName || `Patient #${viewAppt.userId}`],
                ['Patient Contact', viewAppt.user?.phone || '—'],
                ['Doctor', viewAppt.doctor?.doctorName || `Doctor #${viewAppt.doctorId}`],
                ['Date', formatDate(viewAppt.appointmentDate)],
                ['Time', viewAppt.appointmentTime],
                ['Consultation', viewAppt.consultationType || 'In-person'],
                ['Reason', viewAppt.reason],
                ['Notes', viewAppt.notes],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', mb: 1.2 }}>
                  <Typography variant="body2" fontWeight={700} color={NAVY} sx={{ width: 130, flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" color={MUTED}>{value || '—'}</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewAppt(null)} sx={{ textTransform: 'none', color: MUTED }}>Close</Button>
              {viewAppt.status !== 'CANCELLED' && viewAppt.status !== 'COMPLETED' && (
                <Button color="error" variant="outlined" onClick={() => { setConfirmCancel(viewAppt); setViewAppt(null); }} sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel Appointment</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Cancel confirm */}
      <Dialog open={!!confirmCancel} onClose={() => setConfirmCancel(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Cancel the appointment for <strong>{confirmCancel?.user?.fullName || `Patient #${confirmCancel?.userId}`}</strong> with{' '}
            <strong>{confirmCancel?.doctor?.doctorName || `Doctor #${confirmCancel?.doctorId}`}</strong> on{' '}
            {formatDate(confirmCancel?.appointmentDate)}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel(null)} sx={{ textTransform: 'none', color: MUTED }}>Keep Appointment</Button>
          <Button variant="contained" color="error" onClick={doCancel} disabled={acting} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {acting ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAppointments;
