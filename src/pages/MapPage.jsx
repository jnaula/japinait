import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Filter, Search, Clock, Loader2, LocateFixed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VenueCard from '../components/venue/VenueCard';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

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

async function geolocateByNetwork() {
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
}

const DEFAULT_CENTER = { lat: -0.1807, lng: -78.4678 };

const DAYS_TRANSLATION = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

export default function MapPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    fetchVenueTypes();
    fetchVenues();
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setLocating(true);
    setGeoError(null);

    // Intento 1: GPS nativo
    const tryNativeGeo = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });

    try {
      let coords = await tryNativeGeo();
      if (!coords) coords = await geolocateByNetwork();

      if (coords) {
        setUserLocation(coords);
        setMapCenter(coords);
      } else {
        setGeoError('No se pudo detectar la ubicación.');
      }
    } catch {
      setGeoError('Error al obtener la ubicación.');
    } finally {
      setLocating(false);
    }
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
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
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
                {/* Botón Mi ubicación */}
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
                  zoom={13}
                  center={mapCenter}
                  gestureHandling="greedy"
                  mapId="nerd-map"
                  options={{
                    styles: darkMapStyle,
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                  className="w-full h-full"
                >
                  {/* Marcador usuario */}
                  <AdvancedMarker position={userLocation}>
                    <div className="w-4 h-4 bg-[#ff0080] rounded-full border-2 border-white shadow-lg" />
                  </AdvancedMarker>

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

                  {/* InfoWindow al clickear pin */}
                  {selectedVenue && (
                    <InfoWindow
                      position={{ lat: selectedVenue.latitude, lng: selectedVenue.longitude }}
                      onCloseClick={() => setSelectedVenue(null)}
                    >
                      {/* Clickear la tarjeta navega al detalle */}
                      <div
                        className="cursor-pointer min-w-[200px]"
                        onClick={() => navigate(`/venue/${selectedVenue.id}`)}
                      >
                        {selectedVenue.primary_photo && (
                          <img
                            src={selectedVenue.primary_photo}
                            alt={selectedVenue.name}
                            className="w-full h-28 object-cover rounded-lg mb-2"
                          />
                        )}
                        <h3 className="font-bold text-base text-gray-900 mb-1">
                          {selectedVenue.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">{selectedVenue.address}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {selectedVenue.venue_type_name}
                          </span>
                          {selectedVenue.opening_hours && (
                            <div className="text-xs text-gray-400 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{getTodayHours(selectedVenue.opening_hours)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#7928ca] font-medium mt-2 text-right">
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
      </APIProvider>
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