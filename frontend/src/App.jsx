import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import DashboardLayout from './components/layout/DashboardLayout';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Public pages (also accessible when authenticated)
import FindDoctors from './pages/FindDoctors';
import HospitalSearch from './pages/HospitalSearch';
import DoctorDetails from './pages/DoctorDetails';

// Profile setup pages (no sidebar — standalone layout)
import DoctorProfileSetup from './pages/DoctorProfileSetup';
import PatientProfileSetup from './pages/PatientProfileSetup';
import HospitalProfileSetup from './pages/HospitalProfileSetup';

// Hospital dashboard pages (sidebar + HOSPITAL role)
import HospitalDashboard from './pages/HospitalDashboard';
import HospitalProfile from './pages/HospitalProfile';
import HospitalImages from './pages/HospitalImages';
import HospitalReviews from './pages/HospitalReviews';
import HospitalDetails from './pages/HospitalDetails';

// Authenticated dashboard pages (use sidebar)
import Dashboard from './pages/Dashboard';
import AppointmentHistory from './pages/AppointmentHistory';
import Profile from './pages/Profile';
import NotificationMenu from './components/NotificationMenu';

// Admin pages (sidebar + admin-only)
import AdminDashboard from './pages/AdminDashboard';
import AdminPatients from './pages/admin/AdminPatients';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminHospitals from './pages/admin/AdminHospitals';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';

/**
 * WithSidebar — wraps children with DashboardLayout (sidebar + content area).
 * Used for all protected routes.
 */
const WithSidebar = ({ children }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

/**
 * ConditionalSidebar — used for semi-public pages (Find Doctors, Hospitals,
 * Doctor Details) that can be visited both anonymously and while authenticated.
 * Shows the sidebar when the user is logged in and has completed their profile.
 */
const ConditionalSidebar = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (user && user.isProfileComplete) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
  return <>{children}</>;
};

/**
 * Landing — the Signup page is the application's landing page.
 * Authenticated users are sent to their dashboard instead.
 */
const Landing = () => {
  const { user, token, loading } = useContext(AuthContext);

  // Only show the spinner while we're actually authenticating. If a stored
  // token exists but the user failed to load (stale/revoked session, network
  // outage), send them to login instead of spinning forever.
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#F7F9FC' }}>
        <CircularProgress sx={{ color: '#079A9A' }} />
      </Box>
    );
  }

  if (token && !user) return <Navigate to="/login" replace />;
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'HOSPITAL') return <Navigate to={user.isProfileComplete ? '/hospital/dashboard' : '/hospital/setup'} replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <Register />;
};

/**
 * AppRoutes — the inner router tree, placed inside AuthProvider so it can
 * read AuthContext (required by ConditionalSidebar and Navbar).
 */
const AppRoutes = () => (
  <>
    {/* Public top navbar — auto-hides itself on authenticated dashboard pages */}
    <Navbar />

    <Routes>
      {/* ─────────────── Public Routes ─────────────── */}
      {/* The Signup page is the landing page. Logged-in users go to /dashboard. */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Landing />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Semi-public pages — sidebar appears when logged in */}
      <Route path="/doctors" element={<ConditionalSidebar><FindDoctors /></ConditionalSidebar>} />
      <Route path="/doctors/:id" element={<ConditionalSidebar><DoctorDetails /></ConditionalSidebar>} />
      <Route path="/hospitals" element={<ConditionalSidebar><HospitalSearch /></ConditionalSidebar>} />
      <Route path="/hospitals/:id" element={<ConditionalSidebar><HospitalDetails /></ConditionalSidebar>} />

      {/* ─────────────── Profile Setup (no sidebar) ─────────────── */}
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute requireProfileIncomplete allowedRole="DOCTOR">
            <DoctorProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute requireProfileIncomplete allowedRole="PATIENT">
            <PatientProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/setup"
        element={
          <ProtectedRoute requireProfileIncomplete allowedRole="HOSPITAL">
            <HospitalProfileSetup />
          </ProtectedRoute>
        }
      />

      {/* ─────────────── Authenticated Routes (with sidebar) ─────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireProfileComplete>
            <WithSidebar><Dashboard /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute requireProfileComplete>
            <WithSidebar><AppointmentHistory /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute requireProfileComplete>
            <WithSidebar><Profile /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute requireProfileComplete>
            <WithSidebar><NotificationMenu /></WithSidebar>
          </ProtectedRoute>
        }
      />

      {/* ─────────────── Hospital (sidebar + HOSPITAL role) ─────────────── */}
      <Route
        path="/hospital/dashboard"
        element={
          <ProtectedRoute requireProfileComplete allowedRole="HOSPITAL">
            <WithSidebar><HospitalDashboard /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/profile"
        element={
          <ProtectedRoute requireProfileComplete allowedRole="HOSPITAL">
            <WithSidebar><HospitalProfile /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/images"
        element={
          <ProtectedRoute requireProfileComplete allowedRole="HOSPITAL">
            <WithSidebar><HospitalImages /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/reviews"
        element={
          <ProtectedRoute requireProfileComplete allowedRole="HOSPITAL">
            <WithSidebar><HospitalReviews /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/notifications"
        element={
          <ProtectedRoute requireProfileComplete allowedRole="HOSPITAL">
            <WithSidebar><NotificationMenu /></WithSidebar>
          </ProtectedRoute>
        }
      />

      {/* ─────────────── Admin (sidebar + ADMIN role only) ─────────────── */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <WithSidebar><AdminDashboard /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <WithSidebar><AdminPatients /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <WithSidebar><AdminDoctors /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/hospitals"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <WithSidebar><AdminHospitals /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <WithSidebar><AdminAppointments /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <WithSidebar><AdminReviews /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <WithSidebar><AdminNotifications /></WithSidebar>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <WithSidebar><AdminSettings /></WithSidebar>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
