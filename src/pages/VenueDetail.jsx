import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Heart, Clock, DollarSign, Music, ArrowLeft, Send, Edit, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {tag} from 'lucide-react';

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
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
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

function parseOpeningHours(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

function VenueMapContent({ venueLat, venueLng, onUserLocation }) {
  const map = useMap();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!map) return;

    const tryNative = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });

    const tryNetwork = async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_MAPS_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ considerIp: true }),
          }
        );
        const data = await res.json();
        if (data.location) return { lat: data.location.lat, lng: data.location.lng };
        return null;
      } catch {
        return null;
      }
    };

    (async () => {
      let coords = await tryNative();
      if (!coords) coords = await tryNetwork();
      if (!coords) return;

      setUserLocation(coords);
      onUserLocation(coords);

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: coords.lat, lng: coords.lng });
      bounds.extend({ lat: venueLat, lng: venueLng });
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    })();
  }, [map, venueLat, venueLng]);

  return (
    <>
      <AdvancedMarker position={{ lat: venueLat, lng: venueLng }}>
        <div className="w-8 h-8 bg-[#7928ca] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      </AdvancedMarker>

      {userLocation && (
        <AdvancedMarker position={userLocation}>
          <div className="w-6 h-6 bg-[#ff0080] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </AdvancedMarker>
      )}
    </>
  );
}

