import { useContext } from 'react';
import { Box, Paper, Typography, Avatar, Divider, Chip } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { AuthContext } from '../../context/AuthContext';
import { TEAL, NAVY, MUTED, BORDER, PageHeader, formatDateTime } from './shared';

const AdminSettings = () => {
  const { user } = useContext(AuthContext);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#F7F9FC' }}>
      <PageHeader
        title="Settings"
        subtitle="Account and platform settings."
      />

      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${BORDER}`, maxWidth: 680, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: TEAL, fontSize: '1.6rem' }}>
            {(user?.fullName || 'A').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} color={NAVY}>{user?.fullName}</Typography>
            <Typography variant="body2" color={MUTED}>{user?.email}</Typography>
            <Chip
              size="small" icon={<AdminPanelSettingsIcon />} label="Administrator"
              sx={{ mt: 0.8, bgcolor: `${TEAL}12`, color: TEAL, fontWeight: 700, fontSize: '0.72rem' }}
            />
          </Box>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {[
          ['Full Name', user?.fullName],
          ['Email', user?.email],
          ['Role', user?.role],
          ['Member Since', user?.createdAt ? formatDateTime(user.createdAt) : '—'],
        ].map(([label, value]) => (
          <Box key={label} sx={{ display: 'flex', mb: 1.5 }}>
            <Typography variant="body2" fontWeight={700} color={NAVY} sx={{ width: 140, flexShrink: 0 }}>{label}</Typography>
            <Typography variant="body2" color={MUTED}>{value || '—'}</Typography>
          </Box>
        ))}
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${BORDER}`, maxWidth: 680 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <ShieldOutlinedIcon sx={{ color: TEAL }} />
          <Typography variant="h6" fontWeight={800} color={NAVY}>Platform</Typography>
        </Box>
        <Typography variant="body2" color={MUTED}>
          MediFind is a microservices platform (API Gateway + Auth, User, Doctor, Hospital, Appointment and
          Notification services). Admin operations are protected server-side: every admin API requires a valid
          JWT with the <strong>ROLE_ADMIN</strong> authority, and admin pages are guarded on the frontend too.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdminSettings;
