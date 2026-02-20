import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, resetPassword, updatePasswordForEmail, user } = useAuth(); // signInWithGoogle removed or needs to be added to context export
  const navigate = useNavigate();

  // Forgot Password State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: New Password
  const [newPassword, setNewPassword] = useState('');

  React.useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    try {
      if (resetStep === 1) {
        // Verify email exists
        const { error } = await resetPassword(resetEmail);
        
        if (error) {
          setResetError('No encontramos una cuenta con ese correo electrónico.');
        } else {
          setResetStep(3); // Go directly to success/check email
        }
      } 
      // Step 2 is removed/skipped as we don't ask for password here anymore
    } catch (err) {
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
        console.error('Login error:', signInError);
        setError(signInError.message || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Check role from user_metadata (Supabase Auth) or role property (legacy/custom)
      const userRole = data?.user?.user_metadata?.role || data?.user?.role;
      
      if (userRole === 'venue_admin') {
        navigate('/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      console.error('Login: Exception:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] mb-4"
            >
              <LogIn className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Bienvenido de Vuelta</h2>
            <p className="text-gray-400">Inicia sesión para descubrir la vida nocturna de Ecuador</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-500 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Tipo de Usuario
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#ff0080] transition-colors">
                  <input
                    type="radio"
                    name="userType"
                    value="user"
                    checked={userType === 'user'}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-4 h-4 text-[#ff0080] focus:ring-[#ff0080] focus:ring-offset-0"
                  />
                  <span className="ml-3 text-white">Usuario - Explorar la vida nocturna</span>
                </label>
                <label className="flex items-center p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#ff0080] transition-colors">
                  <input
                    type="radio"
                    name="userType"
                    value="owner"
                    checked={userType === 'owner'}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-4 h-4 text-[#ff0080] focus:ring-[#ff0080] focus:ring-offset-0"
                  />
                  <span className="ml-3 text-white">Administrador de Local - Gestionar locales</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@ejemplo.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Contraseña
                </label>
                
                <Dialog open={isResetOpen} onOpenChange={(open) => {
                  setIsResetOpen(open);
                  if (!open) {
                    setResetStep(1);
                    setResetEmail('');
                    setNewPassword('');
                    setResetError('');
                  }
                }}>
                  <DialogTrigger asChild>
                    <button 
                      type="button"
                      className="text-xs text-[#ff0080] hover:underline focus:outline-none"
                    >
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
                        <p className="text-sm text-gray-400 mb-6">
                          Hemos enviado un enlace a tu correo para restablecer tu contraseña.
                        </p>
                        <button
                          onClick={() => setIsResetOpen(false)}
                          className="w-full py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white transition-colors"
                        >
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
                          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
                            Correo Electrónico
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              id="reset-email"
                              type="email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                              placeholder="tu@ejemplo.com"
                              className="w-full pl-10 pr-4 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={resetLoading}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
                          >
                            {resetLoading ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'Enviar Correo de Recuperación'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors"
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-[#ff0080] hover:text-[#ff0080]/80 font-medium">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
