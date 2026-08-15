import { useState, useEffect } from 'react';
import {
  Box, Paper, TextField, Button, Typography, MenuItem, Select, FormControl,
  InputLabel, Alert, CircularProgress, Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CampaignIcon from '@mui/icons-material/Campaign';
import notificationService from '../../services/notificationService';
import userService from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { TEAL, NAVY, MUTED, BORDER, PageHeader } from './shared';

const AdminNotifications = () => {
  const { showToast } = useToast();
  const [recipientType, setRecipientType] = useState('ALL_PATIENTS');
  const [specificUser, setSpecificUser] = useState('');
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      if (recipientType === 'SPECIFIC_PATIENT' || recipientType === 'SPECIFIC_DOCTOR') {
        try {
          const role = recipientType === 'SPECIFIC_PATIENT' ? 'PATIENT' : 'DOCTOR';
          const data = await userService.listUsers({ role });
          setUsers(Array.isArray(data) ? data : []);
          setSpecificUser('');
        } catch (err) {
          console.error('Failed to load users', err);
          setUsers([]);
        }
      }
    };
    loadUsers();
  }, [recipientType]);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }
    if ((recipientType === 'SPECIFIC_PATIENT' || recipientType === 'SPECIFIC_DOCTOR') && !specificUser) {
      setError('Please select a recipient.');
      return;
    }
    setError('');
    setSending(true);
    setLastResult(null);
    try {
      let result;
      if (recipientType === 'ALL_PATIENTS') {
        result = await notificationService.broadcast({ recipient: 'PATIENT', title, message });
      } else if (recipientType === 'ALL_DOCTORS') {
        result = await notificationService.broadcast({ recipient: 'DOCTOR', title, message });
      } else {
        result = await notificationService.sendToUser({ userId: specificUser, title, message });
      }
      const count = Array.isArray(result) ? result.length : 1;
      setLastResult({ count });
      showToast('Notification sent successfully.');
      setTitle('');
      setMessage('');
      setSpecificUser('');
    } catch (err) {
      setError('Unable to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      <PageHeader
        title="Notifications"
        subtitle="Send announcements to patients and doctors."
      />

      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${BORDER}`, maxWidth: 720 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CampaignIcon sx={{ color: TEAL }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color={NAVY}>Send a Notification</Typography>
            <Typography variant="body2" color="text.secondary">Broadcast to a group or notify a single user.</Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
        {lastResult && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Notification delivered to {lastResult.count} recipient{lastResult.count !== 1 ? 's' : ''}.
          </Alert>
        )}

        <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
          <InputLabel>Recipient</InputLabel>
          <Select value={recipientType} label="Recipient" onChange={(e) => setRecipientType(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="ALL_PATIENTS">All Patients</MenuItem>
            <MenuItem value="ALL_DOCTORS">All Doctors</MenuItem>
            <MenuItem value="SPECIFIC_PATIENT">Specific Patient</MenuItem>
            <MenuItem value="SPECIFIC_DOCTOR">Specific Doctor</MenuItem>
          </Select>
        </FormControl>

        {(recipientType === 'SPECIFIC_PATIENT' || recipientType === 'SPECIFIC_DOCTOR') && (
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <InputLabel>{recipientType === 'SPECIFIC_PATIENT' ? 'Select Patient' : 'Select Doctor'}</InputLabel>
            <Select value={specificUser} label={recipientType === 'SPECIFIC_PATIENT' ? 'Select Patient' : 'Select Doctor'} onChange={(e) => setSpecificUser(e.target.value)} sx={{ borderRadius: 2 }}>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.fullName} — {u.email}{u.status === 'SUSPENDED' ? ' (suspended)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          fullWidth size="small" label="Title" placeholder="e.g. Free health check-up camp"
          value={title} onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
          fullWidth multiline rows={4} label="Message" placeholder="Write your message..."
          value={message} onChange={(e) => setMessage(e.target.value)}
          sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />

        <Button
          variant="contained" fullWidth disabled={sending} startIcon={<SendIcon />} onClick={send}
          sx={{ py: 1.5, borderRadius: 2.5, textTransform: 'none', fontWeight: 700, bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' }, '&:disabled': { bgcolor: '#9CCFCF', color: '#fff' } }}
        >
          {sending ? <><CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> Sending...</> : 'Send Notification'}
        </Button>

        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" color={MUTED}>
          Recipients receive the notification in their in-app notification centre. Suspended accounts are skipped.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdminNotifications;
