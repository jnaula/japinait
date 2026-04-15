// AdminProfile.jsx
// Nueva sección "Mi Perfil" para administradores de JapiNait.
// Ruta: /admin/profile  (agregar en App.jsx)
//
// Funcionalidades:
//   - Ver nombre, correo, teléfono
//   - Editar correo, teléfono
//   - Cambiar contraseña
//   - Listado de locales del administrador

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Lock, Building2, MapPin,
  ChevronRight, Check, X, Eye, EyeOff, LogOut,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AdminProfile() {
  const { user, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [myVenues, setMyVenues] = useState([]);
  const [loading, setLoading]   = useState(true);

  // ── Estados de edición ────────────────────────────────────────────────────
  const [editingEmail,    setEditingEmail]    = useState(false);
  const [editingPhone,    setEditingPhone]    = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const [newEmail,    setNewEmail]    = useState('');
  const [newPhone,    setNewPhone]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);

  const [saving,  setSaving]  = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyVenues();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setProfile(data);
      setNewEmail(data.email || '');
      setNewPhone(data.phone || '');
    } catch (err) {
      console.error('AdminProfile: Error fetching profile:', err);
    }
  };

  const fetchMyVenues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`*, venue_types(name), venue_photos(photo_url, is_primary)`)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const processed = data.map((venue) => {
        const primary = venue.venue_photos?.find((p) => p.is_primary);
        const photoPath = primary?.photo_url || venue.venue_photos?.[0]?.photo_url;
        const imageUrl = photoPath
          ? supabase.storage.from('venue-photos').getPublicUrl(photoPath).data.publicUrl
          : null;
        return { ...venue, venue_type_name: venue.venue_types?.name, imageUrl };
      });

      setMyVenues(processed);
    } catch (err) {
      console.error('AdminProfile: Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers de feedback ───────────────────────────────────────────────────
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  // ── Guardar correo ────────────────────────────────────────────────────────
  const handleSaveEmail = async () => {
    if (!newEmail || newEmail === profile?.email) { setEditingEmail(false); return; }
    setSaving(true);
    try {
      // Actualizar en Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
      if (authError) throw authError;

      // Actualizar en tabla profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: newEmail, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (profileError) throw profileError;

      setProfile((prev) => ({ ...prev, email: newEmail }));
      setEditingEmail(false);
      showMessage('success', 'Correo actualizado. Revisa tu bandeja para confirmar.');
    } catch (err) {
      showMessage('error', err.message || 'Error al actualizar correo');
    } finally {
      setSaving(false);
    }
  };

  // ── Guardar teléfono ──────────────────────────────────────────────────────
  const handleSavePhone = async () => {
    if (newPhone === (profile?.phone || '')) { setEditingPhone(false); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: newPhone, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;

      setProfile((prev) => ({ ...prev, phone: newPhone }));
      setEditingPhone(false);
      showMessage('success', 'Teléfono actualizado correctamente.');
    } catch (err) {
      showMessage('error', err.message || 'Error al actualizar teléfono');
    } finally {
      setSaving(false);
    }
  };

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmPass) {
      showMessage('error', 'Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSaving(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      setNewPassword('');
      setConfirmPass('');
      setEditingPassword(false);
      showMessage('success', 'Contraseña actualizada correctamente.');
    } catch (err) {
      showMessage('error', err.message || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  // ── Cerrar sesión ─────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-400">Debes iniciar sesión</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* ── ENCABEZADO ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">
            Mi <span className="text-[#ff0080]">Perfil</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tu cuenta y locales</p>
        </motion.div>

        {/* ── AVATAR + NOMBRE ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-4 mb-8 p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff0080] to-[#7928ca] flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">
              {profile?.full_name || 'Administrador'}
            </p>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#ff0080]/15 text-[#ff0080] border border-[#ff0080]/30 font-semibold">
              venue_admin
            </span>
          </div>
        </motion.div>

        {/* ── TOAST FEEDBACK ───────────────────────────────────────────── */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SECCIÓN: INFORMACIÓN ─────────────────────────────────────── */}
        <SectionTitle>Información de cuenta</SectionTitle>

        <div className="space-y-3 mb-8">

          {/* Correo */}
          <InfoRow
            icon={<Mail className="w-4 h-4 text-[#ff0080]" />}
            label="Correo electrónico"
            value={profile?.email || user.email}
            editing={editingEmail}
            onEdit={() => { setEditingEmail(true); setEditingPhone(false); setEditingPassword(false); }}
            onCancel={() => { setEditingEmail(false); setNewEmail(profile?.email || ''); }}
            onSave={handleSaveEmail}
            saving={saving}
          >
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-transparent text-white text-sm outline-none"
              autoFocus
            />
          </InfoRow>

          {/* Teléfono */}
          <InfoRow
            icon={<Phone className="w-4 h-4 text-[#7928ca]" />}
            label="Teléfono"
            value={profile?.phone || 'Sin registrar'}
            editing={editingPhone}
            onEdit={() => { setEditingPhone(true); setEditingEmail(false); setEditingPassword(false); }}
            onCancel={() => { setEditingPhone(false); setNewPhone(profile?.phone || ''); }}
            onSave={handleSavePhone}
            saving={saving}
            emptyHint="Agregar número"
          >
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+593 99 000 0000"
              className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
              autoFocus
            />
          </InfoRow>
        </div>

        {/* ── SECCIÓN: SEGURIDAD ───────────────────────────────────────── */}
        <SectionTitle>Seguridad</SectionTitle>

        <div className="mb-8">
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            <button
              onClick={() => { setEditingPassword(!editingPassword); setEditingEmail(false); setEditingPhone(false); }}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#161616] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#ff0080]/10 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-[#ff0080]" />
                </span>
                <div className="text-left">
                  <p className="text-white text-sm font-semibold">Contraseña</p>
                  <p className="text-gray-500 text-xs">Cambiar contraseña de acceso</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${editingPassword ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {editingPassword && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-[#1a1a1a]"
                >
                  <div className="px-4 py-4 space-y-3">
                    {/* Nueva contraseña */}
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nueva contraseña"
                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff0080] pr-10 transition-colors"
                      />
                      <button
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Confirmar contraseña */}
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Confirmar contraseña"
                      className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff0080] transition-colors"
                    />

                    {/* Botones */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSavePassword}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {saving ? 'Guardando...' : 'Actualizar'}
                      </button>
                      <button
                        onClick={() => { setEditingPassword(false); setNewPassword(''); setConfirmPass(''); }}
                        className="flex-1 py-2.5 rounded-xl bg-[#161616] border border-[#222] text-gray-400 text-sm font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── SECCIÓN: MIS LOCALES ─────────────────────────────────────── */}
        <SectionTitle>
          Mis locales{' '}
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[#ff0080]/15 text-[#ff0080] font-bold">
            {myVenues.length}
          </span>
        </SectionTitle>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myVenues.length === 0 ? (
          <div className="text-center py-8 bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl mb-8">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No tienes locales registrados</p>
            <a href="/register-venue"
              className="inline-block mt-3 px-5 py-2 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white text-sm font-semibold">
              Registrar local
            </a>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {myVenues.map((venue, i) => (
              <motion.button
                key={venue.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/venue/${venue.id}`)}
                className="w-full flex items-center gap-3 p-3 bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl hover:border-[#ff0080]/40 transition-colors text-left"
              >
                {/* Miniatura */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1a1a]">
                  {venue.imageUrl ? (
                    <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{venue.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
                    <span className="text-gray-500 text-xs truncate">{venue.address}</span>
                  </div>
                </div>

                {/* Badge status */}
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                  venue.status === 'approved'
                    ? 'bg-green-500/20 text-green-400'
                    : venue.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {venue.status === 'approved' ? 'Activo'
                    : venue.status === 'pending' ? 'Revisión'
                    : 'Rechazado'}
                </span>

                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        )}

        {/* ── CERRAR SESIÓN ────────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-semibold text-sm mb-4"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </motion.button>

      </div>
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
      {children}
    </h2>
  );
}

/**
 * InfoRow — fila editable para correo / teléfono
 */
function InfoRow({ icon, label, value, editing, onEdit, onCancel, onSave, saving, children, emptyHint }) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {!editing ? (
        <button
          onClick={onEdit}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[#161616] transition-colors"
        >
          <span className="w-8 h-8 rounded-lg bg-[#ff0080]/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </span>
          <div className="flex-1 text-left min-w-0">
            <p className="text-gray-500 text-xs mb-0.5">{label}</p>
            <p className="text-white text-sm font-medium truncate">{value || emptyHint || '—'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
        </button>
      ) : (
        <div className="px-4 py-3">
          <p className="text-gray-500 text-xs mb-2">{label}</p>
          <div className="flex items-center gap-2 bg-[#161616] border border-[#ff0080]/40 rounded-xl px-3 py-2.5 mb-3">
            <span className="flex-shrink-0">{icon}</span>
            <div className="flex-1">{children}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {saving ? 'Guardando...' : <><Check className="w-4 h-4" /> Guardar</>}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-[#161616] border border-[#222] text-gray-400 text-sm font-semibold flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
