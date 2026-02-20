import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Filter, Search, Clock } from 'lucide-react';
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

export default function MapPage() {
  const [venues, setVenues] = useState([]);
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState({ lat: -0.1807, lng: -78.4678 }); // Default to Quito
  const [selectedVenue, setSelectedVenue] = useState(null);

  useEffect(() => {
    fetchVenueTypes();
    fetchVenues();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('MapPage: Geolocation error:', error);
          // Default to Quito, Ecuador
          setUserLocation({ lat: -0.1807, lng: -78.4678 });
        }
      );
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
      const { data, error } = await supabase
        .from('venue_types')
        .select('*')
        .order('name');

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
        .select(`
          *,
          venue_types(name),
          venue_photos(photo_url, is_primary)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedVenues = data.map((venue) => {
        const primaryPhoto = venue.venue_photos?.find((p) => p.is_primary);
        return {
          ...venue,
          venue_type_name: venue.venue_types?.name,
          primary_photo: primaryPhoto?.photo_url || venue.venue_photos?.[0]?.photo_url,
          // Ensure coords are numbers
          latitude: parseFloat(venue.latitude),
          longitude: parseFloat(venue.longitude)
        };
      });

      setVenues(processedVenues);
    } catch (err) {
      console.error('MapPage: Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVenues = () => {
    return venues.filter((venue) => {
      const matchesType = selectedType === 'all' || venue.venue_type_id === selectedType;
      const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  };

  const filteredVenues = getFilteredVenues();

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
              Descubre <span className="bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text">la Vida Nocturna de Ecuador</span>
            </h1>
            <p className="text-gray-400 text-lg">Explora los mejores locales y eventos de la ciudad</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4"
            >
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-5 h-5 text-[#ff0080]" />
                <h2 className="text-lg font-semibold text-white">Vista de Mapa</h2>
              </div>
              <div className="w-full h-96 rounded-lg bg-[#1a1a1a] overflow-hidden">
                <Map
                  defaultZoom={13}
                  defaultCenter={userLocation}
                  center={userLocation}
                  mapId="nerd-map"
                  options={{
                    styles: darkMapStyle,
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                  className="w-full h-full"
                >
                  {/* User Location Marker */}
                  <AdvancedMarker position={userLocation}>
                    <div className="w-4 h-4 bg-[#ff0080] rounded-full border-2 border-white shadow-lg pulse" />
                  </AdvancedMarker>

                  {/* Venue Markers */}
                  {filteredVenues.map((venue) => (
                    <AdvancedMarker
                      key={venue.id}
                      position={{ lat: venue.latitude, lng: venue.longitude }}
                      onClick={() => setSelectedVenue(venue)}
                    >
                      <Pin background={'#7928ca'} borderColor={'#fff'} glyphColor={'#fff'} scale={1} />
                    </AdvancedMarker>
                  ))}

                  {selectedVenue && (
                    <InfoWindow
                      position={{ lat: selectedVenue.latitude, lng: selectedVenue.longitude }}
                      onCloseClick={() => setSelectedVenue(null)}
                    >
                      <div className="text-black p-2 min-w-[200px]">
                        <h3 className="font-bold text-lg">{selectedVenue.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{selectedVenue.address}</p>
                        {selectedVenue.primary_photo && (
                          <img 
                            src={selectedVenue.primary_photo} 
                            alt={selectedVenue.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            {selectedVenue.venue_type_name}
                          </span>
                          {selectedVenue.opening_hours && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTodayHours(selectedVenue.opening_hours)}
                            </div>
                          )}
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </div>
            </motion.div>

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
                  <FilterButton
                    active={selectedType === 'all'}
                    onClick={() => setSelectedType('all')}
                  >
                    All
                  </FilterButton>
                  {venueTypes.map((type) => (
                    <FilterButton
                      key={type.id}
                      active={selectedType === type.id}
                      onClick={() => setSelectedType(type.id)}
                    >
                      {type.name}
                    </FilterButton>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

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
              {filteredVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <VenueCard venue={venue} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No venues found</p>
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