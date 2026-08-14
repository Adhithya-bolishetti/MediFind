import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireProfileComplete, requireProfileIncomplete, allowedRole }) => {
  const { user, token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading || (token && !user)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#F7F9FC' }}>
        <CircularProgress sx={{ color: '#079A9A' }} />
      </Box>
    );
  }

  if (!user) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireProfileComplete && !user.isProfileComplete) {
    if (user.role === 'DOCTOR') return <Navigate to="/doctor/profile" replace />;
    if (user.role === 'PATIENT') return <Navigate to="/patient/profile" replace />;
  }

  if (requireProfileIncomplete && user.isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
