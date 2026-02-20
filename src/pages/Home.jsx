import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, MapPin, Clock, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VenueCard from '../components/venue/VenueCard';

export default function Home() {
  const [venues, setVenues] = useState([]);
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    console.log('Home: Component mounted');
    fetchVenueTypes();
    fetchVenues();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      console.log('Home: Fetching venue types...');
      const { data, error } = await supabase
        .from('venue_types')
        .select('*')
        .order('name');

      if (error) throw error;
      console.log('Home: Venue types fetched:', data);
      setVenueTypes(data || []);
    } catch (err) {
      console.error('Home: Error fetching venue types:', err);
    }
  };

  const fetchVenues = async () => {
    setLoading(true);
    try {
      console.log('Home: Fetching venues...');
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
        };
      });

      console.log('Home: Venues fetched:', processedVenues.length);
      setVenues(processedVenues);
    } catch (err) {
      console.error('Home: Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedVenues = () => {
    let filtered = venues.filter((venue) => {
      const matchesType = selectedType === 'all' || venue.venue_type_id === selectedType;
      const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  };

  const filteredVenues = getFilteredAndSortedVenues();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Explora <span className="bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text">Todos los Locales</span>
          </h1>
          <p className="text-gray-400 text-lg">Navega por todos los locales registrados en Ecuador</p>
        </motion.div>

        <div className="mb-8 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Search className="w-5 h-5 text-[#ff0080]" />
                  <h2 className="text-lg font-semibold text-white">Buscar Locales</h2>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, dirección o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors"
                />
              </div>

              <div className="md:w-48">
                <div className="flex items-center space-x-3 mb-3">
                  <Clock className="w-5 h-5 text-[#ff0080]" />
                  <h2 className="text-lg font-semibold text-white">Ordenar Por</h2>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors"
                >
                  <option value="recent">Más Recientes</option>
                  <option value="name">Nombre (A-Z)</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Filter className="w-5 h-5 text-[#ff0080]" />
              <h2 className="text-lg font-semibold text-white">Filtrar por Tipo</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={selectedType === 'all'}
                onClick={() => setSelectedType('all')}
              >
                Todos ({venues.length})
              </FilterButton>
              {venueTypes.map((type) => {
                const count = venues.filter(v => v.venue_type_id === type.id).length;
                return (
                  <FilterButton
                    key={type.id}
                    active={selectedType === type.id}
                    onClick={() => setSelectedType(type.id)}
                  >
                    {type.name} ({count})
                  </FilterButton>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="mb-4">
          <p className="text-gray-400 text-sm">
            Mostrando <span className="text-white font-semibold">{filteredVenues.length}</span> {filteredVenues.length === 1 ? 'local' : 'locales'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Cargando locales...</p>
            </div>
          </div>
        ) : filteredVenues.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <VenueCard venue={venue} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-12 max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No se Encontraron Locales</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery || selectedType !== 'all'
                  ? 'Intenta ajustar tu búsqueda o filtros'
                  : 'Aún no se han registrado locales'}
              </p>
              {(searchQuery || selectedType !== 'all') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                  }}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-medium"
                >
                  Limpiar Filtros
                </motion.button>
              )}
            </div>
          </motion.div>
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
