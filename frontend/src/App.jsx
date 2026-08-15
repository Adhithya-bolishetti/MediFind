import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
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

// Authenticated dashboard pages (use sidebar)
import Dashboard from './pages/Dashboard';
import AppointmentHistory from './pages/AppointmentHistory';
import Profile from './pages/Profile';
import NotificationMenu from './components/NotificationMenu';
import AdminDashboard from './pages/AdminDashboard';

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

  if (loading || (token && !user)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#F7F9FC' }}>
        <CircularProgress sx={{ color: '#079A9A' }} />
      </Box>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
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

      {/* ─────────────── Admin ─────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
