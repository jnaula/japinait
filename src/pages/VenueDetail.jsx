import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Star, Heart, Clock, DollarSign, Music, ArrowLeft, Edit,
  ChevronLeft, ChevronRight, X, Tag, Phone, MessageCircle, Share2,
  Navigation, CheckCircle2, Truck, Package, CreditCard
} from 'lucide-react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getVenueConfig } from '../config/venueTypeConfig';
import VenueTypeDetails from '../components/venue/VenueTypeDetails';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBBy7nFUipYZ1FDegs-SsgZ9d7ViAZqInI';

const PRODUCT_EMOJIS = {
  Cervezas: '🍺', Whisky: '🥃', Ron: '🍹', Vodka: '🍸', Vino: '🍷',
  Tequila: '🥂', Energizantes: '⚡', Hielo: '🧊', Snacks: '🍟',
};

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
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function parseOpeningHours(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
  return raw;
}

// ── Calcula si está abierto ahora ────────────────────────────────────────────
function isOpenNow(openingHours) {
  if (!openingHours) return null;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const dayKey = days[now.getDay()];
  const hours = openingHours[dayKey];
  if (!hours?.open || !hours?.close) return false;

  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = oh * 60 + om;
  let closeMinutes = ch * 60 + cm;
  if (closeMinutes < openMinutes) closeMinutes += 24 * 60; // cierre después de medianoche

  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
}

// ── Obtiene el horario de hoy ─────────────────────────────────────────────────
function getTodayHours(openingHours) {
  if (!openingHours) return null;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayKey = days[new Date().getDay()];
  const hours = openingHours[dayKey];
  if (!hours?.open || !hours?.close) return null;
  return `${hours.open} - ${hours.close}`;
}

