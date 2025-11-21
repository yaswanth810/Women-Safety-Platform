import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import SOSPage from './pages/SOSPage';
import IncidentReportPage from './pages/IncidentReportPage';
import ForumPage from './pages/ForumPage';
import AdminPage from './pages/AdminPage';
import LegalResourcesPage from './pages/LegalResourcesPage';
import ProfilePage from './pages/ProfilePage';
import { Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" /> : <AuthPage onLogin={handleLogin} />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/sos"
            element={user ? <SOSPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/report"
            element={user ? <IncidentReportPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/forum"
            element={user ? <ForumPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/legal"
            element={user ? <LegalResourcesPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={user ? <ProfilePage user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/admin"
            element={
              user && (user.role === 'admin' || user.role === 'moderator') ? (
                <AdminPage user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;