import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

// Components & Routing guards
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Unauthorized from './pages/Unauthorized';

// Role Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import ReceptionDashboard from './pages/dashboards/ReceptionDashboard';
import FeatureMockup from './pages/dashboards/FeatureMockup';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';
import PaymentSuccess from './pages/features/PaymentSuccess';

// Global error boundary
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h2 style={{ color: '#e53e3e' }}>Something went wrong</h2>
          <pre style={{ fontSize: 12, color: '#666', whiteSpace: 'pre-wrap', maxWidth: 600, margin: '16px auto' }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.href='/'} style={{ padding: '10px 24px', background: '#00ADB5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  // Staff no longer has its own dashboard — redirect to reception
  const role = user.role === 'staff' ? 'reception' : user.role;
  return <Navigate to={`/dashboard/${role}`} replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <LanguageProvider>
            <SettingsProvider>
              <AuthProvider>
                <SocketProvider>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Dashboard redirect route */}
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'parent', 'teacher', 'reception', 'staff']} />}>
                      <Route path="/dashboard" element={<DashboardRedirect />} />
                    </Route>

                    {/* Secure Role-Based Dashboards */}
                    {/* Admin Dashboard */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                      <Route element={<DashboardLayout titleKey="adminPortal" />}>
                        <Route path="/dashboard/admin" element={<AdminDashboard />} />
                        <Route path="/dashboard/admin/settings" element={<Settings />} />
                        <Route path="/dashboard/admin/help" element={<HelpSupport />} />
                        <Route path="/dashboard/admin/:feature" element={<FeatureMockup />} />
                      </Route>
                    </Route>

                    {/* Parent Dashboard */}
                    <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
                      <Route element={<DashboardLayout titleKey="parentPortal" />}>
                        <Route path="/dashboard/parent" element={<ParentDashboard />} />
                        <Route path="/dashboard/parent/settings" element={<Settings />} />
                        <Route path="/dashboard/parent/help" element={<HelpSupport />} />
                        <Route path="/dashboard/parent/payments/success" element={<PaymentSuccess />} />
                        <Route path="/dashboard/parent/:feature" element={<FeatureMockup />} />
                      </Route>
                    </Route>

                    {/* Teacher Dashboard */}
                    <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                      <Route element={<DashboardLayout titleKey="teacherPortal" />}>
                        <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
                        <Route path="/dashboard/teacher/settings" element={<Settings />} />
                        <Route path="/dashboard/teacher/help" element={<HelpSupport />} />
                        <Route path="/dashboard/teacher/:feature" element={<FeatureMockup />} />
                      </Route>
                    </Route>

                    {/* Receptionist Dashboard */}
                    <Route element={<ProtectedRoute allowedRoles={['reception']} />}>
                      <Route element={<DashboardLayout titleKey="receptionPortal" />}>
                        <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
                        <Route path="/dashboard/reception/settings" element={<Settings />} />
                        <Route path="/dashboard/reception/help" element={<HelpSupport />} />
                        <Route path="/dashboard/reception/:feature" element={<FeatureMockup />} />
                      </Route>
                    </Route>

                    {/* Wildcard 404 handler - redirects back to main index */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </SocketProvider>
              </AuthProvider>
            </SettingsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