export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
const [showPromotions, setShowPromotions] = useState(false);
  const [venue, setVenue] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const touchStartX = useRef(null);
  const lightboxTouchStartX = useRef(null);
  

   useEffect(() => {
    
    fetchVenueDetails();

  },
   [id]);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      checkFavorite();
    }
  }, [user, id]);

  useEffect(() => {
    if (photos.length === 0) return;
    const urls = photos.map((p) =>
      supabase.storage.from('venue-photos').getPublicUrl(p.photo_url).data.publicUrl
    );
    setPhotoUrls(urls);
  }, [photos]);

  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % photoUrls.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, photoUrls.length]);

  const fetchUserRole = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!error && data) setUserRole(data.role);
  };

  const fetchVenueDetails = async () => {
    setLoading(true);
    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select(`*, venue_types(name), profiles(full_name)`)
        .eq('id', id)
        .single();
      if (venueError) throw venueError;
      setVenue(venueData);

          const { data: promoData } = await supabase
  .from('promotions')
  .select('*')
  .eq('venue_id', id)
  .order('created_at', { ascending: false });
setPromotions(promoData || []);

      const { data: photosData, error: photosError } = await supabase
        .from('venue_photos')
        .select('*')
        .eq('venue_id', id)
        .order('is_primary',{ascending:false})
        .order('order_index');
      if (!photosError) setPhotos(photosData || []);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`*, profiles(full_name)`)
        .eq('venue_id', id)
        .order('created_at', { ascending: false });
      if (!reviewsError) setReviews(reviewsData || []);
    } catch (err) {
      console.error('VenueDetail: Error:', err);
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
      if (data && !error) setIsFavorite(true);
    } catch {}
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Por favor inicia sesión para agregar favoritos');
      return;
    }
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('venue_id', venue.id);
        if (!error) setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, venue_id: venue.id });
        if (!error) setIsFavorite(true);
      }
    } catch (err) {
      console.error('VenueDetail: Error toggling favorite:', err);
    } finally {
      setFavoriteLoading(false);
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
        .insert({ venue_id: id, user_id: user.id, rating, comment });
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

  const handleHeroTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setHeroIndex((i) => (i + 1) % photoUrls.length);
      else setHeroIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length);
    }
    touchStartX.current = null;
  };

  const handleLightboxTouchStart = (e) => {
    lightboxTouchStartX.current = e.touches[0].clientX;
  };

  const handleLightboxTouchEnd = (e) => {
    if (lightboxTouchStartX.current === null) return;
    const diff = lightboxTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setLightboxIndex((i) => (i + 1) % photoUrls.length);
      else setLightboxIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length);
    }
    lightboxTouchStartX.current = null;
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

  const openingHours = parseOpeningHours(venue.opening_hours);
  const hasHours = openingHours && Object.values(openingHours).some((h) => h?.open && h?.close);

  const directionsUrl = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${venue.latitude},${venue.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* HERO */}
      <div
        className="relative h-96 bg-[#1a1a1a] overflow-hidden select-none"
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
      >
        {photoUrls.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.img
                key={heroIndex}
                src={photoUrls[heroIndex]}
                alt={venue.name}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                onClick={() => setLightboxIndex(heroIndex)}
                className="w-full h-full object-cover absolute inset-0 cursor-zoom-in"
              />
            </AnimatePresence>

            {photoUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHeroIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHeroIndex((i) => (i + 1) % photoUrls.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
                  {photoUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeroIndex(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === heroIndex ? 'bg-white scale-125' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                <div className="absolute bottom-16 right-6 z-10 text-xs text-white/70 bg-black/40 px-2 py-1 rounded-full">
                  {heroIndex + 1} / {photoUrls.length}
                </div>
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-xs text-white/50">
              Toca la foto para ampliar
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff0080] to-[#7928ca] opacity-20">
            <MapPin className="w-32 h-32 text-white" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-6 left-6 z-10">
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

        <div className="absolute top-6 right-6 flex items-center space-x-2 z-10">
          {userRole === 'venue_admin' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(`/edit-venue/${venue.id}`)}
              className="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
            >
              <Edit className="w-6 h-6 text-white" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 disabled:opacity-50"
          >
            <Heart
              className={`w-6 h-6 ${isFavorite ? 'fill-[#ff0080] text-[#ff0080]' : 'text-white'}`}
            />
          </motion.button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

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
                <span className="text-gray-400 text-sm">({venue.total_reviews || 0})</span>
              </div>
            )}
          </div>

          {venue.description && (
            <div className="text-gray-300 text-lg mb-6 space-y-3">
              {venue.description
                .split('\n')
                .filter((line) => line.trim() !== '')
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </div>
          )}

          {promotions.length > 0 && (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => setShowPromotions(true)}
    className="flex items-center space-x-2 mb-6 px-5 py-3 rounded-xl bg-gradient-to-r from-[#ff0080]/20 to-[#7928ca]/20 border border-[#ff0080]/30 text-white hover:border-[#ff0080]/60 transition-all"
  >
    <Tag className="w-5 h-5 text-[#ff0080]" />
    <span className="font-semibold">Ver promociones</span>
    <span className="ml-1 px-2 py-0.5 rounded-full bg-[#ff0080] text-white text-xs font-bold">
      {promotions.length}
    </span>
  </motion.button>
)}


          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <InfoCard icon={MapPin} label="Dirección" value={venue.address} />
            {venue.price_range && (
              <InfoCard icon={DollarSign} label="Rango de Precios" value={venue.price_range} />
            )}
            {venue.music_type && (
              <InfoCard icon={Music} label="Tipo de Música" value={venue.music_type} />
            )}
            {hasHours && (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 flex items-start space-x-3">
                <Clock className="w-5 h-5 text-[#ff0080] flex-shrink-0 mt-0.5" />
                <div className="w-full">
                  <p className="text-gray-500 text-sm mb-2">Horario de Atención</p>
                  <div className="space-y-1">
                    {DAYS_ORDER.map((dayKey) => {
                      const hours = openingHours[dayKey];
                      if (!hours?.open || !hours?.close) return null;
                      return (
                        <div key={dayKey} className="flex justify-between text-sm">
                          <span className="text-gray-400 w-24">{DAYS_TRANSLATION[dayKey]}:</span>
                          <span className="text-white font-medium">
                            {hours.open} - {hours.close}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mapa */}
          <div className="mb-8 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#ff0080]" />
                <h3 className="text-white font-bold">Ubicación</h3>
              </div>
               <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <MapPin className="w-4 h-4" />
                <span>Cómo llegar</span>
              </a>
            </div>
            <div className="w-full h-64 rounded-lg overflow-hidden">
              
                <Map
                  defaultZoom={14}
                  defaultCenter={{
                    lat: venue.latitude || -0.1807,
                    lng: venue.longitude || -78.4678,
                  }}
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
                  <VenueMapContent
                    venueLat={venue.latitude || -0.1807}
                    venueLng={venue.longitude || -78.4678}
                    onUserLocation={setUserLocation}
                  />
                </Map>
              
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Pin rosa → tu ubicación · Pin morado → el local
            </p>
          </div>

          {/* Reseñas */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Reseñas ({reviews.length})
            </h2>

            {user && (
              <form
                onSubmit={handleSubmitReview}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6 mb-6"
              >
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
                            value <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'
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

      {/* MODAL PROMOCIONES */}
<AnimatePresence>
  {showPromotions && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={() => setShowPromotions(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-[#ff0080]" />
            <h3 className="text-white font-bold text-lg">Promociones</h3>
          </div>
          <button
            onClick={() => setShowPromotions(false)}
            className="p-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de promos */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {promotions.map((promo, i) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">{promo.title}</p>
                  {promo.description && (
                    <p className="text-gray-400 text-sm">{promo.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {photoUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length);
                  }}
                  className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i + 1) % photoUrls.length);
                  }}
                  className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIndex}
                src={photoUrls[lightboxIndex]}
                alt={venue.name}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg"
              />
            </AnimatePresence>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5">
              {photoUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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