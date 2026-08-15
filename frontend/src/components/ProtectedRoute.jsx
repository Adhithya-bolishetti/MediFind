import { useContext } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { AuthContext } from '../context/AuthContext';

const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: '#F7F9FC' }}>
      <Paper elevation={0} sx={{ p: 6, borderRadius: 4, border: '1px solid #E8EDF2', textAlign: 'center', maxWidth: 420 }}>
        <Box sx={{ width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LockOutlinedIcon sx={{ fontSize: 34, color: '#EF4444' }} />
        </Box>
        <Typography variant="h5" fontWeight={800} color="#101B36" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          You don&apos;t have permission to view this page.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#079A9A', '&:hover': { bgcolor: '#068A8A' } }}
        >
          Go to my dashboard
        </Button>
      </Paper>
    </Box>
  );
};

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
    return <AccessDenied />;
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
