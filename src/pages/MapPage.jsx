import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Filter, Search, Clock, Loader2, LocateFixed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VenueCard from '../components/venue/VenueCard';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';

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



const DEFAULT_CENTER = { lat: -0.1807, lng: -78.4678 };

// Componente interno que accede al mapa para hacer panTo
function MapController({ panToRef }) {
  const map = useMap();
  useEffect(() => {
    panToRef.current = (coords) => {
      if (map) {
        map.panTo(coords);
        map.setZoom(15);
      }
    };
  }, [map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const panToRef = useRef(null); // ref para llamar panTo sin re-renderizar el mapa

  useEffect(() => {
    fetchVenueTypes();
    fetchVenues();
    detectLocation();
  }, []);

  const detectLocation = async () => {
  setLocating(true);
  setGeoError(null);

  if (!navigator.geolocation) {
    setGeoError('Tu dispositivo no soporta geolocalización.');
    setLocating(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(coords);
      if (panToRef.current) panToRef.current(coords);
      setLocating(false);
    },
    () => {
      setGeoError('Activa el GPS y los permisos de ubicación para ver tu posición.');
      setLocating(false);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

  const getTodayHours = (openingHours) => {
    if (!openingHours) return null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hours = openingHours[today];
    if (!hours || !hours.open || !hours.close) return 'Cerrado hoy';
    return `${hours.open} - ${hours.close}`;
  };

  const fetchVenueTypes = async () => {
    try {
      const { data, error } = await supabase.from('venue_types').select('*').order('name');
      if (error) throw error;
      setVenueTypes(data || []);
    } catch (err) {
      console.error('MapPage: Error fetching venue types:', err);
    }
  };

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`*, venue_types(name), venue_photos(photo_url, is_primary)`)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const processed = data.map((v) => {
        const primaryPhoto = v.venue_photos?.find((p) => p.is_primary);
        const photoPath = primaryPhoto?.photo_url || v.venue_photos?.[0]?.photo_url;
        const primaryImageUrl = photoPath
          ? supabase.storage.from('venue-photos').getPublicUrl(photoPath).data.publicUrl
          : null;
        return {
          ...v,
          venue_type_name: v.venue_types?.name,
          primary_photo: primaryImageUrl,
          latitude: parseFloat(v.latitude),
          longitude: parseFloat(v.longitude),
        };
      });
      setVenues(processed);
    } catch (err) {
      console.error('MapPage: Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter((v) => {
    const matchesType = selectedType === 'all' || v.venue_type_id === selectedType;
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
     
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Descubre{' '}
              <span className="bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text">
                la Vida Nocturna de Ecuador
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Explora los mejores locales y eventos de la ciudad
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* MAPA */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-[#ff0080]" />
                  <h2 className="text-lg font-semibold text-white">Vista de Mapa</h2>
                </div>
                <button
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex items-center space-x-1 text-xs text-[#ff0080] hover:text-[#ff40a0] disabled:opacity-50 transition-colors"
                >
                  {locating
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <LocateFixed className="w-3 h-3" />
                  }
                  <span>{locating ? 'Localizando...' : 'Mi ubicación'}</span>
                </button>
              </div>

              {geoError && (
                <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mb-3">
                  {geoError}
                </div>
              )}

              <div className="w-full h-96 rounded-lg bg-[#1a1a1a] overflow-hidden">
                <Map
                  defaultZoom={13}
                  defaultCenter={DEFAULT_CENTER}
                  gestureHandling="greedy"
                  mapId="nerd-map"
                  options={{
                    styles: darkMapStyle,
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                  className="w-full h-full"
                >
                  {/* Controlador para panTo sin re-render */}
                  <MapController panToRef={panToRef} />

                  {/* Marcador usuario */}
                  {userLocation && (
                    <AdvancedMarker position={userLocation}>
                      <div className="w-4 h-4 bg-[#ff0080] rounded-full border-2 border-white shadow-lg" />
                    </AdvancedMarker>
                  )}

                  {/* Pines de locales */}
                  {filteredVenues.map((v) => (
                    <AdvancedMarker
                      key={v.id}
                      position={{ lat: v.latitude, lng: v.longitude }}
                      onClick={() => setSelectedVenue(v)}
                    >
                      <Pin background="#7928ca" borderColor="#fff" glyphColor="#fff" scale={1} />
                    </AdvancedMarker>
                  ))}

                  {/* InfoWindow */}
                  {selectedVenue && (
  <InfoWindow
    position={{ lat: selectedVenue.latitude, lng: selectedVenue.longitude }}
    onCloseClick={() => setSelectedVenue(null)}
  >
    <div
      className="cursor-pointer"
      style={{ width: '220px' }}
      onClick={() => navigate(`/venue/${selectedVenue.id}`)}
    >
      {selectedVenue.primary_photo && (
        <img
          src={selectedVenue.primary_photo}
          alt={selectedVenue.name}
          style={{
            width: '100%',
            height: '120px',
            objectFit: 'cover',
            borderRadius: '8px',
            marginBottom: '8px',
            display: 'block',
          }}
        />
      )}
      <h3 style={{ fontWeight: 700, fontSize: '14px', color: '#111', marginBottom: '4px' }}>
        {selectedVenue.name}
      </h3>
      <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
        {selectedVenue.address}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '11px',
          background: '#ede9fe',
          color: '#7928ca',
          padding: '2px 8px',
          borderRadius: '999px',
        }}>
          {selectedVenue.venue_type_name}
        </span>
        {selectedVenue.opening_hours && (
          <span style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock style={{ width: '11px', height: '11px' }} />
            {getTodayHours(selectedVenue.opening_hours)}
          </span>
        )}
      </div>
      <p style={{ fontSize: '11px', color: '#7928ca', fontWeight: 600, textAlign: 'right', marginTop: '6px' }}>
        Ver detalle →
      </p>
    </div>
  </InfoWindow>
)}
                </Map>
              </div>
            </motion.div>

            {/* FILTROS */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Search className="w-5 h-5 text-[#ff0080]" />
                  <h2 className="text-lg font-semibold text-white">Buscar</h2>
                </div>
                <input
                  type="text"
                  placeholder="Buscar locales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors"
                />
              </div>

              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Filter className="w-5 h-5 text-[#ff0080]" />
                  <h2 className="text-lg font-semibold text-white">Filtrar por Tipo</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterButton active={selectedType === 'all'} onClick={() => setSelectedType('all')}>
                    Todos
                  </FilterButton>
                  {venueTypes.map((t) => (
                    <FilterButton
                      key={t.id}
                      active={selectedType === t.id}
                      onClick={() => setSelectedType(t.id)}
                    >
                      {t.name}
                    </FilterButton>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredVenues.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredVenues.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <VenueCard venue={v} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No se encontraron locales</p>
            </div>
          )}
        </div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white'
          : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]'
      }`}
    >
      {children}
    </motion.button>
  );
}