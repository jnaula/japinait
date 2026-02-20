import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Heart, Clock, DollarSign, Music, ArrowLeft, Send } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBBy7nFUipYZ1FDegs-SsgZ9d7ViAZqInI';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

const DAYS_TRANSLATION = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVenueDetails();
    incrementViewCount();
  }, [id]);

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
  }, [user, id]);

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment', {
        table_name: 'venues',
        row_id: id,
        column_name: 'view_count',
      });
    } catch (err) {
      console.log('VenueDetail: Could not increment view count');
    }
  };

  const fetchVenueDetails = async () => {
    setLoading(true);
    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select(`
          *,
          venue_types(name),
          profiles(full_name)
        `)
        .eq('id', id)
        .single();

      if (venueError) throw venueError;
      setVenue(venueData);

      const { data: photosData, error: photosError } = await supabase
        .from('venue_photos')
        .select('*')
        .eq('venue_id', id)
        .order('order_index');

      if (!photosError) {
        setPhotos(photosData || []);
      }

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('venue_id', id)
        .order('created_at', { ascending: false });

      if (!reviewsError) {
        setReviews(reviewsData || []);
      }
    } catch (err) {
      console.error('VenueDetail: Error fetching venue details:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('venue_id', id)
        .single();

      if (data && !error) {
        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    } catch (err) {
      console.log('VenueDetail: No favorite found');
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      alert('Por favor inicia sesión para agregar a favoritos');
      return;
    }

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
            venue_id: id,
          })
          .select()
          .single();

        if (!error && data) {
          setIsFavorite(true);
          setFavoriteId(data.id);
        }
      }
    } catch (err) {
      console.error('VenueDetail: Error toggling favorite:', err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Por favor inicia sesión para escribir una reseña');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          venue_id: id,
          user_id: user.id,
          rating,
          comment,
        });

      if (error) throw error;

      setComment('');
      setRating(5);
      fetchVenueDetails();
    } catch (err) {
      console.error('VenueDetail: Error submitting review:', err);
      alert('Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-400">Local no encontrado</p>
      </div>
    );
  }

  const primaryPhoto = photos.find((p) => p.is_primary) || photos[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="relative h-96 bg-[#1a1a1a] overflow-hidden">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.photo_url}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff0080] to-[#7928ca] opacity-20">
            <MapPin className="w-32 h-32 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        <div className="absolute top-6 left-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </motion.button>
        </div>
        <div className="absolute top-6 right-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFavorite}
            className="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
          >
            <Heart
              className={`w-6 h-6 ${
                isFavorite ? 'fill-[#ff0080] text-[#ff0080]' : 'text-white'
              }`}
            />
          </motion.button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{venue.name}</h1>
              {venue.venue_types && (
                <span className="inline-block px-3 py-1 rounded-full bg-[#7928ca]/20 text-[#7928ca] border border-[#7928ca]/30 text-sm">
                  {venue.venue_types.name}
                </span>
              )}
            </div>
            {venue.average_rating > 0 && (
              <div className="flex items-center space-x-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-4 py-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-xl font-bold text-white">
                  {venue.average_rating.toFixed(1)}
                </span>
                <span className="text-gray-400 text-sm">
                  ({venue.total_reviews || 0})
                </span>
              </div>
            )}
          </div>

          {venue.description && (
            <p className="text-gray-300 text-lg mb-6">{venue.description}</p>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <InfoCard icon={MapPin} label="Dirección" value={venue.address} />
            {venue.price_range && (
              <InfoCard icon={DollarSign} label="Rango de Precios" value={venue.price_range} />
            )}
            {venue.music_type && (
              <InfoCard icon={Music} label="Tipo de Música" value={venue.music_type} />
            )}
            
            {venue.opening_hours && (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 flex items-start space-x-3">
                <Clock className="w-5 h-5 text-[#ff0080] flex-shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="text-gray-500 text-sm mb-2">Horario de Atención</p>
                  <div className="space-y-1">
                    {DAYS_ORDER.map((dayKey) => {
                      const hours = venue.opening_hours[dayKey];
                      if (!hours || !hours.open || !hours.close) return null;
                      return (
                        <div key={dayKey} className="flex justify-between text-sm">
                          <span className="text-gray-400 w-24">{DAYS_TRANSLATION[dayKey]}:</span>
                          <span className="text-white font-medium">{hours.open} - {hours.close}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 overflow-hidden">
             <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-[#ff0080]" />
                <h3 className="text-white font-bold">Ubicación</h3>
             </div>
             <div className="w-full h-64 rounded-lg overflow-hidden">
               <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                 <Map
                   defaultZoom={15}
                   defaultCenter={{ lat: venue.latitude || -0.1807, lng: venue.longitude || -78.4678 }}
                   mapId="nerd-venue-detail-map"
                   options={{
                     styles: darkMapStyle,
                     streetViewControl: false,
                     mapTypeControl: false,
                     zoomControl: true,
                     fullscreenControl: false,
                   }}
                   className="w-full h-full"
                 >
                   <AdvancedMarker
                     position={{ lat: venue.latitude || -0.1807, lng: venue.longitude || -78.4678 }}
                   >
                     <div className="w-8 h-8 bg-[#ff0080] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                       <div className="w-3 h-3 bg-white rounded-full" />
                     </div>
                   </AdvancedMarker>
                 </Map>
               </APIProvider>
             </div>
          </div>

          {photos.length > 1 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Fotos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    whileHover={{ scale: 1.05 }}
                    className="aspect-square rounded-lg overflow-hidden bg-[#1a1a1a]"
                  >
                    <img
                      src={photo.photo_url}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Reseñas ({reviews.length})
            </h2>

            {user && (
              <form onSubmit={handleSubmitReview} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Escribir una Reseña</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Calificación
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <motion.button
                        key={value}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setRating(value)}
                      >
                        <Star
                          className={`w-8 h-8 ${
                            value <= rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-600'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">
                    Comentario
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Comparte tu experiencia..."
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors resize-none"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Enviando...' : 'Enviar Reseña'}</span>
                </motion.button>
              </form>
            )}

            <div className="space-y-4">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] flex items-center justify-center text-white font-bold">
                        {review.profiles?.full_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {review.profiles?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-medium">{review.rating}</span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-300">{review.comment}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 flex items-start space-x-3">
      <Icon className="w-5 h-5 text-[#ff0080] flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-gray-500 text-sm mb-1">{label}</p>
        <p className="text-white">{value}</p>
      </div>
    </div>
  );
}
