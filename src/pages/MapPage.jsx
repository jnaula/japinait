[12:26, 18/3/2026] Javi: import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Filter, Search, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VenueCard from '../components/venue/VenueCard';
import { APIProvider, Map, Marker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBBy7nFUipYZ1FDegs-SsgZ9d7ViAZqInI';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featur…
[12:26, 18/3/2026] Javi: import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Filter, Search, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VenueCard from '../components/venue/VenueCard';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBBy7nFUipYZ1FDegs-SsgZ9d7ViAZqInI';

export default function MapPage() {
  const [venues, setVenues] = useState([]);
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState({ lat: -0.1807, lng: -78.4678 });

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
        () => {
          setUserLocation({ lat: -0.1807, lng: -78.4678 });
        }
      );
    }
  };

  const fetchVenueTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_types')
        .select('*')
        .order('name');

      if (!error) setVenueTypes(data || []);
    } catch (err) {
      console.error(err);
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
        .eq('status', 'approved');

      if (error) throw error;

      const processed = data.map((venue) => ({
        ...venue,
        venue_type_name: venue.venue_types?.name,
        primary_photo: venue.venue_photos?.[0]?.photo_url,
        latitude: parseFloat(venue.latitude),
        longitude: parseFloat(venue.longitude),
      }));

      setVenues(processed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesType = selectedType === 'all' || venue.venue_type_id === selectedType;
    const matchesSearch =
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.address.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <div className="max-w-7xl mx-auto px-4 py-8">

          <h1 className="text-3xl text-white mb-6 text-center">
            Descubre la Vida Nocturna
          </h1>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 mb-8">

            {/* MAPA */}
            <div className="bg-[#0f0f0f] rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="text-[#ff0080]" />
                <h2 className="text-white">Mapa</h2>
              </div>

              <div className="w-full h-96 rounded-lg overflow-hidden">
                <Map
                  defaultZoom={15}
                  defaultCenter={userLocation}
                  mapId="nerd-map"
                  className="w-full h-full"
                >
                  {/* Usuario */}
                  <AdvancedMarker position={userLocation}>
                    <div className="w-4 h-4 bg-[#ff0080] rounded-full border-2 border-white" />
                  </AdvancedMarker>

                  {/* Locales */}
                  {filteredVenues.map((venue) => (
                    <AdvancedMarker
                      key={venue.id}
                      position={{ lat: venue.latitude, lng: venue.longitude }}
                    >
                      <div className="w-6 h-6 bg-[#7928ca] rounded-full border-2 border-white" />
                    </AdvancedMarker>
                  ))}
                </Map>
              </div>
            </div>

            {/* FILTROS */}
            <div className="space-y-4">

              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 rounded bg-[#1a1a1a] text-white"
              />

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedType('all')} className="text-white">
                  Todos
                </button>

                {venueTypes.map((type) => (
                  <button key={type.id} onClick={() => setSelectedType(type.id)} className="text-gray-300">
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LISTA */}
          {loading ? (
            <p className="text-white text-center">Cargando...</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}

        </div>
      </APIProvider>
    </div>
  );
}