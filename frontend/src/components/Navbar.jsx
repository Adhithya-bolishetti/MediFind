import React, { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <LocalHospitalIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
          <span className="gradient-text">MediFind</span>
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/doctors">Find Doctors</Button>
          <Button color="inherit" component={RouterLink} to="/hospitals">Hospitals</Button>
          
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Button color="error" component={RouterLink} to="/admin" sx={{ fontWeight: 'bold' }}>Admin</Button>
              )}
              <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
              <Button color="inherit" component={RouterLink} to="/appointments">Appointments</Button>
              <Button color="inherit" component={RouterLink} to="/notifications">Notifications</Button>
              <Button color="inherit" component={RouterLink} to="/profile">Profile</Button>
              <Button variant="outlined" color="primary" onClick={handleLogout} sx={{ ml: 2 }}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button variant="contained" color="primary" component={RouterLink} to="/register" sx={{ ml: 1 }}>Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
