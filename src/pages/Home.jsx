import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, MapPin } from 'lucide-react';
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
    fetchVenueTypes();
    fetchVenues();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_types')
        .select('*')
        .order('name');
      if (error) throw error;
      setVenueTypes(data || []);
    } catch (err) {
      console.error('Home: Error fetching venue types:', err);
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

      const processedVenues = data.map((venue) => {
        const primaryPhoto = venue.venue_photos?.find((p) => p.is_primary);
        const photoPath = primaryPhoto?.photo_url || venue.venue_photos?.[0]?.photo_url;
        const imageUrl = photoPath
          ? supabase.storage.from('venue-photos').getPublicUrl(photoPath).data.publicUrl
          : null;
        return {
          ...venue,
          venue_type_name: venue.venue_types?.name,
          primary_photo: imageUrl,
        };
      });

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
      const matchesSearch =
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Explora{' '}
            <span className="bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text">
              Todos los Locales
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Navega por todos los locales registrados en Ecuador</p>
        </motion.div>

        {/* ✅ Búsqueda y filtro en una sola fila */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 mb-8"
        >
          <div className="flex gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar locales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors text-sm"
              />
            </div>

            {/* Filtro */}
            <div className="relative w-36">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-9 pr-2 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors text-sm appearance-none"
              >
                <option value="all">Todos ({venues.length})</option>
                {venueTypes.map((type) => {
                  const count = venues.filter((v) => v.venue_type_id === type.id).length;
                  return (
                    <option key={type.id} value={type.id}>
                      {type.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Contador */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm">
            Mostrando{' '}
            <span className="text-white font-semibold">{filteredVenues.length}</span>{' '}
            {filteredVenues.length === 1 ? 'local' : 'locales'}
          </p>
        </div>

        {/* Lista de locales */}
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

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6 mt-8 border-t border-[#1a1a1a]"
        >
          <p className="text-gray-600 text-xs mb-2">© 2026 JapiNait · Todos los derechos reservados</p>
          <div className="flex items-center justify-center space-x-4">
            
              <a href="https://zippy-squid-771.notion.site/T-rminos-y-condiciones-JapiNait-32d1a5c981e3808b8677db339c805b62"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#ff0080] text-xs transition-colors"
            >
              Términos y Condiciones
            </a>
            <span className="text-gray-700">·</span>
            
              <a href="https://zippy-squid-771.notion.site/Pol-ticas-de-privacidad-JapiNait-32d1a5c981e38020ba2cebac2bf14240"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#ff0080] text-xs transition-colors"
            >
              Política de Privacidad
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}