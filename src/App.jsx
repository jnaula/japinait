import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { APIProvider } from '@vis.gl/react-google-maps';
import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import AdminProfile from './pages/AdminProfile';
import UserProfile from './pages/UserProfile';
import ProtectedRoute from './components/ProtectedRoute';
import EditVenue from './pages/EditVenue';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBBy7nFUipYZ1FDegs-SsgZ9d7ViAZqInI';

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let handler;

    CapacitorApp.addListener('backButton', () => {
      if (
        location.pathname === '/home' ||
        location.pathname === '/login' ||
        location.pathname === '/'
      ) {
        CapacitorApp.minimizeApp();
      } else {
        navigate(-1);
      }
    }).then(h => { handler = h; });

    return () => {
      if (handler) handler.remove();
    };
  }, [location, navigate]);

  return null;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Router>
        <BackButtonHandler />
        <div className="min-h-screen bg-[#0a0a0a] pb-16 md:pb-0">
          <Navigation />
          <Routes key={window.location.pathname}>

            {/* ── Rutas públicas ──────────────────────────────────────── */}
            <Route path="/"                element={<Login />} />
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/reset-password"  element={<PasswordReset />} />
            <Route path="/update-password" element={<UpdatePassword />} />

            {/* ── Rutas híbridas ──────────────────────────────────────── */}
            <Route path="/home"        element={<Home />} />
            <Route path="/map"         element={<MapPage />} />
            <Route path="/venue/:id"   element={<VenueDetail />} />
            <Route path="/events"      element={<Events />} />

            {/* ── Rutas protegidas — usuario normal ───────────────────── */}
            <Route path="/register-venue" element={<ProtectedRoute><RegisterVenue /></ProtectedRoute>} />
            <Route path="/edit-venue/:id" element={<ProtectedRoute><EditVenue /></ProtectedRoute>} />
            <Route path="/favorites"      element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/profile"        element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

            {/* ── Rutas protegidas — administrador ────────────────────── */}
            <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin"          element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/stats"          element={<ProtectedRoute><Stats /></ProtectedRoute>} />
            <Route path="/admin/profile"  element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />

          </Routes>
        </div>
      </Router>
    </APIProvider>
  );
}