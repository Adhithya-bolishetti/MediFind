import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, CircularProgress, Avatar, IconButton,
  Chip, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Typography, Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import userService from '../../services/userService';
import appointmentService from '../../services/appointmentService';
import notificationService from '../../services/notificationService';
import { useToast } from '../../context/ToastContext';
import { TEAL, NAVY, MUTED, BORDER, BG, SURFACE, StatusChip, PageHeader, formatDate, formatDateTime } from './shared';

const ROWS = 8;

const AdminPatients = () => {
  const { showToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);

  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', city: '', state: '' });
  const [saving, setSaving] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await userService.listUsers({ role: 'PATIENT' });
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load patients', err);
      showToast('Unable to load patients. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = patients.filter((p) => {
      if (statusFilter !== 'ALL' && (p.status || 'ACTIVE').toUpperCase() !== statusFilter) return false;
      if (!q) return true;
      return [p.fullName, p.email, p.phone].some((f) => f && f.toLowerCase().includes(q));
    });
    if (sortBy === 'nameAsc') list = [...list].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', undefined, { sensitivity: 'base' }));
    else if (sortBy === 'nameDesc') list = [...list].sort((a, b) => (b.fullName || '').localeCompare(a.fullName || '', undefined, { sensitivity: 'base' }));
    else list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [patients, search, statusFilter, sortBy]);

  const pageData = filtered.slice(page * ROWS, page * ROWS + ROWS);

  const toggleStatus = async (p) => {
    const next = (p.status || 'ACTIVE') === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await userService.updateUserStatus(p.id, next);
      showToast(next === 'ACTIVE' ? 'Patient activated successfully.' : 'Patient suspended successfully.');
      fetchPatients();
    } catch (err) {
      showToast('Unable to update patient status. Please try again.', 'error');
    }
  };

  const openEdit = (p) => {
    setEditUser(p);
    setEditForm({ fullName: p.fullName || '', phone: p.phone || '', city: p.city || '', state: p.state || '' });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await userService.updateUser(editUser.id, editForm);
      showToast('Patient updated successfully.');
      setEditUser(null);
      fetchPatients();
    } catch (err) {
      showToast('Unable to update patient. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      // Remove the account + related records owned by other services.
      await Promise.allSettled([
        userService.deleteUser(deleteUser.id),
        appointmentService.deleteByUser(deleteUser.id),
        notificationService.deleteByUser(deleteUser.id),
      ]);
      showToast('Patient deleted successfully.');
      setDeleteUser(null);
      fetchPatients();
    } catch (err) {
      showToast('Unable to delete patient. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: BG }}>
      <PageHeader
        title="Patient Management"
        subtitle="View and manage all registered patients."
        action={
          <Button
            variant="outlined"
            onClick={fetchPatients}
            disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: BORDER, color: NAVY, fontWeight: 600, '&:hover': { borderColor: TEAL, color: TEAL } }}
          >
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: `1px solid ${BORDER}`, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name, email or mobile..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: 20 }} />,
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="newest">Registration: Newest</MenuItem>
            <MenuItem value="nameAsc">Name: A → Z</MenuItem>
            <MenuItem value="nameDesc">Name: Z → A</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: TEAL }} />
          </Box>
        ) : pageData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">No patients found.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: SURFACE }}>
                    {['Patient', 'Email', 'Mobile', 'Status', 'Registered', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 800, color: NAVY, fontSize: '0.8rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageData.map((p) => (
                    <TableRow key={p.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={p.profileImage} sx={{ width: 38, height: 38, bgcolor: TEAL }}>
                            {(p.fullName || 'P').charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={700} color={NAVY}>{p.fullName || '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{p.email}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{p.phone || '—'}</Typography></TableCell>
                      <TableCell><StatusChip status={p.status || 'ACTIVE'} /></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{formatDate(p.createdAt)}</Typography></TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => setViewUser(p)} title="View" sx={{ color: TEAL }}><VisibilityIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => openEdit(p)} title="Edit" sx={{ color: '#0891B2' }}><EditIcon fontSize="small" /></IconButton>
                        {(p.status || 'ACTIVE') === 'ACTIVE' ? (
                          <IconButton size="small" onClick={() => toggleStatus(p)} title="Suspend" sx={{ color: '#EF4444' }}><BlockIcon fontSize="small" /></IconButton>
                        ) : (
                          <IconButton size="small" onClick={() => toggleStatus(p)} title="Activate" sx={{ color: '#0F766E' }}><CheckCircleIcon fontSize="small" /></IconButton>
                        )}
                        <IconButton size="small" onClick={() => setDeleteUser(p)} title="Delete" sx={{ color: '#B91C1C' }}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              rowsPerPage={ROWS}
              onPageChange={(e, p) => setPage(p)}
              rowsPerPageOptions={[ROWS]}
            />
          </>
        )}
      </Paper>

      {/* View dialog */}
      <Dialog open={!!viewUser} onClose={() => setViewUser(null)} maxWidth="sm" fullWidth>
        {viewUser && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Patient Profile</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar src={viewUser.profileImage} sx={{ width: 64, height: 64, bgcolor: TEAL }} />
                <Box>
                  <Typography variant="h6" fontWeight={800} color={NAVY}>{viewUser.fullName}</Typography>
                  <StatusChip status={viewUser.status || 'ACTIVE'} />
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {[
                ['Email', viewUser.email],
                ['Mobile', viewUser.phone],
                ['Gender', viewUser.gender],
                ['Date of Birth', viewUser.dateOfBirth],
                ['Address', [viewUser.address, viewUser.city, viewUser.state, viewUser.pincode].filter(Boolean).join(', ')],
                ['Emergency Contact', viewUser.emergencyContactName ? `${viewUser.emergencyContactName} (${viewUser.emergencyContactPhone || '—'})` : '—'],
                ['Registered', formatDateTime(viewUser.createdAt)],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', mb: 1.2 }}>
                  <Typography variant="body2" fontWeight={700} color={NAVY} sx={{ width: 140, flexShrink: 0 }}>{label}</Typography>
                  <Typography variant="body2" color={MUTED}>{value || '—'}</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewUser(null)} sx={{ textTransform: 'none', color: MUTED }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Delete Patient</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Are you sure you want to permanently delete <strong>{deleteUser?.fullName}</strong>?
          </Typography>
          <Typography variant="body2" color="#B91C1C" fontWeight={600}>
            This action cannot be undone. All related appointments, reviews and notifications will be removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUser(null)} sx={{ textTransform: 'none', color: MUTED }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {deleting ? 'Deleting...' : 'Delete Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="sm" fullWidth>
        {editUser && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Edit Patient</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField label="Full Name" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <TextField label="Mobile" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <TextField label="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                <TextField label="State" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditUser(null)} sx={{ textTransform: 'none', color: MUTED }}>Cancel</Button>
              <Button variant="contained" onClick={saveEdit} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' } }}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminPatients;
