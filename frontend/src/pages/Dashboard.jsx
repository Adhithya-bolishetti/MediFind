import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import AdminDashboard from './AdminDashboard';
import HospitalDashboard from './HospitalDashboard';

/**
 * Dashboard — routes to the role-specific dashboard.
 * The DashboardLayout (sidebar + content) is applied by App.jsx
 * around this component, not inside it.
 */
const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (user?.role === 'DOCTOR') return <DoctorDashboard />;
  if (user?.role === 'ADMIN') return <AdminDashboard />;
  if (user?.role === 'HOSPITAL') return <HospitalDashboard />;
  return <PatientDashboard />;
};

export default Dashboard;
