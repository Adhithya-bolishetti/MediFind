import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

const TEAL = '#079A9A';

// The top navbar is only shown on the marketing page (/home) for anonymous
// visitors. Auth pages (/ , /login, /register) use the full-screen AuthLayout,
// and authenticated pages use the Sidebar instead — never the top navbar.
const PUBLIC_PATHS = ['/home'];

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // The top navbar is only for anonymous visitors on public pages.
  // Authenticated users always get the left sidebar instead — never both.
  if (user || !PUBLIC_PATHS.includes(location.pathname)) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'var(--mf-card)',
        borderBottom: '1px solid var(--mf-border)',
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box
          component={RouterLink}
          to="/"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', flexGrow: 1 }}
        >
          <Box
            sx={{
              width: 32, height: 32, bgcolor: TEAL, borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <AddBoxOutlinedIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              background: `linear-gradient(135deg, ${TEAL}, #045F5F)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Medi<span style={{ fontWeight: 400 }}>Find</span>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }} gap={1}>
          <Button color="inherit" component={RouterLink} to="/doctors" sx={{ textTransform: 'none', color: 'var(--mf-text)', fontWeight: 500 }}>
            Find Doctors
          </Button>
          <Button color="inherit" component={RouterLink} to="/hospitals" sx={{ textTransform: 'none', color: 'var(--mf-text)', fontWeight: 500 }}>
            Hospitals
          </Button>

          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Button component={RouterLink} to="/admin" sx={{ textTransform: 'none', color: '#DC2626', fontWeight: 700 }}>
                  Admin
                </Button>
              )}
              <Button
                component={RouterLink}
                to="/dashboard"
                sx={{ textTransform: 'none', color: 'var(--mf-text)', fontWeight: 500 }}
              >
                Dashboard
              </Button>
              <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{ textTransform: 'none', borderRadius: 2, borderColor: TEAL, color: TEAL, fontWeight: 600, ml: 1 }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                component={RouterLink}
                to="/login"
                sx={{ textTransform: 'none', color: 'var(--mf-text)', fontWeight: 500 }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                component={RouterLink}
                to="/register"
                sx={{ textTransform: 'none', borderRadius: 2, bgcolor: TEAL, fontWeight: 600, ml: 1, '&:hover': { bgcolor: '#068A8A' } }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
