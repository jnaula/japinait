import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import MapPage from './pages/MapPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordReset from './pages/PasswordReset';
import UpdatePassword from './pages/UpdatePassword';
import VenueDetail from './pages/VenueDetail';
import RegisterVenue from './pages/RegisterVenue';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Favorites from './pages/Favorites';
import AdminPanel from './pages/AdminPanel';
import Stats from './pages/Stats';
import ProtectedRoute from './components/ProtectedRoute';
import EditVenue from './pages/EditVenue';

export default function App() {
  const{ loading } = useAuth();
  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-8 h-8 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
  return (
      <Router>
        <div className="min-h-screen bg-[#0a0a0a] pb-16 md:pb-0">
          <Navigation />
          <Routes key={window.location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            
            {/* Partially Protected / Hybrid Routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/venue/:id" element={<VenueDetail />} />
            <Route path="/events" element={<Events />} />

            {/* Protected Routes */}
            <Route 
              path="/register-venue" 
              element={
                <ProtectedRoute>
                  <RegisterVenue />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/venue/:id/edith"
              element={
                <ProtectedRoute>
                  <EditVenue />
                  </ProtectedRoute>
              }           
            />
            <Route 
              path="/favorites" 
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
              <Route 
                path="/stats" 
                element={
                  <ProtectedRoute>
                    <Stats />
                  </ProtectedRoute>
                } 
              />
          </Routes>
        </div>
      </Router>
  );
}
