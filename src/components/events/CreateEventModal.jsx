import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function CreateEventModal({ isOpen, onClose, onEventCreated }) {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    venue_id: '',
    image_url: '',
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchUserVenues();
    }
  }, [isOpen, user]);

  const fetchUserVenues = async () => {
    try {
      console.log('CreateEventModal: Fetching user venues...');
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, status')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      console.log('CreateEventModal: User venues fetched:', data);
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
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('CreateEventModal: Uploading image...', filePath);

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('events').getPublicUrl(filePath);
      console.log('CreateEventModal: Image uploaded, URL:', data.publicUrl);

      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
    } catch (error) {
      console.error('CreateEventModal: Error uploading image:', error);
      alert('Error al subir la imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('CreateEventModal: Creating event...', formData);
      const eventData = { ...formData, status: 'approved' };
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      console.log('CreateEventModal: Event created successfully:', data);
      alert('Evento creado exitosamente');
      onEventCreated(data);
      onClose();
      setFormData({
        name: '',
        description: '',
        event_date: '',
        venue_id: '',
        image_url: '',
      });
    } catch (err) {
      console.error('CreateEventModal: Error creating event:', err);
      alert('Error al crear el evento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-[#0f0f0f] border-b border-[#1a1a1a] p-6 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-white">Crear Evento</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {venues.length === 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400">
                  No tienes venues aprobados. Debes tener al menos un venue aprobado para crear eventos.
                </p>
              </div>
            )}

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 text-[#ff0080]" />
                <span>Nombre del Evento *</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
                placeholder="Ej: Noche de Reggaeton"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <MapPin className="w-4 h-4 text-[#ff0080]" />
                <span>Venue *</span>
              </label>
              <select
                name="venue_id"
                value={formData.venue_id}
                onChange={handleChange}
                required
                disabled={venues.length === 0}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecciona un venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 text-[#ff0080]" />
                <span>Fecha y Hora *</span>
              </label>
              <input
                type="datetime-local"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 text-[#ff0080]" />
                <span>Descripción</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] resize-none"
                placeholder="Describe el evento..."
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <ImageIcon className="w-4 h-4 text-[#ff0080]" />
                <span>Imagen del Evento</span>
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#2a2a2a] file:text-[#ff0080]
                    hover:file:bg-[#333333]
                    cursor-pointer"
                />
                {uploading && <p className="text-sm text-yellow-500">Subiendo imagen...</p>}
                {formData.image_url && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-[#2a2a2a]">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-[#1a1a1a]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || uploading || venues.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando...' : (uploading ? 'Subiendo imagen...' : 'Crear Evento')}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
