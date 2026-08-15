import React, { useContext, useState, useEffect } from 'react';
import {
  Box, Typography, List, ListItem, ListItemIcon, ListItemText,
  Avatar, Badge, Divider, Drawer, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';

// Icons
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SettingsIcon from '@mui/icons-material/Settings';

const SIDEBAR_WIDTH = 260;
const TEAL = '#079A9A';
const NAVY = 'var(--mf-text)';
const LIGHT_TEAL_BG = 'rgba(7, 154, 154, 0.12)';
const BORDER_COLOR = 'var(--mf-border)';

const patientNavItems = [
  { label: 'Profile', icon: <PersonOutlinedIcon />, path: '/profile' },
  { label: 'Notifications', icon: <NotificationsNoneIcon />, path: '/notifications', notif: true },
  { label: 'Find Doctors', icon: <SearchIcon />, path: '/doctors' },
  { label: 'Find Hospitals', icon: <LocalHospitalIcon />, path: '/hospitals' },
  { label: 'Booked Appointments', icon: <EventNoteIcon />, path: '/appointments' },
];

const doctorNavItems = [
  { label: 'Appointments', icon: <EventNoteIcon />, path: '/appointments' },
  { label: 'Profile', icon: <PersonOutlinedIcon />, path: '/profile' },
  { label: 'Notifications', icon: <NotificationsNoneIcon />, path: '/notifications', notif: true },
];

const adminNavItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { label: 'Patients', icon: <PeopleAltIcon />, path: '/admin/patients' },
  { label: 'Doctors', icon: <MedicalServicesIcon />, path: '/admin/doctors' },
  { label: 'Hospitals', icon: <LocalHospitalIcon />, path: '/admin/hospitals' },
  { label: 'Appointments', icon: <EventNoteIcon />, path: '/admin/appointments' },
  { label: 'Reviews & Ratings', icon: <RateReviewIcon />, path: '/admin/reviews' },
  { label: 'Notifications', icon: <NotificationsNoneIcon />, path: '/admin/notifications', notif: true },
  { label: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

const SidebarContent = ({ onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const data = await notificationService.getAll();
        const arr = Array.isArray(data) ? data : [];
        setUnreadCount(arr.filter(n => !n.isRead).length);
      } catch {
        setUnreadCount(0);
      }
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, [user]);

  const navItems = user?.role === 'ADMIN' ? adminNavItems
    : user?.role === 'DOCTOR' ? doctorNavItems
    : patientNavItems;

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Display name
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100vh',
        bgcolor: 'var(--mf-card)',
        borderRight: `1px solid ${BORDER_COLOR}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 3,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          borderBottom: `1px solid ${BORDER_COLOR}`,
          mb: 1,
        }}
        onClick={() => handleNav(user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            bgcolor: TEAL,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AddBoxOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            background: `linear-gradient(135deg, ${TEAL}, #045F5F)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.3px',
          }}
        >
          Medi<span style={{ fontWeight: 400 }}>Find</span>
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} sx={{ ml: 'auto', color: '#9CA3AF' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Nav Items */}
      <List sx={{ px: 2, py: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem
              key={item.path}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: '10px',
                mb: 0.5,
                px: 2,
                py: 1.2,
                cursor: 'pointer',
                bgcolor: active ? LIGHT_TEAL_BG : 'transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: active ? LIGHT_TEAL_BG : 'var(--mf-hover)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: active ? TEAL : '#6B7280',
                }}
              >
                {item.notif ? (
                  <Badge badgeContent={unreadCount || 0} color="error" max={99}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.875rem',
                    color: active ? TEAL : NAVY,
                    noWrap: true,
                  },
                }}
              />
            </ListItem>
          );
        })}
      </List>

      {/* Divider + Logout */}
      <Box sx={{ px: 2, pb: 3 }}>
        <Divider sx={{ mb: 2, borderColor: BORDER_COLOR }} />
        <ListItem
          onClick={handleLogout}
          sx={{
            borderRadius: '10px',
            px: 2,
            py: 1.2,
            cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': { bgcolor: '#FEF2F2' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: '#EF4444' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            slotProps={{
              primary: {
                fontWeight: 500,
                fontSize: '0.875rem',
                color: '#EF4444',
              },
            }}
          />
        </ListItem>
      </Box>
    </Box>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        {/* Mobile hamburger */}
        <Box
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 1300,
            bgcolor: 'var(--mf-card)',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: TEAL }}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}
        >
          <SidebarContent onClose={() => setDrawerOpen(false)} />
        </Drawer>
      </>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: SIDEBAR_WIDTH,
        zIndex: 1200,
        boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
      }}
    >
      <SidebarContent />
    </Box>
  );
};

export { SIDEBAR_WIDTH };
export default Sidebar;
