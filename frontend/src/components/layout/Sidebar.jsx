import React, { useContext, useState, useEffect } from 'react';
import {
  Box, List, ListItem, ListItemIcon, ListItemText,
  Badge, Divider, Drawer, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
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
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

const SIDEBAR_WIDTH = 260;
const TEAL = '#079A9A';
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
  const { isDark, toggle: toggleTheme } = useThemeMode();
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
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: `1px solid ${BORDER_COLOR}`,
          mb: 1,
        }}
        onClick={() => handleNav(user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard')}
      >
        <Box
          component="img"
          src="/medifind-logo.png"
          alt="MediFind"
          sx={{ width: 160, height: 160, objectFit: 'contain', maxWidth: '100%', flexShrink: 0 }}
        />
        {onClose && (
          <IconButton onClick={onClose} sx={{ color: '#9CA3AF' }} size="small">
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
                  // Theme-aware: --mf-muted resolves to a readable slate on both
                  // light (#5C6780) and dark (#94A3B8) sidebar surfaces.
                  color: active ? TEAL : 'var(--mf-muted)',
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
                slotProps={{ primary: { noWrap: true } }}
                sx={{
                  // MUI Typography drops non-palette `color` props, so the text
                  // styling must go through sx for the CSS vars to apply.
                  '& .MuiListItemText-primary': {
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.875rem',
                    color: active ? TEAL : 'var(--mf-text)',
                  },
                }}
              />
            </ListItem>
          );
        })}
      </List>

      {/* Divider + Theme toggle + Logout */}
      <Box sx={{ px: 2, pb: 3 }}>
        <Divider sx={{ mb: 2, borderColor: BORDER_COLOR }} />
        <ListItem
          onClick={toggleTheme}
          sx={{
            borderRadius: '10px',
            px: 2,
            py: 1.2,
            cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': { bgcolor: 'var(--mf-hover)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'var(--mf-muted)' }}>
            {isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </ListItemIcon>
          <ListItemText
            primary={isDark ? 'Light Mode' : 'Dark Mode'}
            sx={{
              '& .MuiListItemText-primary': {
                fontWeight: 500,
                fontSize: '0.875rem',
                color: 'var(--mf-text)',
              },
            }}
          />
        </ListItem>
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
            sx={{
              '& .MuiListItemText-primary': {
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
