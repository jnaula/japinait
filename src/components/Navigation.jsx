import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Navigation() {
  const [profile, setProfile] = useState(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
      if (!error) setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) navigate('/');
  };

  // ── Helper: saber si una ruta está activa ──────────────────────────────────
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          NAVBAR SUPERIOR — DESKTOP
      ══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            <Link to={user ? '/home' : '/'} className="flex items-center">
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
                    <NavLink to="/home">Inicio</NavLink>
                    <NavLink to="/register-venue">Registro</NavLink>
                    <NavLink to="/dashboard">Panel</NavLink>
                    {/* Stats comentado — disponible en desktop para admins si se reactiva */}
                    {/* <NavLink to="/stats">Estadísticas</NavLink> */}
                  </>
                ) : (
                  <>
                    <NavLink to="/home">Inicio</NavLink>
                    <NavLink to="/map">Mapa</NavLink>
                    <NavLink to="/events">Eventos</NavLink>
                    <NavLink to="/favorites">Favoritos</NavLink>
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

      {/* ══════════════════════════════════════════════════════
          BOTTOM NAVIGATION — MÓVIL
      ══════════════════════════════════════════════════════ */}
      {user && profile && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10">

          {/* Línea de acento neón */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ff0080]/50 to-transparent" />

          <div className="flex justify-around items-center px-2 py-2">

            {/* ── ADMIN ──────────────────────────────────────────────────── */}
            {profile.role === 'venue_admin' ? (
              <>
                {/* Home — mismo que ven los usuarios normales */}
                <BottomTab
                  to="/home"
                  label="Home"
                  active={isActive('/home')}
                  icon={
                    <svg viewBox="0 0 24 24" fill={isActive('/home') ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                    </svg>
                  }
                />

                {/* Mapa */}
                <BottomTab
                  to="/map"
                  label="Mapa"
                  active={isActive('/map')}
                  icon={
                    <svg viewBox="0 0 24 24" fill={isActive('/map') ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  }
                />

                {/* Mis Locales — dashboard */}
                <BottomTab
                  to="/dashboard"
                  label="Mis Locales"
                  active={isActive('/dashboard')}
                  icon={
                    <svg viewBox="0 0 24 24" fill={isActive('/dashboard') ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />

                {/* Mi Perfil — NUEVA SECCIÓN */}
                <BottomTab
                  to="/admin/profile"
                  label="Mi Perfil"
                  active={isActive('/admin/profile')}
                  icon={
                    <svg viewBox="0 0 24 24" fill={isActive('/admin/profile') ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                {/*
                  ── OPCIONES ELIMINADAS — comentadas para uso futuro ──────────
                  <BottomTab to="/stats" label="Stats" active={isActive('/stats')} icon={...} />
                  <button onClick={handleLogout} className="flex flex-col items-center text-red-400 text-xs">
                    Salir
                  </button>
                  ────────────────────────────────────────────────────────────────
                */}
              </>
            ) : (
              /* ── USUARIO NORMAL ──────────────────────────────────────────── */
              <>
                <BottomTab to="/home"      label="Inicio"    active={isActive('/home')} icon={<HomeIcon active={isActive('/home')} />} />
                <BottomTab to="/map"       label="Mapa"      active={isActive('/map')} icon={<MapIcon active={isActive('/map')} />} />
                <BottomTab to="/events"    label="Eventos"   active={isActive('/events')} icon={<EventsIcon active={isActive('/events')} />} />
                <BottomTab to="/favorites" label="Favoritos" active={isActive('/favorites')} icon={<FavIcon active={isActive('/favorites')} />} />
                <BottomTab to="/profile"   label="Perfil"    active={isActive('/profile')}
  icon={
    <svg viewBox="0 0 24 24" fill={isActive('/profile') ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  }
/>
                {/*
                  Botón "Salir" del usuario normal — comentado para uso futuro
                  <button onClick={handleLogout} className="flex flex-col items-center text-red-400 text-xs">
                    Salir
                  </button>
                */}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function NavLink({ to, children }) {
  return (
    <Link to={to}>
      <motion.div whileHover={{ scale: 1.05 }} className="text-gray-300 hover:text-white transition-colors">
        {children}
      </motion.div>
    </Link>
  );
}

/**
 * BottomTab — ítem del menú inferior móvil con indicador de activo neón
 */
function BottomTab({ to, label, active, icon }) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-all duration-200 group
        ${active ? 'text-[#ff0080]' : 'text-gray-500 hover:text-gray-300'}`}
    >
      {/* Fondo glow cuando está activo */}
      {active && (
        <span className="absolute inset-0 rounded-xl bg-[#ff0080]/10 blur-sm" />
      )}

      {/* Línea superior indicadora */}
      {active && (
        <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-px bg-[#ff0080] rounded-full shadow-[0_0_8px_#ff0080]" />
      )}

      <span className={`relative z-10 transition-transform duration-200 ${active ? 'scale-110 drop-shadow-[0_0_5px_#ff0080]' : 'group-hover:scale-105'}`}>
        {icon}
      </span>

      <span className={`text-[10px] font-semibold tracking-wide relative z-10 leading-none
        ${active ? 'text-[#ff0080]' : ''}`}>
        {label}
      </span>
    </Link>
  );
}

// Iconos inline para usuarios normales (igual estructura SVG)
const HomeIcon    = ({ active }) => <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>;
const MapIcon     = ({ active }) => <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
const EventsIcon  = ({ active }) => <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const FavIcon     = ({ active }) => <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
