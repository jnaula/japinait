import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronRight, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VenueCard from '../components/venue/VenueCard';

const BANNERS = [
  {
    id: 1,
    title: 'Disfruta livias',
    highlight: 'noches',
    subtitle: 'aseyradas',
    description: '¡Conoce aquí los mejores clubes de Guayaquil!',
    cta: '¡Descúbrelos!',
    bg: 'from-[#1a0533] via-[#2d0a5e] to-[#0a0a1a]',
    accent: '#ff0080',
  },
  {
    id: 2,
    title: 'Las mejores',
    highlight: 'noches',
    subtitle: 'de Quito',
    description: '¡Descubre los bares y discotecas más exclusivos!',
    cta: '¡Explóralos!',
    bg: 'from-[#0a1a33] via-[#0a2d5e] to-[#0a0a1a]',
    accent: '#7928ca',
  },
];

const CURATORS = [
  { id: 'staff', label: 'Staff JapiNait', emoji: '🔥' },
  { id: 'djs', label: 'DJs locales', emoji: '🎧' },
  { id: 'influencers', label: 'Influencers', emoji: '📸' },
];

export default function Home() {
  const [venues, setVenues] = useState([]);
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeCurator, setActiveCurator] = useState('staff');
  const [showAllVenues, setShowAllVenues] = useState(false);
  const scrollRef = useRef(null);
  const allVenuesRef = useRef(null);

  useEffect(() => {
    fetchVenueTypes();
    fetchVenues();
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchVenueTypes = async () => {
    try {
      const { data, error } = await supabase.from('venue_types').select('*').order('name');
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
        .select('*, venue_types(name), venue_photos(photo_url, is_primary)')
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

      const shuffled = [...processedVenues].sort(() => Math.random() - 0.5);
      setVenues(shuffled);
    } catch (err) {
      console.error('Home: Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesType = selectedType === 'all' || venue.venue_type_id === selectedType;
    const matchesSearch =
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getCuratorVenues = () => {
    if (activeCurator === 'djs') return venues.filter((_, i) => i % 3 === 0).slice(0, 8);
    if (activeCurator === 'influencers') return venues.filter((_, i) => i % 2 === 0).slice(0, 8);
    return venues.slice(0, 8);
  };

  const handleVerTodos = () => {
    setShowAllVenues(true);
    setTimeout(() => {
      allVenuesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleOcultarTodos = () => {
    setShowAllVenues(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const banner = BANNERS[activeBanner];
  const isFiltering = searchQuery || selectedType !== 'all';

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Explora <span className="text-[#ff0080]">locales</span> 🔥
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Buscar locales que pro<span className="text-[#7928ca] font-semibold">kuentate</span> còño menos
          </p>
        </motion.div>

        {/* SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-5"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar locales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#161616] border border-[#222] rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080] transition-colors text-sm"
          />
        </motion.div>

        {/* FILTROS PILL */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6"
          style={{ scrollbarWidth: 'none' }}
        >
          <PillFilter active={selectedType === 'all'} onClick={() => setSelectedType('all')}>
            Todos
          </PillFilter>
          {venueTypes.map((type) => (
            <PillFilter
              key={type.id}
              active={selectedType === type.id}
              onClick={() => setSelectedType(type.id)}
            >
              {type.name}
            </PillFilter>
          ))}
        </motion.div>

        {/* MODO FILTRADO */}
        {isFiltering ? (
          <section>
            <p className="text-gray-500 text-sm mb-4">
              Mostrando <span className="text-white font-semibold">{filteredVenues.length}</span>{' '}
              {filteredVenues.length === 1 ? 'local' : 'locales'}
            </p>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredVenues.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredVenues.map((venue, i) => (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <VenueCard venue={venue} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-[#161616] rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-white font-semibold mb-1">Sin resultados</p>
                <p className="text-gray-500 text-sm mb-4">Intenta con otros filtros</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white text-sm font-semibold"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </section>

        ) : (
          <>
            {/* BANNER */}
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className={`relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r ${banner.bg} p-5`}
              style={{ minHeight: '140px' }}
            >
              <div
                className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20 blur-2xl"
                style={{ background: banner.accent }}
              />
              <div className="relative z-10">
                <p className="text-white/80 text-sm font-medium italic">{banner.title}</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="text-3xl font-black italic"
                    style={{
                      background: `linear-gradient(90deg, #fff 0%, ${banner.accent} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {banner.highlight}
                  </span>
                  <span className="text-[#7928ca] font-bold text-xl">{banner.subtitle}</span>
                </div>
                <p className="text-gray-300 text-xs mt-1 mb-3">{banner.description}</p>
                <button className="px-4 py-1.5 rounded-full text-sm font-bold text-black bg-[#f5c518]">
                  {banner.cta}
                </button>
              </div>
              <div className="absolute bottom-3 right-4 flex gap-1">
                {BANNERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveBanner(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === activeBanner ? 16 : 6,
                      height: 6,
                      background: i === activeBanner ? banner.accent : '#ffffff40',
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* RECOMENDADO POR */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-lg">Recomendado por...</h2>
                <button
                  onClick={handleVerTodos}
                  className="flex items-center gap-1 text-[#ff0080] text-xs font-semibold"
                >
                  Ver todos <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {CURATORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCurator(c.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeCurator === c.id
                        ? 'bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white'
                        : 'bg-[#161616] text-gray-400 border border-[#222]'
                    }`}
                  >
                    <span>{c.emoji}</span> {c.label}
                  </button>
                ))}
              </div>
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2"
                style={{ scrollbarWidth: 'none' }}
              >
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-44 h-56 rounded-2xl bg-[#161616] animate-pulse" />
                    ))
                  : getCuratorVenues().map((venue, i) => (
                      <motion.div
                        key={venue.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex-shrink-0 w-44"
                      >
                        <VenueCard venue={venue} compact />
                      </motion.div>
                    ))}
              </div>
            </section>

            {/* TODOS LOS LOCALES */}
            <section ref={allVenuesRef} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-bold text-lg">Todos los locales</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{venues.length} locales disponibles</p>
                </div>
                {venues.length > 4 && (
                  <button
                    onClick={showAllVenues ? handleOcultarTodos : handleVerTodos}
                    className="flex items-center gap-1 text-[#ff0080] text-xs font-semibold"
                  >
                    {showAllVenues
                      ? <><ChevronUp className="w-3 h-3" /> Ocultar</>
                      : <>Ver todos <ChevronRight className="w-3 h-3" /></>
                    }
                  </button>
                )}
              </div>

              {/* Primeros 4 siempre visibles */}
              <div className="grid grid-cols-2 gap-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-52 rounded-2xl bg-[#161616] animate-pulse" />
                    ))
                  : venues.slice(0, 4).map((venue, i) => (
                      <motion.div
                        key={venue.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <VenueCard venue={venue} />
                      </motion.div>
                    ))}
              </div>

              {/* El resto se expande */}
              <AnimatePresence>
                {showAllVenues && venues.length > 4 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {venues.slice(4).map((venue, i) => (
                        <motion.div
                          key={venue.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <VenueCard venue={venue} />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-center mt-6">
                      <button
                        onClick={handleOcultarTodos}
                        className="flex items-center gap-1 text-gray-500 text-xs font-semibold mx-auto hover:text-white transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" /> Ocultar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón Ver todos centrado */}
              {!showAllVenues && !loading && venues.length > 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-5">
                  <button
                    onClick={handleVerTodos}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    Ver todos los locales ({venues.length})
                  </button>
                </motion.div>
              )}
            </section>
          </>
        )}

        {/* FOOTER */}
        <div className="text-center pt-8 mt-4 border-t border-[#1a1a1a]">
          <p className="text-gray-700 text-xs mb-2">© 2026 JapiNait · Todos los derechos reservados</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://zippy-squid-771.notion.site/T-rminos-y-condiciones-JapiNait-32d1a5c981e3808b8677db339c805b62"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#ff0080] text-xs transition-colors"
            >
              Términos y Condiciones
            </a>
            <span className="text-gray-700">·</span>
            <a
              href="https://zippy-squid-771.notion.site/Pol-ticas-de-privacidad-JapiNait-32d1a5c981e38020ba2cebac2bf14240"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#ff0080] text-xs transition-colors"
            >
              Política de Privacidad
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

function PillFilter({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        active
          ? 'bg-white text-black'
          : 'bg-[#161616] text-gray-400 border border-[#222] hover:border-[#ff0080] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
