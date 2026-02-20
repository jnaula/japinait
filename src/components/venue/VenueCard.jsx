import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function VenueCard({ venue }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
  }, [user, venue.id]);

  const checkFavorite = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('venue_id', venue.id)
        .single();

      if (data && !error) {
        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    } catch (err) {
      console.log('VenueCard: No favorite found');
    }
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Por favor inicia sesión para agregar favoritos');
      return;
    }

    setLoading(true);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', favoriteId);

        if (!error) {
          setIsFavorite(false);
          setFavoriteId(null);
        }
      } else {
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            venue_id: venue.id,
          })
          .select()
          .single();

        if (!error && data) {
          setIsFavorite(true);
          setFavoriteId(data.id);
        }
      }
    } catch (err) {
      console.error('VenueCard: Error toggling favorite:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link to={`/venue/${venue.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#ff0080] transition-colors group"
      >
        <div className="relative h-48 bg-[#1a1a1a] overflow-hidden">
          {venue.primary_photo ? (
            <img
              src={venue.primary_photo}
              alt={venue.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff0080] to-[#7928ca] opacity-20">
              <MapPin className="w-16 h-16 text-white" />
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFavorite}
            disabled={loading}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-[#ff0080] text-[#ff0080]' : 'text-white'
              }`}
            />
          </motion.button>
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ff0080] transition-colors">
            {venue.name}
          </h3>

          {venue.description && (
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {venue.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {venue.average_rating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-gray-300">
                    {venue.average_rating.toFixed(1)}
                  </span>
                </div>
              )}

              {venue.venue_type_name && (
                <span className="text-xs px-2 py-1 rounded-full bg-[#7928ca]/20 text-[#7928ca] border border-[#7928ca]/30">
                  {venue.venue_type_name}
                </span>
              )}
            </div>

            {venue.price_range && (
              <span className="text-sm text-gray-400">{venue.price_range}</span>
            )}
          </div>

          <div className="flex items-center space-x-1 text-gray-500 text-sm mt-3">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{venue.address}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
