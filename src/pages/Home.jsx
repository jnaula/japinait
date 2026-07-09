import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronRight, ChevronUp, ArrowLeft, Share2, Tag, Phone, Zap, Gift, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import VenueCard from '../components/venue/VenueCard';

const CURATORS = [
  { id: 'staff', label: 'Staff JapiNait', emoji: '🔥' },
  { id: 'djs', label: 'DJs locales', emoji: '🎧' },
  { id: 'influencers', label: 'Influencers', emoji: '📸' },
];

const MOSTRAR_RUTA = false;
const CHAMPIONS_EXPIRY = new Date('2026-06-01T00:00:00');

const PRODUCT_EMOJIS = {
  Cervezas: '🍺', Whisky: '🥃', Ron: '🍹', Vodka: '🍸', Vino: '🍷',
  Tequila: '🥂', Aguardiente: '🌿', Energizantes: '⚡', Hielo: '🧊',
  Snacks: '🍟', Cigarrillos: '🚬', Otros: '📦',
};

// Icono + color neón por tipo de local
const CATEGORY_CONFIG = {
  'Bar':        { emoji: '🍸', color: '#ff0080', bg: 'from-[#3d0020] to-[#1a0010]' },
  'Discoteca':  { emoji: '🎡', color: '#7928ca', bg: 'from-[#1e0a3d] to-[#0d0020]' },
  'Karaoke':    { emoji: '🎤', color: '#00c9a7', bg: 'from-[#003d33] to-[#001a16]' },
  'Lounge':     { emoji: '🛋️', color: '#ff6b00', bg: 'from-[#3d1a00] to-[#1a0a00]' },
  'Restobar':   { emoji: '🍽️', color: '#ff0044', bg: 'from-[#3d0011] to-[#1a0008]' },
  'Rooftop':    { emoji: '🏙️', color: '#0099ff', bg: 'from-[#002a3d] to-[#00101a]' },
  'Licorería':  { emoji: '🍾', color: '#22c55e', bg: 'from-[#0a2a0a] to-[#051205]' },
};

function BannerMundial({ className = '', style = {}, onClick }) {
  const [hasImage, setHasImage] = React.useState(true);
  if (hasImage) {
    return <img src="/banner-mundial.jpeg" alt="Ruta del Mundial" className={className} style={style}
      onError={() => setHasImage(false)} onClick={onClick} />;
  }
  return (
    <div onClick={onClick} className={className}
      style={{ ...style, background: 'linear-gradient(135deg, #0c2c0c 0%, #0c1535 50%, #1a0a2e 100%)',
        minHeight: 140, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 8, cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ fontSize: 40 }}>🌍⚽</span>
      <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>Ruta del Mundial 2026</p>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>Próximamente</p>
    </div>
  );
}

function getEventPhase() {
  return new Date() < CHAMPIONS_EXPIRY ? 'champions' : 'mundial';
}

// ── Card categoría cuadrada ───────────────────────────────
function CategoryCard({ type, count, active, onClick }) {
  const config = CATEGORY_CONFIG[type.name] || { emoji: '🏠', color: '#7928ca', bg: 'from-[#1a0a3d] to-[#0d0020]' };
  const isLic = type.name === 'Licorería';
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 w-20 h-20 rounded-2xl border transition-all ${
        active
          ? isLic
            ? 'bg-green-600 border-green-400 shadow-lg shadow-green-900/40'
            : 'border-opacity-60 shadow-lg'
          : isLic
            ? 'bg-[#0a1f0a] border-green-800/50 hover:border-green-600'
            : 'bg-[#111] border-[#222] hover:border-opacity-60'
      }`}
      style={active && !isLic ? {
        background: `linear-gradient(135deg, ${config.color}22, #111)`,
        borderColor: config.color,
        boxShadow: `0 0 16px ${config.color}33`,
      } : !active && !isLic ? {} : {}}>
      <span className="text-2xl leading-none">{config.emoji}</span>
      <p className={`text-[10px] font-bold leading-tight text-center ${active ? 'text-white' : isLic ? 'text-green-400' : 'text-gray-300'}`}>
        {type.name}
      </p>
      <p className={`text-[9px] ${active ? 'text-white/70' : 'text-gray-600'}`}>{count} locales</p>
    </motion.button>
  );
}

