import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Calendar, Heart, MapPin, Eye, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CreateEventModal from '../components/events/CreateEventModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myVenues, setMyVenues] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

// 🔥 Convertir path de Supabase Storage a URL pública
const getImageUrl = (path) => {
  if (!path) return null;

  const { data } = supabase.storage
    .from('venue-photos')
    .getPublicUrl(path);

  return data?.publicUrl;
};

  
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyVenues();
      fetchMyEvents();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('Dashboard: Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      console.log('Dashboard: Profile fetched:', data);
      setProfile(data);
    } catch (err) {
      console.error('Dashboard: Error fetching profile:', err);
    }
  };

  const fetchMyVenues = async () => {
    setLoading(true);
    try {
      console.log('Dashboard: Fetching user venues...');
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          venue_types(name),
          venue_photos(photo_url, is_primary)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Dashboard: User venues fetched:', data);

      const processedVenues = data.map((venue) => {
        const primaryPhoto = venue.venue_photos?.find((p) => p.is_primary);
        return {
          ...venue,
          venue_type_name: venue.venue_types?.name,
          primary_photo: primaryPhoto?.photo_url || venue.venue_photos?.[0]?.photo_url,
        };
      });

      setMyVenues(processedVenues);
    } catch (err) {
      console.error('Dashboard: Error fetching user venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      console.log('Dashboard: Fetching user events...');
      const venueIds = myVenues.map((v) => v.id);
      if (venueIds.length === 0) return;

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venues(name)
        `)
        .in('venue_id', venueIds)
        .order('event_date', { ascending: false });

      if (error) throw error;

      console.log('Dashboard: User events fetched:', data);
      setMyEvents(data || []);
    } catch (err) {
      console.error('Dashboard: Error fetching user events:', err);
    }
  };

  const handleEventCreated = (newEvent) => {
    console.log('Dashboard: Event created:', newEvent);
    setMyEvents((prev) => [newEvent, ...prev]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso Restringido</h2>
          <p className="text-gray-400 mb-6">Debes iniciar sesión para ver tu dashboard</p>
          <a href="/login" className="px-6 py-3 bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white rounded-lg font-medium">
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Bienvenido, {profile?.full_name || user.email}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Building2 className="w-8 h-8 text-[#ff0080]" />
              <span className="text-3xl font-bold text-white">{myVenues.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Mis Locales</h3>
            <p className="text-gray-400 text-sm">Total registrados</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-white">
                {myVenues.filter((v) => v.status === 'approved').length}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">Aprobados</h3>
            <p className="text-gray-400 text-sm">Locales activos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-yellow-500" />
              <span className="text-3xl font-bold text-white">
                {myVenues.filter((v) => v.status === 'pending').length}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">Pendientes</h3>
            <p className="text-gray-400 text-sm">En revisión</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Mis Locales</h2>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEventModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Evento</span>
              </motion.button>
              <a
                href="/register-venue"
                className="px-4 py-2 bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Registrar Nuevo Local
              </a>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myVenues.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl"
          >
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tienes locales registrados</h3>
            <p className="text-gray-400 mb-6">Comienza registrando tu primer local</p>
            <a
              href="/register-venue"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white rounded-lg font-medium"
            >
              Registrar Local
            </a>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors"
              >
                {venue.primary_photo && (
                <img
                  src={getImageUrl(venue.primary_photo)}
                 alt={venue.name}
                  className="w-full h-48 object-cover"
                 />
                 )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{venue.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        venue.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : venue.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {venue.status === 'approved'
                        ? 'Aprobado'
                        : venue.status === 'pending'
                        ? 'Pendiente'
                        : 'Rechazado'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{venue.venue_type_name}</p>
                  <div className="flex items-start space-x-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{venue.address}</span>
                  </div>
                  <div className="mt-4 flex items-center space-x-4 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{venue.view_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{venue.total_favorites || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {myEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Mis Eventos ({myEvents.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEvents.slice(0, 6).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{event.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{event.venues?.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                  </div>
                  <span
                    className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'upcoming'
                        ? 'bg-blue-500/20 text-blue-400'
                        : event.status === 'ongoing'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {event.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}