// ── Mapa ──────────────────────────────────────────────────────────────────────
function VenueMapContent({ venueLat, venueLng, onUserLocation }) {
  const map = useMap();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!map) return;
    const tryNative = () => new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
    (async () => {
      const coords = await tryNative();
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

// ── Chip de info rápida ───────────────────────────────────────────────────────
function QuickChip({ icon, label, value, onClick }) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-1 p-3 bg-[#161616] border border-[#242424] rounded-xl min-w-[72px] ${onClick ? 'cursor-pointer hover:border-[#7928ca]/40 transition-colors' : ''}`}
      onClick={onClick}
    >
      <span className="text-base">{icon}</span>
      <span className="text-gray-500 text-[10px] font-medium leading-none">{label}</span>
      <span className="text-white text-[11px] font-semibold text-center leading-tight">{value}</span>
    </div>
  );
  return content;
}

// ── Componente principal ──────────────────────────────────────────────────────
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
  const [userLocation, setUserLocation] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showHours, setShowHours] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userExistingReview, setUserExistingReview] = useState(null);

  const touchStartX = useRef(null);
  const lightboxTouchStartX = useRef(null);
  const isOwner = user && venue && venue.owner_id === user.id;
  const isLicoreria = venue?.venue_types?.name?.toLowerCase().includes('licor');

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [id]);
  useEffect(() => { fetchVenueDetails(); }, [id]);
  useEffect(() => { if (user) { fetchUserRole(); checkFavorite(); } }, [user, id]);
  useEffect(() => {
    if (photos.length === 0) return;
    const urls = photos.map((p) => supabase.storage.from('venue-photos').getPublicUrl(p.photo_url).data.publicUrl);
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
  useEffect(() => {
    if (user && reviews.length > 0) {
      const existing = reviews.find((r) => r.user_id === user.id);
      if (existing) { setUserExistingReview(existing); setUserRating(existing.rating); }
    }
  }, [user, reviews]);

  const fetchUserRole = async () => {
    const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!error && data) setUserRole(data.role);
  };

  const fetchVenueDetails = async () => {
    setLoading(true);
    try {
      const { data: venueData, error: venueError } = await supabase
        .from('venues').select(`*, venue_types(name), profiles(full_name)`).eq('id', id).single();
      if (venueError) throw venueError;
      setVenue(venueData);

      const { data: promoData } = await supabase.from('promotions').select('*').eq('venue_id', id).order('created_at', { ascending: false });
      setPromotions(promoData || []);

      const { data: photosData, error: photosError } = await supabase
        .from('venue_photos').select('*').eq('venue_id', id)
        .order('is_primary', { ascending: false }).order('order_index');
      if (!photosError) setPhotos(photosData || []);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews').select(`*, profiles(full_name)`).eq('venue_id', id).order('created_at', { ascending: false });
      if (!reviewsError) setReviews(reviewsData || []);
    } catch (err) {
      console.error('VenueDetail: Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const { data, error } = await supabase.from('user_favorites').select('id').eq('user_id', user.id).eq('venue_id', id).single();
      if (data && !error) setIsFavorite(true);
    } catch {}
  };

  const toggleFavorite = async () => {
    if (!user) { alert('Por favor inicia sesión para agregar favoritos'); return; }
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('venue_id', venue.id);
        setIsFavorite(false);
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, venue_id: venue.id });
        setIsFavorite(true);
      }
    } catch (err) { console.error(err); } finally { setFavoriteLoading(false); }
  };

  const handleSubmitRating = async (selectedRating) => {
    if (!user) { alert('Inicia sesión para calificar'); return; }
    if (userRole === 'venue_admin') return;
    setSubmittingRating(true);
    try {
      const { error } = await supabase.from('reviews').upsert(
        { venue_id: id, user_id: user.id, rating: selectedRating, comment: userExistingReview?.comment || null },
        { onConflict: 'user_id,venue_id' }
      );
      if (error) throw error;
      setUserRating(selectedRating);
      fetchVenueDetails();
    } catch (err) {
      alert('Error al guardar la calificación');
    } finally { setSubmittingRating(false); }
  };

  const handleHeroTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleHeroTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setHeroIndex((i) => (i + 1) % photoUrls.length);
      else setHeroIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length);
    }
    touchStartX.current = null;
  };
  const handleLightboxTouchStart = (e) => { lightboxTouchStartX.current = e.touches[0].clientX; };
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
        <div className="w-12 h-12 border-4 border-[#7928ca] border-t-transparent rounded-full animate-spin" />
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
  const openStatus = hasHours ? isOpenNow(openingHours) : null;
  const todayHours = hasHours ? getTodayHours(openingHours) : null;

  const directionsUrl = userLocation
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${venue.latitude},${venue.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const displayRating = venue.average_rating > 0 ? venue.average_rating.toFixed(1) : avgRating;
  const displayReviews = venue.total_reviews || reviews.length;

  const phoneClean = venue.phone?.replace(/\s/g, '') || '';
  const whatsappClean = venue.whatsapp?.replace(/\s/g, '') || '';
  const whatsappUrl = whatsappClean ? `https://wa.me/${whatsappClean.replace('+', '')}` : null;

  const venueDetails = venue.venue_details || {};
  const venueConfig = getVenueConfig(venue.venue_types?.name);

  // Descripción con "Ver más"
  const DESC_LIMIT = 120;
  const desc = venue.description || '';
  const descNeedsExpand = desc.length > DESC_LIMIT;
  const descShown = descExpanded || !descNeedsExpand ? desc : desc.slice(0, DESC_LIMIT) + '...';

  // Primera promo destacada
  const featuredPromo = promotions[0] || null;

  // Quick info chips según tipo
  const quickChips = [];
  if (todayHours) quickChips.push({ icon: '🕐', label: 'Horario', value: todayHours, action: () => setShowHours(true) });
  if (venueDetails.cover) quickChips.push({ icon: '🎫', label: 'Cover', value: venueDetails.cover });
  if (venue.music_type || venueDetails.genero_musical) quickChips.push({ icon: '🎵', label: 'Música', value: venue.music_type || venueDetails.genero_musical });
  if (venueDetails.ambiente) quickChips.push({ icon: '🔥', label: 'Ambiente', value: venueDetails.ambiente });
  if (venueDetails.codigo_vestimenta) quickChips.push({ icon: '👔', label: 'Dress Code', value: venueDetails.codigo_vestimenta });
  if (venueDetails.dj_residente) quickChips.push({ icon: '🎧', label: 'DJ', value: venueDetails.dj_residente });
  if (venueDetails.vista_panoramica) quickChips.push({ icon: '🌆', label: 'Vista', value: venueDetails.vista_panoramica });
  if (venueDetails.happy_hour) quickChips.push({ icon: '🍺', label: 'Happy Hour', value: venueDetails.happy_hour });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div
        className="relative bg-[#161616] overflow-hidden select-none"
        style={{ height: 280 }}
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
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                onClick={() => setLightboxIndex(heroIndex)}
                className="w-full h-full object-cover absolute inset-0 cursor-zoom-in"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30 pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7928ca]/30 to-[#ff0080]/20">
            <MapPin className="w-20 h-20 text-white/20" />
          </div>
        )}

        {/* Botones top */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-2">
            {userRole === 'venue_admin' && isOwner && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(`/edit-venue/${venue.id}`)}
                className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white">
                <Edit className="w-5 h-5" />
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white">
              <Share2 className="w-5 h-5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleFavorite} disabled={favoriteLoading}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm disabled:opacity-50">
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#ff0080] text-[#ff0080]' : 'text-white'}`} />
            </motion.button>
          </div>
        </div>

        {/* Badge abierto/cerrado */}
        {openStatus !== null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              openStatus
                ? 'bg-green-500 text-white'
                : 'bg-red-500/80 text-white'
            }`}>
              {openStatus ? 'ABIERTO' : 'CERRADO'}
            </span>
          </div>
        )}

        {/* Miniaturas de fotos (estilo referencia) */}
        {photoUrls.length > 1 && (
          <div className="absolute bottom-3 left-4 right-4 z-10 flex gap-2">
            {photoUrls.slice(0, 4).map((url, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setHeroIndex(i); setLightboxIndex(i); }}
                className={`relative flex-1 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  i === heroIndex ? 'border-white' : 'border-transparent opacity-70'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                {i === 3 && photoUrls.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+{photoUrls.length - 4}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENIDO ────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          {/* Nombre + tipo + rating */}
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{venue.name}</h1>
                  <CheckCircle2 className="w-5 h-5 text-[#7928ca] flex-shrink-0" />
                </div>
                {venue.venue_types && (
                  <p className="text-[#7928ca] font-semibold text-sm mt-0.5">{venue.venue_types.name}</p>
                )}
              </div>
            </div>

            {/* Rating + dirección */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {displayRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold text-sm">{displayRating}</span>
                  <span className="text-gray-500 text-xs">({displayReviews} opiniones)</span>
                </div>
              )}
              {venue.address && (
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <span>·</span>
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{venue.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── BOTONES DE ACCIÓN ── */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {phoneClean && (
              <a href={`tel:${phoneClean}`}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(90deg, #7928ca, #9b59b6)' }}>
                <Phone className="w-4 h-4" /> Llamar
              </a>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-[#25d366]">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#7928ca]/50 transition-colors">
              <Navigation className="w-4 h-4 text-[#7928ca]" /> Cómo llegar
            </a>
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                isFavorite
                  ? 'bg-[#ff0080]/10 border-[#ff0080]/40 text-[#ff0080]'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
              }`}>
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#ff0080]' : ''}`} />
              {isFavorite ? 'Guardado' : 'Favorito'}
            </button>
          </div>

          {/* ── BANNER PROMOCIÓN DESTACADA ── */}
          {!isLicoreria && featuredPromo && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPromotions(true)}
              className="w-full text-left mb-5 rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1060 100%)' }}
            >
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-[#ff0080] text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  🔥 PROMOCIÓN DESTACADA
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[#ff0080] text-xl font-black uppercase leading-tight">{featuredPromo.title}</p>
                {featuredPromo.description && (
                  <p className="text-gray-400 text-sm mt-1">{featuredPromo.description}</p>
                )}
              </div>
            </motion.button>
          )}

          {/* ── INFORMACIÓN RÁPIDA (chips) ── */}
          {!isLicoreria && quickChips.length > 0 && (
            <div className="mb-5">
              <p className="text-white font-bold text-base mb-3">Información rápida</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {quickChips.map((chip, i) => (
                  <QuickChip
                    key={i}
                    icon={chip.icon}
                    label={chip.label}
                    value={chip.value}
                    onClick={chip.action}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── DESCRIPCIÓN ── */}
          {desc && (
            <div className="mb-5">
              <p className="text-white font-bold text-base mb-2">Descripción</p>
              <div className="flex items-end gap-2">
                <p className="text-gray-400 text-sm leading-relaxed flex-1">
                  {descShown}
                </p>
                {descNeedsExpand && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs font-semibold whitespace-nowrap"
                  >
                    {descExpanded ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── CAMPOS ESPECÍFICOS DEL TIPO (VenueTypeDetails) ── */}
          {!isLicoreria && Object.keys(venueDetails).length > 0 && (
            <div className="mb-5">
              <VenueTypeDetails
                venueTypeName={venue.venue_types?.name}
                venueDetails={venueDetails}
              />
            </div>
          )}

          {/* ── LAYOUT LICORERÍA ── */}
          {isLicoreria && (
            <div className="space-y-4 mb-5">

              {/* Servicios de entrega */}
              <div className="grid grid-cols-3 gap-2">
                {venueDetails.delivery && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-[#161616] border border-[#242424] rounded-xl">
                    <Truck className="w-5 h-5 text-[#7928ca]" />
                    <span className="text-white text-xs font-semibold text-center">Delivery</span>
                  </div>
                )}
                {venueDetails.compra_en_tienda && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-[#161616] border border-[#242424] rounded-xl">
                    <Package className="w-5 h-5 text-[#7928ca]" />
                    <span className="text-white text-xs font-semibold text-center">En tienda</span>
                  </div>
                )}
                {venueDetails.recoge_en_local && (
                  <div className="flex flex-col items-center gap-1 p-3 bg-[#161616] border border-[#242424] rounded-xl">
                    <MapPin className="w-5 h-5 text-[#7928ca]" />
                    <span className="text-white text-xs font-semibold text-center">Recoge aquí</span>
                  </div>
                )}
              </div>

              {/* Tiempo estimado */}
              {venueDetails.tiempo_estimado && (
                <div className="flex items-center gap-3 p-4 bg-[#161616] border border-[#242424] rounded-xl">
                  <Clock className="w-5 h-5 text-[#7928ca] flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">Tiempo estimado</p>
                    <p className="text-white font-semibold text-sm">{venueDetails.tiempo_estimado}</p>
                  </div>
                </div>
              )}

              {/* Productos */}
              {venueDetails.productos?.length > 0 && (
                <div>
                  <p className="text-white font-bold text-sm mb-3">Productos disponibles</p>
                  <div className="grid grid-cols-2 gap-2">
                    {venueDetails.productos.map((product) => (
                      <div key={product}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#161616] border border-[#242424] text-sm text-white">
                        <span>{PRODUCT_EMOJIS[product] || '📦'}</span>
                        <span>{product}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Métodos de pago */}
              {venueDetails.metodos_pago?.length > 0 && (
                <div>
                  <p className="text-white font-bold text-sm mb-3">Métodos de pago</p>
                  <div className="flex flex-wrap gap-2">
                    {venueDetails.metodos_pago.map((method) => (
                      <span key={method}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7928ca]/10 border border-[#7928ca]/20 text-purple-300 text-xs font-medium">
                        <CreditCard className="w-3 h-3" /> {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Promociones licorería */}
              {promotions.length > 0 && (
                <div>
                  <p className="text-[#ff0080] text-xs font-bold uppercase tracking-widest mb-2">🔥 Promociones</p>
                  {promotions.map((promo) => (
                    <div key={promo.id} className="bg-[#161616] border border-[#ff0080]/20 rounded-xl p-4 mb-2">
                      <p className="text-white font-semibold">{promo.title}</p>
                      {promo.description && <p className="text-gray-400 text-sm mt-1">{promo.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CALIFICACIÓN ── */}
          {user && userRole !== 'venue_admin' && (
            <div className="mb-5 p-4 bg-[#161616] border border-[#242424] rounded-xl">
              <p className="text-gray-300 text-sm font-medium mb-3">
                {userExistingReview ? 'Tu calificación:' : '¿Cómo calificarías este local?'}
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <motion.button key={value} type="button" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                    disabled={submittingRating}
                    onMouseEnter={() => setHoverRating(value)} onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleSubmitRating(value)} className="disabled:opacity-50">
                    <Star className={`w-8 h-8 transition-colors ${value <= (hoverRating || userRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                  </motion.button>
                ))}
                {submittingRating && <div className="w-4 h-4 border-2 border-[#7928ca] border-t-transparent rounded-full animate-spin ml-2" />}
              </div>
            </div>
          )}

          {/* ── UBICACIÓN ── */}
          <div className="mb-5">
            <p className="text-white font-bold text-base mb-3">Ubicación</p>
            <p className="text-gray-500 text-sm mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#7928ca]" />
              {venue.address}
            </p>
            <div className="w-full h-48 rounded-xl overflow-hidden mb-3">
              <Map
                defaultZoom={14}
                defaultCenter={{ lat: venue.latitude || -0.1807, lng: venue.longitude || -78.4678 }}
                mapId="nerd-venue-detail-map"
                options={{ styles: darkMapStyle, streetViewControl: false, mapTypeControl: false, zoomControl: false, fullscreenControl: false }}
                className="w-full h-full"
              >
                <VenueMapContent
                  venueLat={venue.latitude || -0.1807}
                  venueLng={venue.longitude || -78.4678}
                  onUserLocation={setUserLocation}
                />
              </Map>
            </div>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: 'linear-gradient(90deg, #7928ca, #ff0080)' }}>
              <Navigation className="w-4 h-4" />
              Cómo llegar
              {userLocation && <span className="text-white/60 text-xs ml-1">· cerca de aquí</span>}
            </a>
          </div>

          {/* ── HORARIO (si no está en quick chips ya) ── */}
          {hasHours && !todayHours && (
            <button onClick={() => setShowHours(true)}
              className="w-full flex items-center gap-3 p-4 bg-[#161616] border border-[#242424] rounded-xl hover:border-[#7928ca]/30 transition-colors mb-5 text-left">
              <Clock className="w-5 h-5 text-[#7928ca]" />
              <div>
                <p className="text-gray-500 text-xs">Horario de atención</p>
                <p className="text-white text-sm font-medium">Ver horarios →</p>
              </div>
            </button>
          )}

        </motion.div>
      </div>

      {/* ── MODAL PROMOCIONES ── */}
      <AnimatePresence>
        {showPromotions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-0"
            onClick={() => setShowPromotions(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#111] rounded-t-3xl overflow-hidden border-t border-[#222]"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#ff0080]" />
                  <h3 className="text-white font-bold text-lg">Promociones</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#ff0080] text-white text-xs font-bold">{promotions.length}</span>
                </div>
                <button onClick={() => setShowPromotions(false)} className="p-2 rounded-full hover:bg-white/5 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {promotions.map((promo, i) => (
                  <motion.div key={promo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #ff0080, #7928ca)' }}>
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{promo.title}</p>
                        {promo.description && <p className="text-gray-400 text-sm mt-0.5 whitespace-pre-line">{promo.description}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="h-6" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
            onTouchStart={handleLightboxTouchStart} onTouchEnd={handleLightboxTouchEnd}>
            <button onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white z-10">
              <X className="w-6 h-6" />
            </button>
            {photoUrls.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length); }}
                  className="absolute left-4 p-2 rounded-full bg-white/10 text-white z-10">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % photoUrls.length); }}
                  className="absolute right-4 p-2 rounded-full bg-white/10 text-white z-10">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <AnimatePresence mode="wait">
              <motion.img key={lightboxIndex} src={photoUrls[lightboxIndex]} alt={venue.name}
                initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
                className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg" />
            </AnimatePresence>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photoUrls.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/30'}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL HORARIOS ── */}
      <AnimatePresence>
        {showHours && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center"
            onClick={() => setShowHours(false)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#111] rounded-t-3xl overflow-hidden border-t border-[#222]"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#7928ca]" />
                  <h3 className="text-white font-bold text-lg">Horarios</h3>
                </div>
                <button onClick={() => setShowHours(false)} className="p-2 rounded-full hover:bg-white/5 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {DAYS_ORDER.map((dayKey, i) => {
                  const hours = openingHours[dayKey];
                  if (!hours?.open || !hours?.close) return null;
                  const isToday = new Date().getDay() === ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(dayKey);
                  return (
                    <motion.div key={dayKey} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`flex items-center justify-between py-2.5 px-4 rounded-xl ${
                        isToday ? 'bg-[#7928ca]/15 border border-[#7928ca]/30' : 'bg-[#1a1a1a]'
                      }`}>
                      <span className={`text-sm w-24 ${isToday ? 'text-[#a855f7] font-bold' : 'text-gray-400'}`}>
                        {DAYS_TRANSLATION[dayKey]}{isToday ? ' ·hoy' : ''}
                      </span>
                      <span className="text-white font-medium text-sm">{hours.open} - {hours.close}</span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="h-6" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
