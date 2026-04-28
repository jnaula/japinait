import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle, MapPin, Star, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '/src/assets/login.jpeg';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');

  React.useEffect(() => {
    if (user) navigate('/home');
  }, [user, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        setResetError('No encontramos una cuenta con ese correo electrónico.');
      } else {
        setResetStep(3);
      }
    } catch {
      setResetError('Ocurrió un error inesperado');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await signIn({ email, password });
      if (signInError) {
        setError(signInError.message || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }
      const userRole = data?.user?.user_metadata?.role || data?.user?.role;
      if (userRole === 'venue_admin') {
        navigate('/dashboard');
      } else {
        navigate('/home');
      }
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start">

      {/* ── FONDO GRADIENTE NOCTURNO ─────────────────────────────────── */}
      <div className="absolute inset-0 bg-[#050508]">
        {/* Luces de ambiente tipo neón */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff0080]/20 rounded-full blur-[120px]" />
        <div className="absolute top-10 right-1/4 w-80 h-80 bg-[#7928ca]/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-[#ff0080]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#7928ca]/15 rounded-full blur-[90px]" />
        {/* Overlay oscuro para profundidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-md px-4 pt-14 pb-8 flex flex-col items-center">

        {/* Logo + texto hero */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-8"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
            className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-[#ff0080]/50 shadow-2xl shadow-[#ff0080]/30 mb-5"
          >
            <img src={logo} alt="JapiNait" className="w-full h-full object-cover" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-black text-white mb-2 tracking-wide"
          >
            JapiNait
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-black text-white text-center leading-tight mb-2"
          >
            Tu próxima salida<br />
            empieza{' '}
            <span className="bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text">
              aquí
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-sm text-center"
          >
            Descubre los mejores locales, eventos<br />y experiencias nocturnas de Ecuador.
          </motion.p>
        </motion.div>

        {/* Formulario con fondo semitransparente */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <Mail className="w-4 h-4 text-[#ff0080]" />
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Correo electrónico
                </label>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080]/60 focus:ring-1 focus:ring-[#ff0080]/40 transition-colors text-sm"
              />
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-[#ff0080]" />
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Contraseña
                  </label>
                </div>
                <Dialog open={isResetOpen} onOpenChange={(open) => {
                  setIsResetOpen(open);
                  if (!open) { setResetStep(1); setResetEmail(''); setNewPassword(''); setResetError(''); }
                }}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-xs text-[#ff0080] hover:underline focus:outline-none">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Recuperar Contraseña</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        {resetStep === 1 && "Ingresa tu correo electrónico para verificar tu cuenta."}
                        {resetStep === 3 && "Revisa tu correo electrónico."}
                      </DialogDescription>
                    </DialogHeader>
                    {resetStep === 3 ? (
                      <div className="py-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">¡Correo Enviado!</h3>
                        <p className="text-sm text-gray-400 mb-6">Hemos enviado un enlace a tu correo para restablecer tu contraseña.</p>
                        <button onClick={() => setIsResetOpen(false)} className="w-full py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white transition-colors">
                          Cerrar
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                        {resetError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-500 text-xs">{resetError}</p>
                          </div>
                        )}
                        <div>
                          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">Correo Electrónico</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              id="reset-email" type="email" value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)} required placeholder="tu@ejemplo.com"
                              className="w-full pl-10 pr-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors"
                            />
                          </div>
                        </div>
                        <button type="submit" disabled={resetLoading}
                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center">
                          {resetLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Enviar Correo de Recuperación'}
                        </button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080]/60 focus:ring-1 focus:ring-[#ff0080]/40 transition-colors text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botón submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center space-x-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Registro */}
          <div className="mt-5 text-center">
            <p className="text-gray-500 text-sm">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-[#ff0080] hover:text-[#ff0080]/80 font-semibold">
                Regístrate
              </Link>
            </p>
          </div>
        </motion.div>

        {/* ── BARRA DE FEATURES ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full mt-5 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-4"
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-[#ff0080]/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#ff0080]" />
              </div>
              <p className="text-white text-xs font-medium text-center leading-tight">Los mejores locales</p>
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-[#7928ca]/20 flex items-center justify-center">
                <Star className="w-4 h-4 text-[#7928ca]" />
              </div>
              <p className="text-white text-xs font-medium text-center leading-tight">Eventos exclusivos</p>
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-8 h-8 rounded-full bg-[#ff0080]/20 flex items-center justify-center">
                <Heart className="w-4 h-4 text-[#ff0080]" />
              </div>
              <p className="text-white text-xs font-medium text-center leading-tight">Tu guía de la vida nocturna</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}