import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, X, Share2, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return {
    day: days[d.getDay()],
    date: d.getDate(),
    month: months[d.getMonth()],
    time: d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

function Countdown({ eventDate }) {
  const now = new Date();
  const diff = new Date(eventDate) - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 30) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <Clock className="w-3 h-3 text-[#ff0080]" />
      <span className="text-[#ff0080] text-xs font-bold">
        {days > 0 ? `En ${days}d ${hours}h` : hours > 0 ? `En ${hours}h ${mins}m` : `En ${mins} min`}
      </span>
    </div>
  );
}

export default function EventCard({ event, onNavigateToVenue }) {
  const [expanded, setExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const formatted = formatDate(event.event_date);
  const imageUrl = event.photo_url || event.image_url || null;

  const toggleFavorite = (e) => {
    e.stopPropagation();
    if (!user) return;
    setIsFavorite(!isFavorite);
  };

  return (
    <>
      {/* ── CARD ── */}
      <motion.div
        whileHover={{ y: -4 }}
        onClick={() => setExpanded(true)}
        className="relative bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl overflow-hidden cursor-pointer hover:border-[#ff0080]/40 transition-all group"
      >
        {/* Imagen o gradiente */}
        <div className="relative h-44 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 100%)' }}>
              <div className="text-6xl opacity-30">🎉</div>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#7928ca]/20 rounded-full blur-3xl" />
              </div>
            </div>
          )}
          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />

          {/* Badge de fecha flotante */}
          <div className="absolute top-3 left-3 flex flex-col items-center px-2.5 py-2 rounded-xl bg-black/70 backdrop-blur-sm border border-white/10 min-w-[44px]">
            <span className="text-[#ff0080] text-[10px] font-bold uppercase leading-none">{formatted.month}</span>
            <span className="text-white text-xl font-black leading-tight">{formatted.date}</span>
            <span className="text-gray-400 text-[10px] uppercase leading-none">{formatted.day}</span>
          </div>

          {/* Favorito */}
          <button
            onClick={toggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-sm"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#ff0080] text-[#ff0080]' : 'text-white'}`} />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-bold text-base leading-tight mb-1 line-clamp-1 group-hover:text-[#ff0080] transition-colors">
            {event.name}
          </h3>

          {event.venue_name && (
            <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
              <MapPin className="w-3 h-3 flex-shrink-0 text-[#7928ca]" />
              <span className="line-clamp-1">{event.venue_name}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Clock className="w-3 h-3 flex-shrink-0 text-[#ff0080]" />
            <span>{formatted.time}</span>
          </div>

          <Countdown eventDate={event.event_date} />

          {event.description && (
            <p className="text-gray-600 text-xs mt-2 line-clamp-2">{event.description}</p>
          )}
        </div>

        {/* Barra inferior con tipo de venue */}
        {event.venue_type && (
          <div className="px-4 pb-3">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#7928ca]/15 text-[#a855f7] border border-[#7928ca]/20">
              {event.venue_type}
            </span>
          </div>
        )}
      </motion.div>

      {/* ── MODAL EXPANDIDO ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 flex items-end justify-center p-0"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0f0f0f] rounded-t-3xl overflow-hidden border-t border-[#1a1a1a] max-h-[90vh] overflow-y-auto"
            >
              {/* Hero imagen */}
              <div className="relative h-56">
                {imageUrl ? (
                  <img src={imageUrl} alt={event.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #1a0533 0%, #160830 50%, #0d1a3a 100%)' }}>
                    <div className="text-8xl opacity-20">🎉</div>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-[#7928ca]/25 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 right-0 w-48 h-24 bg-[#ff0080]/15 rounded-full blur-2xl" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white/30 text-sm font-medium">Sin imagen</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-black/30" />

                {/* Botones top */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <button
                    onClick={() => setExpanded(false)}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button onClick={toggleFavorite} className="p-2 rounded-full bg-black/60 backdrop-blur-sm">
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#ff0080] text-[#ff0080]' : 'text-white'}`} />
                    </button>
                  </div>
                </div>

                {/* Badge fecha */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-[#ff0080]" />
                  <span className="text-white text-xs font-semibold">{formatted.full}</span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5">
                <h2 className="text-2xl font-black text-white mb-1">{event.name}</h2>

                {event.venue_type && (
                  <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold bg-[#7928ca]/15 text-[#a855f7] border border-[#7928ca]/20">
                    {event.venue_type}
                  </span>
                )}

                {/* Info rápida */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2.5 p-3 bg-[#161616] border border-[#222] rounded-xl">
                    <Clock className="w-4 h-4 text-[#ff0080] flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-[10px]">Hora</p>
                      <p className="text-white text-sm font-bold">{formatted.time}</p>
                    </div>
                  </div>
                  {event.venue_name && (
                    <div className="flex items-center gap-2.5 p-3 bg-[#161616] border border-[#222] rounded-xl">
                      <MapPin className="w-4 h-4 text-[#7928ca] flex-shrink-0" />
                      <div>
                        <p className="text-gray-500 text-[10px]">Local</p>
                        <p className="text-white text-sm font-bold line-clamp-1">{event.venue_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Countdown destacado */}
                {(() => {
                  const diff = new Date(event.event_date) - new Date();
                  if (diff <= 0 || diff > 30 * 24 * 60 * 60 * 1000) return null;
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  return (
                    <div className="flex items-center gap-3 p-4 rounded-2xl mb-4"
                      style={{ background: 'linear-gradient(135deg, #1a0533, #0d1a3a)' }}>
                      <div className="w-10 h-10 rounded-xl bg-[#ff0080]/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-[#ff0080]" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Comienza en</p>
                        <p className="text-white font-black text-lg">
                          {days > 0 ? `${days} días ${hours}h` : `${hours} horas`}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Descripción */}
                {event.description && (
                  <div className="mb-4">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">Descripción</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
                  </div>
                )}

                {/* Dirección */}
                {event.venue_address && (
                  <div className="flex items-start gap-3 p-4 bg-[#161616] border border-[#222] rounded-xl mb-4">
                    <MapPin className="w-4 h-4 text-[#7928ca] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Dirección</p>
                      <p className="text-white text-sm">{event.venue_address}</p>
                    </div>
                  </div>
                )}

                {/* Botón ir al local */}
                {event.venue_id && (
                  <button
                    onClick={() => { setExpanded(false); onNavigateToVenue?.(event.venue_id); }}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(90deg, #ff0080, #7928ca)' }}
                  >
                    Ver local →
                  </button>
                )}
              </div>
              <div className="h-4" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
