import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import DoctorOnboarding from './pages/DoctorOnboarding';
import NotificationMenu from './components/NotificationMenu';
import EmergencyHelp from './components/EmergencyHelp';

function App() {
  return (
    <Router>
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
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute><AppointmentHistory /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><DoctorOnboarding /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationMenu /></ProtectedRoute>} />
              
              {/* Admin Route */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
