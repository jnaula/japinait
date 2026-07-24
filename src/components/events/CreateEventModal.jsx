import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const UPLOAD_TIPS = [
  '📸 Los eventos con foto reciben 3x más atención',
  '🎨 Una buena foto hace que más gente quiera ir',
  '🔥 Sube el flyer del evento para más impacto',
];

export default function CreateEventModal({ isOpen, onClose, onEventCreated }) {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tipIndex] = useState(() => Math.floor(Math.random() * UPLOAD_TIPS.length));
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    venue_id: '',
    photo_url: '',
  });

  useEffect(() => {
    if (isOpen && user) fetchUserVenues();
  }, [isOpen, user]);

  const fetchUserVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .order('name');
      if (error) throw error;
      setVenues(data || []);
    } catch (err) {
      console.error('CreateEventModal: Error fetching venues:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('La imagen no puede superar 8MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // ✅ Usar getPublicUrl correctamente
      const { data } = supabase.storage.from('events').getPublicUrl(fileName);
      setFormData((prev) => ({ ...prev, photo_url: data.publicUrl }));
    } catch (err) {
      console.error('CreateEventModal: Upload error:', err);
      alert('Error al subir la imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.venue_id) { alert('Selecciona un local'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...formData, status: 'approved', created_by: user.id }])
        .select()
        .single();
      if (error) throw error;
      alert('¡Evento creado! 🎉');
      onEventCreated?.(data);
      onClose();
      setFormData({ name: '', description: '', event_date: '', venue_id: '', photo_url: '' });
    } catch (err) {
      console.error('CreateEventModal: Error:', err);
      alert('Error al crear el evento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80" onClick={onClose}>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#0f0f0f] rounded-t-3xl border-t border-[#1a1a1a] max-h-[95vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#0f0f0f] border-b border-[#1a1a1a] px-5 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-black text-white">Crear Evento</h2>
              <p className="text-gray-500 text-xs mt-0.5">Llega a más personas con tu evento</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {venues.length === 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-sm text-yellow-400">
                  Necesitas tener al menos un local aprobado para crear eventos.
                </p>
              </div>
            )}

            {/* Imagen — va primero para motivar */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                <ImageIcon className="w-4 h-4 text-[#ff0080]" />
                Imagen del evento
              </label>

              {/* Tip motivador */}
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-[#7928ca]/10 border border-[#7928ca]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#a855f7] flex-shrink-0" />
                <p className="text-[#a855f7] text-xs font-medium">{UPLOAD_TIPS[tipIndex]}</p>
              </div>

              {formData.photo_url ? (
                /* Preview de imagen subida */
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-[#2a2a2a] group">
                  <img src={formData.photo_url} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, photo_url: '' }))}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold"
                    >
                      Cambiar imagen
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-white text-xs font-medium">Imagen lista</span>
                  </div>
                </div>
              ) : (
                /* Upload zone */
                <label className={`relative flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  uploading
                    ? 'border-[#7928ca]/50 bg-[#7928ca]/5'
                    : 'border-[#2a2a2a] bg-[#161616] hover:border-[#ff0080]/50 hover:bg-[#ff0080]/5'
                }`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#7928ca] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[#7928ca] text-sm font-medium">Subiendo...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center px-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#ff0080]/10 flex items-center justify-center mb-1">
                        <ImageIcon className="w-6 h-6 text-[#ff0080]" />
                      </div>
                      <p className="text-white text-sm font-semibold">Toca para subir imagen</p>
                      <p className="text-gray-600 text-xs">PNG, JPG hasta 8MB · Recomendado: flyer del evento</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                <Calendar className="w-4 h-4 text-[#ff0080]" />
                Nombre del evento *
              </label>
              <input
                type="text" name="name" value={formData.name} onChange={handleChange} required
                placeholder="Ej: Noche de Reggaeton · Viernes de Salsa"
                className="w-full px-4 py-3 bg-[#161616] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080] text-sm"
              />
            </div>

            {/* Local */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                <MapPin className="w-4 h-4 text-[#ff0080]" />
                Local *
              </label>
              <select
                name="venue_id" value={formData.venue_id} onChange={handleChange} required
                disabled={venues.length === 0}
                className="w-full px-4 py-3 bg-[#161616] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#ff0080] text-sm disabled:opacity-50"
              >
                <option value="">Selecciona un local</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                <Clock className="w-4 h-4 text-[#ff0080]" />
                Fecha y hora *
              </label>
              <input
                type="datetime-local" name="event_date" value={formData.event_date} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#161616] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#ff0080] text-sm"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                <FileText className="w-4 h-4 text-[#ff0080]" />
                Descripción
                <span className="text-gray-600 text-xs font-normal">· Opcional</span>
              </label>
              <textarea
                name="description" value={formData.description} onChange={handleChange} rows={3}
                placeholder="Describe el evento, artistas, precio de entrada..."
                className="w-full px-4 py-3 bg-[#161616] border border-[#222] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080] text-sm resize-none"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2 pb-4">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-[#1a1a1a] text-gray-300 font-semibold text-sm hover:bg-[#2a2a2a] transition-colors">
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploading || venues.length === 0 || !formData.name || !formData.event_date || !formData.venue_id}
                className="flex-2 flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(90deg, #ff0080, #7928ca)' }}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Creando...</span></>
                ) : uploading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Subiendo imagen...</span></>
                ) : (
                  '🎉 Crear Evento'
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
