import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FindDoctors from './pages/FindDoctors';
import HospitalSearch from './pages/HospitalSearch';
import DoctorDetails from './pages/DoctorDetails';
import AppointmentHistory from './pages/AppointmentHistory';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import DoctorProfileSetup from './pages/DoctorProfileSetup';
import PatientProfileSetup from './pages/PatientProfileSetup';
import NotificationMenu from './components/NotificationMenu';
import EmergencyHelp from './components/EmergencyHelp';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <EmergencyHelp />
          <main style={{ flexGrow: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/doctors" element={<FindDoctors />} />
              <Route path="/doctors/:id" element={<DoctorDetails />} />
              <Route path="/hospitals" element={<HospitalSearch />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute requireProfileComplete><Dashboard /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute requireProfileComplete><AppointmentHistory /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute requireProfileComplete><Profile /></ProtectedRoute>} />
              <Route path="/doctor/profile" element={<ProtectedRoute requireProfileIncomplete allowedRole="DOCTOR"><DoctorProfileSetup /></ProtectedRoute>} />
              <Route path="/patient/profile" element={<ProtectedRoute requireProfileIncomplete allowedRole="PATIENT"><PatientProfileSetup /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute requireProfileComplete><NotificationMenu /></ProtectedRoute>} />
              
              {/* Admin Route */}
              <Route path="/admin" element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