// ── Card licorería (carrusel) ─────────────────────────────
function LicoreriaCard({ venue }) {
  const navigate = useNavigate();
  const products = venue.available_products || [];
  const promoLabel = venue.promotions?.[0]?.title || null;
  const phone = venue.phone || '';

  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate(`/venue/${venue.id}`)}
      className="flex flex-col bg-[#0d1f0d] border border-[#1a3a1a] rounded-2xl overflow-hidden cursor-pointer hover:border-green-700/60 transition-colors h-full">
      {/* Foto */}
      <div className="relative h-36 bg-[#1a2a1a] flex-shrink-0">
        {venue.primary_photo ? (
          <img src={venue.primary_photo} alt={venue.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a2a0a] to-[#051205]">
            <span className="text-4xl">🍾</span>
          </div>
        )}
        {venue.has_delivery && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-bold">
            DELIVERY
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-white font-bold text-sm leading-tight">{venue.name}</p>
        {venue.has_delivery
          ? <p className="text-green-400 text-xs font-semibold">🛵 Delivery disponible</p>
          : <p className="text-gray-600 text-xs">Sin delivery</p>}
        {products.length > 0 && (
          <p className="text-gray-400 text-xs truncate">
            {products.slice(0, 3).map((p) => `${PRODUCT_EMOJIS[p] || '📦'} ${p}`).join(' · ')}
          </p>
        )}
        {promoLabel && (
          <span className="inline-block self-start px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-[#ff6b00]">
            🔥 {promoLabel}
          </span>
        )}
        {phone && (
          <p className="text-gray-500 text-xs flex items-center gap-1 mt-auto pt-1">
            <Phone className="w-3 h-3" /> {phone}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [venues, setVenues] = useState([]);
  const [rutaVenues, setRutaVenues] = useState([]);
  const [rutaPromos, setRutaPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [venueTypes, setVenueTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCurator, setActiveCurator] = useState('staff');
  const [showAllVenues, setShowAllVenues] = useState(false);
  const [showRuta, setShowRuta] = useState(false);
  const [rutaTab, setRutaTab] = useState('ruta');
  const scrollRef = useRef(null);
  const allVenuesRef = useRef(null);
  const eventPhase = getEventPhase();

  useEffect(() => {
    if (showRuta) window.history.pushState({ rutaOpen: true }, '');
  }, [showRuta]);

  useEffect(() => {
    const handlePopState = () => {
      if (showRuta) { setShowRuta(false); setRutaTab('ruta'); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showRuta]);

  const handleCloseRuta = () => {
    if (window.history.state?.rutaOpen) window.history.back();
    else { setShowRuta(false); setRutaTab('ruta'); }
  };

  useEffect(() => { fetchVenueTypes(); fetchVenues(); }, []);

  useEffect(() => {
    if (rutaTab === 'promos' && rutaPromos.length === 0 && rutaVenues.length > 0) fetchRutaPromos();
  }, [rutaTab, rutaVenues]);

  const fetchVenueTypes = async () => {
    try {
      const { data, error } = await supabase.from('venue_types').select('*').order('name');
      if (error) throw error;
      setVenueTypes(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*, venue_types(name), venue_photos(photo_url, is_primary), promotions(title)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const processedVenues = data.map((venue) => {
        const primaryPhoto = venue.venue_photos?.find((p) => p.is_primary);
        const photoPath = primaryPhoto?.photo_url || venue.venue_photos?.[0]?.photo_url;
        const imageUrl = photoPath
          ? supabase.storage.from('venue-photos').getPublicUrl(photoPath).data.publicUrl : null;
        return { ...venue, venue_type_name: venue.venue_types?.name, primary_photo: imageUrl };
      });

      const shuffled = [...processedVenues].sort(() => Math.random() - 0.5);
      setVenues(shuffled);
      setRutaVenues(processedVenues.filter((v) => v.is_ruta_partido));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchRutaPromos = async () => {
    setLoadingPromos(true);
    try {
      const venueIds = rutaVenues.map((v) => v.id);
      if (venueIds.length === 0) return;
      const { data, error } = await supabase
        .from('promotions')
        .select('*, venues(name, venue_photos(photo_url, is_primary))')
        .in('venue_id', venueIds).order('created_at', { ascending: false });
      if (error) throw error;
      setRutaPromos(data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingPromos(false); }
  };

  // Detectar licorería
  const licoreriaType = venueTypes.find((t) => t.name === 'Licorería');
  const isLicoreriaFilter = licoreriaType && selectedType === licoreriaType.id;

  // Conteo por tipo para CategoryCards
  const countByType = (typeId) => venues.filter((v) => v.venue_type_id === typeId).length;

  const filteredVenues = venues.filter((venue) => {
    const matchesType = selectedType === 'all' || venue.venue_type_id === selectedType;
    const matchesSearch =
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const licorerias = venues.filter((v) => v.venue_types?.name === 'Licorería');
  const nonLicoreriaVenues = venues.filter((v) => v.venue_types?.name !== 'Licorería');

  const getCuratorVenues = () => {
    const base = nonLicoreriaVenues;
    if (activeCurator === 'djs') return base.filter((_, i) => i % 3 === 0).slice(0, 8);
    if (activeCurator === 'influencers') return base.filter((_, i) => i % 2 === 0).slice(0, 8);
    return base.slice(0, 8);
  };

  const handleVerTodos = () => {
    setShowAllVenues(true);
    setTimeout(() => allVenuesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  };

  const handleOcultarTodos = () => {
    setShowAllVenues(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFiltering = searchQuery || selectedType !== 'all';

  // ── PANTALLA RUTA ─────────────────────────────────────
  if (showRuta) {
    const isChampions = eventPhase === 'champions';
    return (
      <div className="min-h-screen bg-[#0d0d0d] pb-10">
        <div className="sticky top-0 z-20 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-white/5 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={handleCloseRuta} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" /><span className="text-sm font-medium">Volver</span>
            </button>
            <h2 className="text-white font-bold text-base">{isChampions ? 'Ruta del Partido' : 'Ruta del Mundial'}</h2>
            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex border-b border-white/10 mb-5">
            {['ruta', 'promos', 'info'].map((tab) => (
              <button key={tab} onClick={() => setRutaTab(tab)}
                className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                  rutaTab === tab ? 'text-[#7928ca] border-[#7928ca]' : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}>
                {tab === 'ruta' ? 'Ruta' : tab === 'promos' ? 'Promos' : 'Info'}
              </button>
            ))}
          </div>
          <div className="relative rounded-2xl overflow-hidden mb-6">
            {isChampions
              ? <img src="/banner-ruta.jpeg" alt="Ruta del Partido" className="w-full object-cover rounded-2xl" />
              : <BannerMundial className="w-full object-cover rounded-2xl" />}
          </div>
          {rutaTab === 'ruta' && (
            rutaVenues.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[#7928ca]/10 border border-[#7928ca]/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">{isChampions ? '🏆' : '🌍'}</span>
                </div>
                <p className="text-white font-semibold mb-1">Próximamente</p>
                <p className="text-gray-500 text-sm">Los locales de la ruta se anunciarán pronto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rutaVenues.map((venue, i) => (
                  <motion.div key={venue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <RutaVenueRow venue={venue} index={i} />
                  </motion.div>
                ))}
              </div>
            )
          )}
          {rutaTab === 'promos' && (
            loadingPromos ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-[#7928ca] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rutaPromos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[#7928ca]/10 border border-[#7928ca]/20 flex items-center justify-center mx-auto mb-3">
                  <Tag className="w-7 h-7 text-[#7928ca]/50" />
                </div>
                <p className="text-white font-semibold mb-1">Sin promociones aún</p>
                <p className="text-gray-500 text-sm">Las promos de la ruta se anunciarán pronto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rutaPromos.map((promo, i) => {
                  const primaryPhoto = promo.venues?.venue_photos?.find((p) => p.is_primary);
                  const photoPath = primaryPhoto?.photo_url || promo.venues?.venue_photos?.[0]?.photo_url;
                  const imageUrl = photoPath ? supabase.storage.from('venue-photos').getPublicUrl(photoPath).data.publicUrl : null;
                  return (
                    <motion.div key={promo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 bg-[#161616] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#7928ca]/40 transition-colors">
                      {imageUrl
                        ? <img src={imageUrl} alt={promo.venues?.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #7928ca33, #ff008033)' }}>
                            <Tag className="w-5 h-5 text-[#7928ca]" />
                          </div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-500 text-xs mb-0.5 truncate">{promo.venues?.name}</p>
                        <p className="text-white font-bold text-sm mb-1">{promo.title}</p>
                        {promo.description && <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-line">{promo.description}</p>}
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                            style={{ background: 'linear-gradient(90deg, #7928ca, #ff0080)' }}>
                            <Tag className="w-3 h-3" /> Promo exclusiva
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )
          )}
          {rutaTab === 'info' && (
            <div className="rounded-2xl bg-[#161616] border border-[#222] p-5 space-y-4">
              {isChampions ? (
                <>
                  <div><p className="text-[#7928ca] text-xs font-bold uppercase tracking-widest mb-1">Evento</p><p className="text-white font-semibold">Final UEFA Champions League 2025</p></div>
                  <div><p className="text-[#7928ca] text-xs font-bold uppercase tracking-widest mb-1">Fecha y hora</p><p className="text-white font-semibold">Sábado 30 de mayo • 15:00</p></div>
                  <div><p className="text-[#7928ca] text-xs font-bold uppercase tracking-widest mb-1">Partido</p><p className="text-white font-semibold">PSG vs Arsenal</p></div>
                </>
              ) : (
                <>
                  <div><p className="text-[#7928ca] text-xs font-bold uppercase tracking-widest mb-1">Evento</p><p className="text-white font-semibold">FIFA Mundial 2026</p></div>
                  <div><p className="text-[#7928ca] text-xs font-bold uppercase tracking-widest mb-1">Más info</p><p className="text-white font-semibold">Próximamente</p></div>
                </>
              )}
              <div>
                <p className="text-[#7928ca] text-xs font-bold uppercase tracking-widest mb-1">Sobre la ruta</p>
                <p className="text-gray-400 text-sm">{isChampions ? 'Disfruta el partido en los mejores locales de Quito con promociones exclusivas solo por JapiNait.' : 'Vive el Mundial en los mejores locales de Quito con promociones exclusivas solo por JapiNait.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── HOME PRINCIPAL ─────────────────────────────────────
  const bgClass = isLicoreriaFilter ? 'bg-[#060f06]' : 'bg-[#0d0d0d]';

  return (
    <div className={`min-h-screen ${bgClass} pb-10 transition-colors duration-300`}>
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <p className="text-gray-500 text-xs mb-0.5">¡Listo para salir?</p>
          {isLicoreriaFilter ? (
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              🍾 Licorerías en <span className="text-green-400">Quito</span>
            </h1>
          ) : (
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              Descubre los mejores<br />
              lugares en <span className="text-[#7928ca]">Quito</span>
            </h1>
          )}
        </motion.div>

        {/* SEARCH */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text"
            placeholder={isLicoreriaFilter ? 'Buscar licorerías, bebidas, promociones...' : 'Buscar bares, discotecas, fiestas, eventos...'}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border rounded-xl text-white placeholder-gray-600 focus:outline-none transition-colors text-sm ${
              isLicoreriaFilter ? 'border-[#1a3a1a] focus:border-green-600' : 'border-[#2a2a2a] focus:border-[#7928ca]'
            }`} />
        </motion.div>

        {/* ACCESOS RÁPIDOS */}
        {!isFiltering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
            className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {[
              { icon: MapPin, label: 'Cerca de ti', sub: 'Explora locales', color: '#ff0080' },
              { icon: Zap, label: 'Abiertos ahora', sub: 'En este momento', color: '#7928ca' },
              { icon: Gift, label: 'Promociones', sub: 'Las mejores ofertas', color: '#ff6b00' },
              { icon: Calendar, label: 'Eventos hoy', sub: 'No te los pierdas', color: '#00c9a7' },
            ].map((item) => (
              <button key={item.label}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#333] transition-colors">
                <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                <div className="text-left">
                  <p className="text-white text-xs font-semibold leading-tight">{item.label}</p>
                  <p className="text-gray-600 text-[10px] leading-tight">{item.sub}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {/* FILTROS PILL — solo Todos + tipos sin categoría cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          <PillFilter active={selectedType === 'all'} onClick={() => setSelectedType('all')}>Todos</PillFilter>
          {venueTypes.filter((t) => t.name !== 'Licorería').map((type) => (
            <PillFilter key={type.id} active={selectedType === type.id} onClick={() => setSelectedType(type.id)}>
              {type.name}
            </PillFilter>
          ))}
          {/* Pill especial licorería */}
          {licoreriaType && (
            <button onClick={() => setSelectedType(licoreriaType.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                isLicoreriaFilter
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-[#0d1f0d] border-green-800/60 text-green-400 hover:border-green-600'
              }`}>
              🍾 Licorería <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </motion.div>

        {/* ── MODO FILTRADO LICORERÍA ── */}
        {isLicoreriaFilter ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-base">🍾 Licorerías cerca de ti</h2>
              <span className="text-green-400 text-xs font-semibold">{filteredVenues.length} resultados</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredVenues.length > 0 ? (
              <>
                <div className="space-y-3 mb-6">
                  {filteredVenues.map((venue, i) => (
                    <motion.div key={venue.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <LicoreriaCardHorizontal venue={venue} />
                    </motion.div>
                  ))}
                </div>
                <div className="rounded-2xl bg-[#0d1f0d] border border-green-800/40 p-5 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-0.5">¿Listo para tu pedido?</p>
                    <p className="text-gray-400 text-xs">Llama o escribe por WhatsApp directamente a la licorería y realiza tu pedido.</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <span className="text-4xl block mb-3">🍾</span>
                <p className="text-white font-semibold mb-1">Sin resultados</p>
                <p className="text-gray-500 text-sm mb-4">Intenta con otra búsqueda</p>
                <button onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
                  className="px-5 py-2 rounded-full bg-green-700 text-white text-sm font-semibold">
                  Limpiar filtros
                </button>
              </div>
            )}
          </section>

        ) : isFiltering ? (
          /* ── MODO FILTRADO NORMAL ── */
          <section>
            <p className="text-gray-500 text-sm mb-4">
              Mostrando <span className="text-white font-semibold">{filteredVenues.length}</span>{' '}
              {filteredVenues.length === 1 ? 'local' : 'locales'}
            </p>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-[#7928ca] border-t-transparent rounded-full animate-spin" />
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
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-[#7928ca] to-[#ff0080] text-white text-sm font-semibold">
                  Limpiar filtros
                </button>
              </div>
            )}
          </section>

        ) : (
          /* ── HOME NORMAL ── */
          <>
            {MOSTRAR_RUTA && (
              <>
                {eventPhase === 'champions' ? (
                  <>
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }} className="relative rounded-2xl overflow-hidden mb-6 cursor-pointer"
                      onClick={() => setShowRuta(true)}>
                      <img src="/banner-ruta.jpeg" alt="Ruta del Partido" className="w-full object-cover rounded-2xl" style={{ maxHeight: 200 }} />
                    </motion.div>
                    <section className="mb-7">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-white font-bold text-base">Eventos cerca de ti</h2>
                      </div>
                      <button onClick={() => setShowRuta(true)}
                        className="w-full flex items-center gap-3 bg-[#161616] border border-[#2a2a2a] rounded-xl p-3 hover:border-[#7928ca]/50 transition-colors">
                        <div className="w-16 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#160830] to-[#0c1535] flex items-center justify-center">
                          <span className="text-3xl">⚽</span>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-white font-bold text-sm">Final Champions League</p>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#7928ca' }}>Top</span>
                          </div>
                          <p className="text-gray-400 text-xs">PSG vs Arsenal</p>
                          <p className="text-gray-600 text-xs mt-0.5">Sábado 30 de mayo • 15:00</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      </button>
                    </section>
                  </>
                ) : (
                  <>
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }} className="relative rounded-2xl overflow-hidden mb-6 cursor-pointer"
                      onClick={() => setShowRuta(true)}>
                      <BannerMundial className="w-full object-cover rounded-2xl" style={{ maxHeight: 200 }} />
                    </motion.div>
                    <section className="mb-7">
                      <button onClick={() => setShowRuta(true)}
                        className="w-full flex items-center gap-3 bg-[#161616] border border-[#2a2a2a] rounded-xl p-3 hover:border-[#7928ca]/50 transition-colors">
                        <div className="w-16 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#0c2c0c] to-[#0c1535] flex items-center justify-center">
                          <span className="text-3xl">🌍</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-bold text-sm">Ruta del Mundial 2026</p>
                          <p className="text-gray-400 text-xs">Los mejores locales de Quito</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      </button>
                    </section>
                  </>
                )}
              </>
            )}

            {/* RECOMENDADO POR */}
            <section className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-base">Recomendado por...</h2>
                <button onClick={handleVerTodos} className="flex items-center gap-1 text-[#7928ca] text-xs font-semibold">
                  Ver todas <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {CURATORS.map((c) => (
                  <button key={c.id} onClick={() => setActiveCurator(c.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeCurator === c.id ? 'bg-[#7928ca] text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
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

            {/* TODOS LOS LOCALES — con category cards */}
            <section ref={allVenuesRef} className="mb-7">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-bold text-base">Todos los locales</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{nonLicoreriaVenues.length} locales disponibles</p>
                </div>
                <button onClick={handleVerTodos} className="flex items-center gap-1 text-[#7928ca] text-xs font-semibold">
                  Ver todos <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Category cards scroll */}
              <div className="flex gap-3 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
                {venueTypes.filter((t) => t.name !== 'Licorería').map((type) => (
                  <CategoryCard key={type.id} type={type} count={countByType(type.id)}
                    active={selectedType === type.id} onClick={() => setSelectedType(selectedType === type.id ? 'all' : type.id)} />
                ))}
              </div>

              {/* Grid venues */}
              <div className="grid grid-cols-2 gap-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-52 rounded-2xl bg-[#161616] animate-pulse" />
                    ))
                  : nonLicoreriaVenues.slice(0, showAllVenues ? undefined : 4).map((venue, i) => (
                      <motion.div key={venue.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <VenueCard venue={venue} />
                      </motion.div>
                    ))}
              </div>

              {!showAllVenues && !loading && nonLicoreriaVenues.length > 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-5">
                  <button onClick={handleVerTodos}
                    className="px-6 py-3 rounded-full text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(90deg, #7928ca, #ff0080)' }}>
                    Ver todos los locales ({nonLicoreriaVenues.length})
                  </button>
                </motion.div>
              )}
              {showAllVenues && (
                <div className="text-center mt-5">
                  <button onClick={handleOcultarTodos}
                    className="flex items-center gap-1 text-gray-500 text-xs font-semibold mx-auto hover:text-white transition-colors">
                    <ChevronUp className="w-3 h-3" /> Ocultar
                  </button>
                </div>
              )}
            </section>

            {/* LICORERÍAS CERCA DE TI — carrusel */}
            {licorerias.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold text-base flex items-center gap-2">
                    🍾 Licorerías cerca de ti
                  </h2>
                  <button onClick={() => licoreriaType && setSelectedType(licoreriaType.id)}
                    className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                    Ver todas <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                  {licorerias.map((venue, i) => (
                    <motion.div key={venue.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex-shrink-0" style={{ width: '72vw', maxWidth: 280 }}>
                      <LicoreriaCard venue={venue} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* FOOTER */}
        <div className="text-center pt-8 mt-4 border-t border-[#1a1a1a]">
          <p className="text-gray-700 text-xs mb-2">© 2026 JapiNait · Todos los derechos reservados</p>
          <div className="flex items-center justify-center gap-4">
            <a href="https://zippy-squid-771.notion.site/T-rminos-y-condiciones-JapiNait-32d1a5c981e3808b8677db339c805b62"
              target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#7928ca] text-xs transition-colors">
              Términos y Condiciones
            </a>
            <span className="text-gray-700">·</span>
            <a href="https://zippy-squid-771.notion.site/Pol-ticas-de-privacidad-JapiNait-32d1a5c981e38020ba2cebac2bf14240"
              target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#7928ca] text-xs transition-colors">
              Política de Privacidad
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Card licorería horizontal (modo lista) ────────────────
function LicoreriaCardHorizontal({ venue }) {
  const navigate = useNavigate();
  const products = venue.available_products || [];
  const promoLabel = venue.promotions?.[0]?.title || null;
  const phone = venue.phone || '';
  return (
    <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate(`/venue/${venue.id}`)}
      className="flex gap-3 bg-[#0d1f0d] border border-[#1a3a1a] rounded-2xl p-3 cursor-pointer hover:border-green-700/60 transition-colors">
      <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[#1a2a1a]">
        {venue.primary_photo
          ? <img src={venue.primary_photo} alt={venue.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl">🍾</span></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight truncate mb-0.5">{venue.name}</p>
        {venue.has_delivery
          ? <p className="text-green-400 text-xs font-semibold">🛵 Delivery disponible</p>
          : <p className="text-gray-500 text-xs">Sin delivery</p>}
        {products.length > 0 && (
          <p className="text-gray-400 text-xs mt-1 truncate">
            {products.slice(0, 3).map((p) => `${PRODUCT_EMOJIS[p] || '📦'} ${p}`).join(' · ')}
          </p>
        )}
        {promoLabel && (
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold text-white bg-[#ff6b00]">
            🔥 {promoLabel}
          </span>
        )}
        {phone && (
          <p className="text-gray-500 text-xs mt-1.5 flex items-center gap-1">
            <Phone className="w-3 h-3" /> {phone}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function RutaVenueRow({ venue, index }) {
  const navigate = useNavigate();
  const imageUrl = venue.primary_photo || null;
  return (
    <div onClick={() => navigate(`/venue/${venue.id}`)}
      className="flex items-center gap-3 bg-[#161616] border border-[#2a2a2a] rounded-xl p-3 hover:border-[#7928ca]/40 transition-colors cursor-pointer">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #7928ca, #ff0080)' }}>
        {index + 1}
      </div>
      {imageUrl
        ? <img src={imageUrl} alt={venue.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        : <div className="w-12 h-12 rounded-xl bg-[#7928ca]/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-[#7928ca]/60" />
          </div>}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{venue.name}</p>
        <p className="text-gray-500 text-xs truncate">{venue.address}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
    </div>
  );
}

function PillFilter({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        active ? 'bg-white text-black' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#7928ca] hover:text-white'
      }`}>
      {children}
    </button>
  );
}
