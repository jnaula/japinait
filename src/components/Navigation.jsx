import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Navigation() {
  const [profile, setProfile] = useState(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
  await supabase.auth.signOut();
  navigate("/login");
};

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error) {
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  return (
    <>
      {/* NAVBAR SUPERIOR DESKTOP */}
      <nav className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <Link to={user ? "/home" : "/"} className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-2xl font-bold bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text"
              >
                JapiNait
              </motion.div>
            </Link>

            {/* LINKS DESKTOP */}
            <div className="hidden md:flex items-center space-x-6">
              {user && profile && (
                profile.role === 'venue_admin' ? (
                  <>
                    <NavLink to="/register-venue">Registro</NavLink>
                    <NavLink to="/dashboard">Panel</NavLink>
                    <NavLink to="/stats">Estadísticas</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/home">Inicio</NavLink>
                    <NavLink to="/map">Mapa</NavLink>
                    <NavLink to="/events">Eventos</NavLink>
                    <NavLink to="/favorites">Favoritos</NavLink>
                    <button 
  onClick={handleLogout}
  className="flex flex-col items-center text-red-400 text-xs"
>
  Salir
</button>
                  </>
                )
              )}
            </div>

            {/* PERFIL + LOGOUT DESKTOP */}
            <div className="hidden md:flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 border-2 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
              ) : user ? (
                <>
                  <div className="flex items-center space-x-2 text-gray-300 text-sm">
                    <User className="w-4 h-4" />
                    <span>{profile?.full_name || 'Usuario'}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium hover:opacity-90"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <button className="px-4 py-2 text-gray-300 hover:text-white">
                      Iniciar Sesión
                    </button>
                  </Link>
                  <Link to="/register">
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium hover:opacity-90">
                      Registrarse
                    </button>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* BOTTOM NAVIGATION MÓVIL */}
      {user && profile && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#0f0f0f] border-t border-[#1a1a1a] flex justify-around items-center h-16 z-50">
          {profile.role === 'venue_admin' ? (
            <>
              <MobileBottomLink to="/dashboard" label="Panel" />
              <MobileBottomLink to="/stats" label="Stats" />
              <MobileBottomLink to="/register-venue" label="Registro" />
            </>
          ) : (
            <>
              <MobileBottomLink to="/home" label="Inicio" />
              <MobileBottomLink to="/map" label="Mapa" />
              <MobileBottomLink to="/events" label="Eventos" />
              <MobileBottomLink to="/favorites" label="Favoritos" />
            </>
          )}
        </div>
      )}
    </>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="text-gray-300 hover:text-white transition-colors"
      >
        {children}
      </motion.div>
    </Link>
  );
}

function MobileBottomLink({ to, label }) {
  return (
    <Link to={to} className="flex flex-col items-center text-gray-400 hover:text-white text-xs">
      <span>{label}</span>
    </Link>
  );
}