// pages/UserProfile.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const updateEmail = async () => {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Correo actualizado' });
      setEditingEmail(false);
    }
  };

  const updatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Contraseña actualizada' });
      setEditingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 pb-24">
      <div className="max-w-xl mx-auto space-y-4">

        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>

        {message && (
          <div className={`p-3 rounded text-sm ${
            message.type === 'error'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-green-500/10 text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* EMAIL */}
        <div className="bg-[#0f0f0f] p-4 rounded-xl border border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
            <button onClick={() => setEditingEmail(!editingEmail)} className="text-[#ff0080] text-sm">
              Editar
            </button>
          </div>

          {editingEmail && (
            <div className="mt-3 space-y-2">
              <input
                type="email"
                placeholder="Nuevo correo"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-2 bg-[#1a1a1a] rounded text-white"
              />
              <button onClick={updateEmail} className="text-sm text-[#ff0080]">
                Guardar
              </button>
            </div>
          )}
        </div>

        {/* PASSWORD */}
        <div className="bg-[#0f0f0f] p-4 rounded-xl border border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white">
              <Lock size={16} />
              <span>Contraseña</span>
            </div>
            <button onClick={() => setEditingPassword(!editingPassword)} className="text-[#ff0080] text-sm">
              Cambiar
            </button>
          </div>

          {editingPassword && (
            <div className="mt-3 space-y-2">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 bg-[#1a1a1a] rounded text-white"
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-2 text-gray-400"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button onClick={updatePassword} className="text-sm text-[#ff0080]">
                Guardar
              </button>
            </div>
          )}
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white flex items-center justify-center space-x-2"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>

      </div>
    </div>
  );
}