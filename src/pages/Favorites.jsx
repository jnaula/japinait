import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import VenueCard from '../components/venue/VenueCard';

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      console.log('Favorites: Fetching user favorites...');
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          venues(
            *,
            venue_types(name),
            venue_photos(photo_url, is_primary)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Favorites: User favorites fetched:', data);

      const processedFavorites = data.map((fav) => {
        const venue = fav.venues;
        const primaryPhoto = venue.venue_photos?.find((p) => p.is_primary);
        return {
          favorite_id: fav.id,
          favorite_created_at: fav.created_at,
          ...venue,
          venue_type_name: venue.venue_types?.name,
          primary_photo: primaryPhoto?.photo_url || venue.venue_photos?.[0]?.photo_url,
        };
      });

      setFavorites(processedFavorites);
    } catch (err) {
      console.error('Favorites: Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      console.log('Favorites: Removing favorite:', favoriteId);
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      console.log('Favorites: Favorite removed successfully');
      setFavorites((prev) => prev.filter((fav) => fav.favorite_id !== favoriteId));
    } catch (err) {
      console.error('Favorites: Error removing favorite:', err);
      alert('Error al eliminar el favorito: ' + err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso Restringido</h2>
          <p className="text-gray-400 mb-6">Debes iniciar sesión para ver tus favoritos</p>
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
          <h1 className="text-4xl font-bold text-white mb-2">
            Mis <span className="bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text">Favoritos</span>
          </h1>
          <p className="text-gray-400">Tus locales guardados en un solo lugar</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl"
          >
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Aún no tienes favoritos</h2>
            <p className="text-gray-400 mb-6">Comienza a explorar y guarda tus locales favoritos</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white rounded-lg font-medium"
            >
              Explore Venues
            </a>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {favorites.map((venue, index) => (
              <motion.div
                key={venue.favorite_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <VenueCard venue={venue} />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveFavorite(venue.favorite_id)}
                  className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors z-10"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
