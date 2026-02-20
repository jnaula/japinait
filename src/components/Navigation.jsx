import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Navigation: user state:', user?.id);
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('Navigation: fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Navigation: Error fetching profile:', error);
        return;
      }

      console.log('Navigation: Profile fetched:', data);
      setProfile(data);
    } catch (err) {
      console.error('Navigation: Exception fetching profile:', err);
    }
  };

  const handleSignOut = async () => {
    console.log('Navigation: Sign out clicked');
    const { error } = await signOut();
    if (!error) {
      console.log('Navigation: Sign out successful, navigating to login');
      navigate('/');
      setIsOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={user ? "/home" : "/"} className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-2xl font-bold bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text"
            >
              JapiNait
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {user && profile ? (
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
                </>
              )
            ) : null}
          </div>

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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-gray-300 hover:text-white"
                  >
                    Iniciar Sesión
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium hover:opacity-90"
                  >
                    Registrarse
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-gray-300 hover:text-white">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        className="md:hidden overflow-hidden bg-[#0f0f0f] border-t border-[#1a1a1a]"
      >
        <div className="px-4 py-4 space-y-3">
          {user && profile ? (
            profile.role === 'venue_admin' ? (
              <>
                <MobileNavLink to="/register-venue" onClick={() => setIsOpen(false)}>Registro</MobileNavLink>
                <MobileNavLink to="/dashboard" onClick={() => setIsOpen(false)}>Panel</MobileNavLink>
                <MobileNavLink to="/stats" onClick={() => setIsOpen(false)}>Estadísticas</MobileNavLink>
              </>
            ) : (
              <>
                <MobileNavLink to="/home" onClick={() => setIsOpen(false)}>Inicio</MobileNavLink>
                <MobileNavLink to="/map" onClick={() => setIsOpen(false)}>Mapa</MobileNavLink>
                <MobileNavLink to="/events" onClick={() => setIsOpen(false)}>Eventos</MobileNavLink>
                <MobileNavLink to="/favorites" onClick={() => setIsOpen(false)}>Favoritos</MobileNavLink>
              </>
            )
          ) : null}
          <div className="border-t border-[#1a1a1a] pt-3">
            {loading ? (
              <div className="w-8 h-8 border-2 border-[#ff0080] border-t-transparent rounded-full animate-spin mx-auto" />
            ) : user ? (
              <>
                <div className="flex items-center space-x-2 text-gray-300 text-sm px-4 py-2">
                  <User className="w-4 h-4" />
                  <span>{profile?.full_name || 'Usuario'}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </motion.button>
              </>
            ) : (
              <div className="space-y-2">
                <Link to="/login" onClick={() => setIsOpen(false)} className="block">
                  <button className="w-full px-4 py-2 text-gray-300 hover:text-white border border-[#1a1a1a] rounded-lg">
                    Iniciar Sesión
                  </button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="block">
                  <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium">
                    Registrarse
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
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

function MobileNavLink({ to, children, onClick }) {
  return (
    <Link to={to} onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
      >
        {children}
      </motion.div>
    </Link>
  );
}
