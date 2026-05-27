import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronRight, ChevronUp, Trophy, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VenueCard from '../components/venue/VenueCard';

const CURATORS = [
  { id: 'staff', label: 'Staff JapiNait', emoji: '🔥' },
  { id: 'djs', label: 'DJs locales', emoji: '🎧' },
  { id: 'influencers', label: 'Influencers', emoji: '📸' },
];

export default function Home() {
  const [venues, setVenues] = useState([]);
  const [rutaVenues, setRutaVenues] = useState([]);
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCurator, setActiveCurator] = useState('staff');
  const [showAllVenues, setShowAllVenues] = useState(false);
  const [showRuta, setShowRuta] = useState(false);
  const scrollRef = useRef(null);
  const allVenuesRef = useRef(null);

  useEffect(() => {
    fetchVenueTypes();
    fetchVenues();
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
        return { ...venue, venue_type_name: venue.venue_types?.name, primary_photo: imageUrl };
      });

      const shuffled = [...processedVenues].sort(() => Math.random() - 0.5);
      setVenues(shuffled);

      // ✅ Locales de la ruta del partido
      setRutaVenues(processedVenues.filter((v) => v.is_ruta_partido));
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

  const isFiltering = searchQuery || selectedType !== 'all';

  // ── PANTALLA RUTA DEL PARTIDO ─────────────────────────────────────
  if (showRuta) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-10">
        <div className="max-w-2xl mx-auto px-4 pt-6">

          {/* Header ruta */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setShowRuta(false)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Volver</span>
            </button>
            <h2 className="text-white font-bold text-lg">Ruta del Partido</h2>
            <div className="w-16" />
          </div>

          {/* Banner Ruta */}
          <div className="relative rounded-2xl overflow-hidden mb-6"
            style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0d1a3a 100%)', minHeight: 160 }}>
            {/* Luces de ambiente */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-[#ff0080]/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-[#7928ca]/30 rounded-full blur-2xl" />

            <div className="relative z-10 p-5 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Ruta del Partido</span>
              </div>
              <h3 className="text-white text-2xl font-black uppercase mb-1">Final Champions League</h3>

              {/* Equipos */}
              <div className="flex items-center gap-4 my-3">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#001489] border-2 border-white/20 flex items-center justify-center text-2xl">⚽</div>
                  <span className="text-white text-xs font-bold mt-1">PSG</span>
                </div>
                <span className="text-gray-400 font-bold text-lg">VS</span>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#EF0107] border-2 border-white/20 flex items-center justify-center text-2xl">⚽</div>
                  <span className="text-white text-xs font-bold mt-1">Arsenal</span>
                </div>
              </div>

              <p className="text-gray-400 text-xs">31 MAYO • 15:00</p>
            </div>
          </div>

          {/* Lista de locales de la ruta */}
          {rutaVenues.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Próximamente</p>
              <p className="text-gray-500 text-sm">Los locales de la ruta se anunciarán pronto</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rutaVenues.map((venue, i) => (
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
          )}
        </div>
      </div>
    );
  }

  // ── HOME PRINCIPAL ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Explora <span className="text-[#ff0080]">locales</span> 🔥
          </h1>
          <p className="text-gray-500 text-sm mt-1">Navega por todos los locales registrados cerca de ti!</p>
        </motion.div>

        {/* SEARCH */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-5">
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          <PillFilter active={selectedType === 'all'} onClick={() => setSelectedType('all')}>Todos</PillFilter>
          {venueTypes.map((type) => (
            <PillFilter key={type.id} active={selectedType === type.id} onClick={() => setSelectedType(type.id)}>
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
                  <motion.div key={venue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
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
                <button onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white text-sm font-semibold">
                  Limpiar filtros
                </button>
              </div>
            )}
          </section>

        ) : (
          <>
            {/* ✅ BANNER RUTA DEL PARTIDO */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0d1a3a 100%)', minHeight: 150 }}
              onClick={() => setShowRuta(true)}
            >
              {/* Luces de neón de fondo */}
              <div className="absolute top-0 left-0 w-48 h-48 bg-[#7928ca]/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#ff0080]/15 rounded-full blur-2xl" />
              {/* Balón decorativo */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20 select-none">⚽</div>

              <div className="relative z-10 p-5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest">Ruta del Partido</span>
                </div>
                <p className="text-white/70 text-xs mb-0.5">Final Champions League</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white text-2xl font-black italic">PSG</span>
                  <span className="text-gray-400 text-sm font-bold">vs</span>
                  <span className="text-white text-2xl font-black italic">Arsenal</span>
                </div>
                <p className="text-gray-500 text-xs mb-3">31 MAYO • 15:00</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowRuta(true); }}
                  className="px-5 py-2 rounded-full text-sm font-bold text-black bg-[#f5c518] hover:bg-yellow-300 transition-colors"
                >
                  Ver Ruta
                </button>
              </div>
            </motion.div>

            {/* RECOMENDADO POR */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-lg">Recomendado por...</h2>
                <button onClick={handleVerTodos} className="flex items-center gap-1 text-[#ff0080] text-xs font-semibold">
                  Ver todos <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {CURATORS.map((c) => (
                  <button key={c.id} onClick={() => setActiveCurator(c.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeCurator === c.id
                        ? 'bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white'
                        : 'bg-[#161616] text-gray-400 border border-[#222]'
                    }`}>
                    <span>{c.emoji}</span> {c.label}
                  </button>
                ))}
              </div>
              <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-44 h-56 rounded-2xl bg-[#161616] animate-pulse" />
                    ))
                  : getCuratorVenues().map((venue, i) => (
                      <motion.div key={venue.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }} className="flex-shrink-0 w-44">
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
                  <button onClick={showAllVenues ? handleOcultarTodos : handleVerTodos}
                    className="flex items-center gap-1 text-[#ff0080] text-xs font-semibold">
                    {showAllVenues
                      ? <><ChevronUp className="w-3 h-3" /> Ocultar</>
                      : <>Ver todos <ChevronRight className="w-3 h-3" /></>}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-52 rounded-2xl bg-[#161616] animate-pulse" />
                    ))
                  : venues.slice(0, 4).map((venue, i) => (
                      <motion.div key={venue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <VenueCard venue={venue} />
                      </motion.div>
                    ))}
              </div>

              <AnimatePresence>
                {showAllVenues && venues.length > 4 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {venues.slice(4).map((venue, i) => (
                        <motion.div key={venue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <VenueCard venue={venue} />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-center mt-6">
                      <button onClick={handleOcultarTodos} className="flex items-center gap-1 text-gray-500 text-xs font-semibold mx-auto hover:text-white transition-colors">
                        <ChevronUp className="w-3 h-3" /> Ocultar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showAllVenues && !loading && venues.length > 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-5">
                  <button onClick={handleVerTodos}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white text-sm font-bold hover:opacity-90 transition-opacity">
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
            <a href="https://zippy-squid-771.notion.site/T-rminos-y-condiciones-JapiNait-32d1a5c981e3808b8677db339c805b62"
              target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#ff0080] text-xs transition-colors">
              Términos y Condiciones
            </a>
            <span className="text-gray-700">·</span>
            <a href="https://zippy-squid-771.notion.site/Pol-ticas-de-privacidad-JapiNait-32d1a5c981e38020ba2cebac2bf14240"
              target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#ff0080] text-xs transition-colors">
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
    <button onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        active
          ? 'bg-white text-black'
          : 'bg-[#161616] text-gray-400 border border-[#222] hover:border-[#ff0080] hover:text-white'
      }`}>
      {children}
    </button>
  );
}