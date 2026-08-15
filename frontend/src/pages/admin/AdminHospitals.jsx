import { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, CircularProgress, IconButton, MenuItem,
  Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Typography, Switch, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import hospitalService from '../../services/hospitalService';
import doctorService from '../../services/doctorService';
import { useToast } from '../../context/ToastContext';
import { TEAL, NAVY, MUTED, BORDER, BG, SURFACE, StatusChip, PageHeader, formatDate } from './shared';

const ROWS = 8;
const EMPTY_FORM = { hospitalName: '', address: '', city: '', state: '', phoneNumber: '', email: '', latitude: '', longitude: '', emergencyAvailable: false };

const AdminHospitals = () => {
  const { showToast } = useToast();
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('nameAsc');
  const [page, setPage] = useState(0);

  const [dialog, setDialog] = useState(null); // { mode: 'add' | 'edit', hospital }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [hosps, docs] = await Promise.all([
        hospitalService.getAllWithInactive(),
        doctorService.getAllAdmin().catch(() => []),
      ]);
      setHospitals(Array.isArray(hosps) ? hosps : []);
      setDoctors(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error('Failed to load hospitals', err);
      showToast('Unable to load hospitals. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const doctorCount = (hospitalId) => doctors.filter((d) => d.hospitalId === hospitalId).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = hospitals.filter((h) => {
      if (statusFilter === 'ACTIVE' && !h.active) return false;
      if (statusFilter === 'INACTIVE' && h.active) return false;
      if (!q) return true;
      return [h.hospitalName, h.city, h.state, h.address].some((f) => f && f.toLowerCase().includes(q));
    });
    if (sortBy === 'location') list = [...list].sort((a, b) => (a.city || '').localeCompare(b.city || '', undefined, { sensitivity: 'base' }));
    else if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else list = [...list].sort((a, b) => (a.hospitalName || '').localeCompare(b.hospitalName || '', undefined, { sensitivity: 'base' }));
    return list;
  }, [hospitals, search, statusFilter, sortBy]);

  const pageData = filtered.slice(page * ROWS, page * ROWS + ROWS);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setDialog({ mode: 'add' });
  };

  const openEdit = (h) => {
    setForm({
      hospitalName: h.hospitalName || '',
      address: h.address || '',
      city: h.city || '',
      state: h.state || '',
      phoneNumber: h.phoneNumber || '',
      email: h.email || '',
      latitude: h.latitude ?? '',
      longitude: h.longitude ?? '',
      emergencyAvailable: !!h.emergencyAvailable,
    });
    setFormError('');
    setDialog({ mode: 'edit', hospital: h });
  };

  const save = async () => {
    if (!form.hospitalName || !form.city || !form.phoneNumber || !form.email) {
      setFormError('Name, city, phone and email are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        hospitalName: form.hospitalName,
        address: form.address,
        city: form.city,
        state: form.state,
        phoneNumber: form.phoneNumber,
        email: form.email,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        emergencyAvailable: form.emergencyAvailable,
      };
      if (dialog.mode === 'add') {
        await hospitalService.create(payload);
        showToast('Hospital added successfully.');
      } else {
        await hospitalService.update(dialog.hospital.id, payload);
        showToast('Hospital updated successfully.');
      }
      setDialog(null);
      fetchAll();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setFormError(msg || 'Unable to save hospital. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (h) => {
    try {
      await hospitalService.update(h.id, {
        hospitalName: h.hospitalName, address: h.address, city: h.city, state: h.state,
        phoneNumber: h.phoneNumber, email: h.email, latitude: h.latitude, longitude: h.longitude,
        emergencyAvailable: !!h.emergencyAvailable, active: !h.active,
      });
      showToast(h.active ? 'Hospital deactivated.' : 'Hospital activated successfully.');
      fetchAll();
    } catch (err) {
      showToast('Unable to update hospital status. Please try again.', 'error');
    }
  };

  const doDelete = async () => {
    try {
      await hospitalService.remove(confirmDelete.id);
      showToast('Hospital deleted.');
      setConfirmDelete(null);
      fetchAll();
    } catch (err) {
      showToast('Unable to delete hospital. Please try again.', 'error');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: BG }}>
      <PageHeader
        title="Hospital Management"
        subtitle="Add, edit and manage hospitals."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: TEAL, fontWeight: 700, '&:hover': { bgcolor: '#068A8A' } }}>
            Add Hospital
          </Button>
        }
      />

      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: `1px solid ${BORDER}`, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search by name or location..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: 20 }} /> } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Deactivated</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="nameAsc">Name: A → Z</MenuItem>
            <MenuItem value="location">Location</MenuItem>
            <MenuItem value="rating">Rating: High → Low</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box>
        ) : pageData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body1" color="text.secondary">No hospitals found.</Typography>
            <Button sx={{ mt: 1, color: TEAL, textTransform: 'none', fontWeight: 700 }} onClick={openAdd}>Add your first hospital</Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: SURFACE }}>
                    {['Hospital', 'Location', 'Phone', 'Rating', 'Doctors', 'Status', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 800, color: NAVY, fontSize: '0.8rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageData.map((h) => (
                    <TableRow key={h.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color={NAVY}>{h.hospitalName}</Typography>
                        <Typography variant="caption" color="text.secondary">{h.address}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{[h.city, h.state].filter(Boolean).join(', ')}</Typography></TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{h.phoneNumber}</Typography></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 15, color: '#F59E0B' }} />
                          <Typography variant="body2" fontWeight={700} color={NAVY}>{h.rating > 0 ? h.rating.toFixed(1) : 'New'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" color={MUTED}>{doctorCount(h.id)}</Typography></TableCell>
                      <TableCell><StatusChip status={h.active ? 'ACTIVE' : 'INACTIVE'} /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton size="small" onClick={() => openEdit(h)} title="Edit" sx={{ color: '#0891B2' }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => toggleActive(h)} title={h.active ? 'Deactivate' : 'Activate'} sx={{ color: h.active ? '#EF4444' : '#0F766E' }}>
                          {h.active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={() => setConfirmDelete(h)} title="Delete" sx={{ color: '#9CA3AF' }}><DeleteIcon fontSize="small" /></IconButton>
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

      {/* Add/Edit dialog */}
      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>{dialog?.mode === 'add' ? 'Add Hospital' : 'Edit Hospital'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Hospital Name *" value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Phone *" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField label="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Latitude" type="number" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField label="Longitude" type="number" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color={NAVY} fontWeight={600}>24×7 Emergency Available</Typography>
              <Switch checked={form.emergencyAvailable} onChange={(e) => setForm({ ...form, emergencyAvailable: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: TEAL }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: TEAL } }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} sx={{ textTransform: 'none', color: MUTED }}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' } }}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Delete Hospital</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{confirmDelete?.hospitalName}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: 'none', color: MUTED }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={doDelete} sx={{ textTransform: 'none', borderRadius: 2 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminHospitals;
