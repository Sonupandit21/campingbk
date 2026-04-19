import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PublisherLogin from './pages/PublisherLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminSignup from './pages/SuperAdminSignup';
import Signup from './pages/Signup';
import CreateCampaign from './pages/CreateCampaign';
import PublisherDashboard from './pages/PublisherDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Publisher Protected Route
const PublisherProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>; 
  }
  
  if (!user) {
    return <Navigate to="/publisher/login" />;
  }

  if (user.role !== 'publisher') {
      return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>; 
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ color: '#3498db', textDecoration: 'underline' }}>
        Go back to home
      </a>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />
            <Route path="/superadmin/register" element={<SuperAdminSignup />} />
            <Route path="/publisher/login" element={<PublisherLogin />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/publisher/dashboard" element={
              <PublisherProtectedRoute>
                <PublisherDashboard />
              </PublisherProtectedRoute>
            } />

            <Route path="/campaigns/create" element={
              <ProtectedRoute>
                <CreateCampaign />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/client" element={<Navigate to="/" />} />
            <Route path="/dashboard" element={<Navigate to="/" />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

