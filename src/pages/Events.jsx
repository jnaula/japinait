import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, CalendarDays, Grid, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Auto-elimina eventos cuya fecha ya pasó
async function purgeExpiredEvents() {
  try {
    const now = new Date().toISOString();
    await supabase.from('events').delete().lt('event_date', now);
  } catch (err) {
    console.error('purgeExpiredEvents:', err);
  }
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      await purgeExpiredEvents();
      await fetchEvents();
    })();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*, venues(id, name, address, venue_types(name))')
        .gte('event_date', now)           // Solo eventos futuros
        .order('event_date', { ascending: true });

      if (error) throw error;

      const processed = (data || []).map((e) => ({
        ...e,
        venue_id: e.venues?.id,
        venue_name: e.venues?.name,
        venue_address: e.venues?.address,
        venue_type: e.venues?.venue_types?.name,
      }));

      setEvents(processed);
    } catch (err) {
      console.error('Events: fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Calendario ────────────────────────────────────────────────────────────
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m, y) => new Date(y, m, 1).getDay();

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDay(selectedMonth, selectedYear);
    const monthEvents = filteredEvents.filter((e) => {
      const d = new Date(e.event_date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="aspect-square" />);
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = monthEvents.filter((e) => new Date(e.event_date).getDate() === day);
      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === selectedMonth &&
        new Date().getFullYear() === selectedYear;

      cells.push(
        <div key={day}
          className={`aspect-square p-1.5 rounded-xl border transition-colors ${
            dayEvents.length > 0
              ? 'bg-[#0f0f0f] border-[#ff0080]/30 hover:border-[#ff0080]'
              : isToday
              ? 'bg-[#7928ca]/10 border-[#7928ca]/30'
              : 'bg-[#0a0a0a] border-[#1a1a1a]'
          }`}
        >
          <p className={`text-xs font-bold mb-0.5 ${isToday ? 'text-[#7928ca]' : dayEvents.length > 0 ? 'text-white' : 'text-gray-600'}`}>
            {day}
          </p>
          {dayEvents.slice(0, 2).map((e) => (
            <div key={e.id} className="text-[9px] text-white truncate px-1 py-0.5 rounded mb-0.5"
              style={{ background: 'linear-gradient(90deg, #ff0080, #7928ca)' }}>
              {e.name}
            </div>
          ))}
          {dayEvents.length > 2 && <p className="text-[9px] text-gray-500">+{dayEvents.length - 2}</p>}
        </div>
      );
    }
    return cells;
  };

  // ── Próximo evento destacado ──────────────────────────────────────────────
  const nextEvent = filteredEvents[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-10">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">
                Eventos <span className="text-[#ff0080]">🎉</span>
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} próximo{filteredEvents.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-[#ff0080] text-white' : 'bg-[#161616] text-gray-400 border border-[#222]'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('calendar')}
                className={`p-2.5 rounded-xl transition-colors ${viewMode === 'calendar' ? 'bg-[#ff0080] text-white' : 'bg-[#161616] text-gray-400 border border-[#222]'}`}>
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar eventos o locales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#161616] border border-[#222] rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080] transition-colors text-sm"
          />
        </motion.div>

        {/* Evento destacado (el más próximo) */}
        {!searchQuery && nextEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="relative rounded-2xl overflow-hidden mb-6 cursor-pointer"
            style={{ minHeight: 160 }}
            onClick={() => {}}
          >
            {nextEvent.photo_url || nextEvent.image_url ? (
              <img
                src={nextEvent.photo_url || nextEvent.image_url}
                alt={nextEvent.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, #1a0533 0%, #160830 50%, #0d1a3a 100%)' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-[#7928ca]/25 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-48 h-24 bg-[#ff0080]/15 rounded-full blur-2xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <div className="relative z-10 p-5 flex flex-col justify-end h-full" style={{ minHeight: 160 }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest">Próximo evento</span>
              </div>
              <h2 className="text-white text-xl font-black leading-tight mb-1">{nextEvent.name}</h2>
              <div className="flex items-center gap-3 text-gray-300 text-xs">
                {nextEvent.venue_name && (
                  <span className="flex items-center gap-1">
                    <span className="text-[#7928ca]">📍</span> {nextEvent.venue_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="text-[#ff0080]">🕐</span>
                  {new Date(nextEvent.event_date).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                  {' · '}
                  {new Date(nextEvent.event_date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Calendario */}
        {viewMode === 'calendar' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
                  else setSelectedMonth(m => m - 1);
                }}
                className="p-2 bg-[#1a1a1a] rounded-xl text-white font-bold hover:bg-[#2a2a2a]">←</button>
              <p className="text-white font-bold">{MONTH_NAMES[selectedMonth]} {selectedYear}</p>
              <button
                onClick={() => {
                  if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
                  else setSelectedMonth(m => m + 1);
                }}
                className="p-2 bg-[#1a1a1a] rounded-xl text-white font-bold hover:bg-[#2a2a2a]">→</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['D','L','M','X','J','V','S'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-600">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          </motion.div>
        )}

        {/* Grid de eventos */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4">
            {filteredEvents.map((event, i) => (
              <motion.div key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <EventCard
                  event={event}
                  onNavigateToVenue={(venueId) => navigate(`/venue/${venueId}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#161616] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-white font-bold mb-1">Sin eventos próximos</p>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'Intenta con otro término' : 'Pronto habrá eventos disponibles'}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="mt-4 px-5 py-2 rounded-full text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(90deg, #ff0080, #7928ca)' }}>
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
