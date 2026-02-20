import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Search, Filter, Grid, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      console.log('Events: Fetching events...');
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venues(name, address, venue_types(name))
        `)
        .order('event_date', { ascending: true });

      if (error) throw error;

      console.log('Events: Events fetched:', data);

      const processedEvents = data.map((event) => ({
        ...event,
        venue_name: event.venues?.name,
        venue_address: event.venues?.address,
        venue_type: event.venues?.venue_types?.name,
      }));

      setEvents(processedEvents);
    } catch (err) {
      console.error('Events: Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = () => {
    return events.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredEvents = getFilteredEvents();

  const getEventsForMonth = () => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.event_date);
      return (
        eventDate.getMonth() === selectedMonth &&
        eventDate.getFullYear() === selectedYear
      );
    });
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const monthEvents = getEventsForMonth();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = monthEvents.filter((event) => {
        const eventDate = new Date(event.event_date);
        return eventDate.getDate() === day;
      });

      days.push(
        <motion.div
          key={day}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`aspect-square p-2 border border-[#1a1a1a] rounded-lg ${
            dayEvents.length > 0 ? 'bg-[#0f0f0f] hover:border-[#ff0080]' : 'bg-[#0a0a0a]'
          } transition-colors cursor-pointer`}
        >
          <div className="text-sm font-medium text-gray-400 mb-1">{day}</div>
          {dayEvents.length > 0 && (
            <div className="space-y-1">
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className="text-xs text-white truncate px-1 py-0.5 bg-gradient-to-r from-[#ff0080] to-[#7928ca] rounded"
                  title={event.name}
                >
                  {event.name}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-gray-500">+{dayEvents.length - 2} más</div>
              )}
            </div>
          )}
        </motion.div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Próximos <span className="bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-transparent bg-clip-text">Eventos</span>
              </h1>
              <p className="text-gray-400">Descubre los eventos más populares de la ciudad</p>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white'
                    : 'bg-[#0f0f0f] text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('calendar')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white'
                    : 'bg-[#0f0f0f] text-gray-400 hover:text-white'
                }`}
              >
                <CalendarDays className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Search className="w-5 h-5 text-[#ff0080]" />
              <h2 className="text-lg font-semibold text-white">Buscar Eventos</h2>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre de evento o local..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] transition-colors"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Filter className="w-5 h-5 text-[#ff0080]" />
              <h2 className="text-lg font-semibold text-white">Filter by Status</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </FilterButton>
              <FilterButton
                active={statusFilter === 'upcoming'}
                onClick={() => setStatusFilter('upcoming')}
              >
                Upcoming
              </FilterButton>
              <FilterButton
                active={statusFilter === 'ongoing'}
                onClick={() => setStatusFilter('ongoing')}
              >
                Ongoing
              </FilterButton>
              <FilterButton
                active={statusFilter === 'completed'}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </FilterButton>
            </div>
          </motion.div>
        </div>

        {viewMode === 'calendar' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
                className="p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <span className="text-white font-bold">←</span>
              </motion.button>
              <h2 className="text-2xl font-bold text-white">
                {monthNames[selectedMonth]} {selectedYear}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
                className="p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <span className="text-white font-bold">→</span>
              </motion.button>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-400">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'grid' && filteredEvents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors"
              >
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>

                  {event.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <Calendar className="w-4 h-4 text-[#ff0080]" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>

                    {event.venue_name && (
                      <div className="flex items-start space-x-2 text-sm text-gray-300">
                        <MapPin className="w-4 h-4 text-[#ff0080] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{event.venue_name}</p>
                          {event.venue_address && (
                            <p className="text-xs text-gray-500">{event.venue_address}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === 'upcoming'
                        ? 'bg-blue-500/20 text-blue-400'
                        : event.status === 'ongoing'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {event.status === 'upcoming'
                      ? 'Upcoming'
                      : event.status === 'ongoing'
                      ? 'Ongoing'
                      : 'Completed'}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
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
