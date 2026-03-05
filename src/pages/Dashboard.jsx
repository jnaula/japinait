import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateEventModal from '../components/CreateEventModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myVenues, setMyVenues] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);

  useEffect(() => {
    fetchMyVenues();
  }, []);

  useEffect(() => {
    if (myVenues.length > 0) {
      fetchMyEvents(myVenues);
    }
  }, [myVenues]);

  async function fetchMyVenues() {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('owner_id', user.id);

    if (!error) setMyVenues(data);
    setLoading(false);
  }

  async function fetchMyEvents(venues) {
  const venueIds = venues.map((v) => v.id);

  if (venueIds.length === 0) {
    setMyEvents([]);
    return;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('venue_id', venueIds);

  if (!error) {
    setMyEvents(data);
  }
}

  function handleCreateEvent(venue) {
    setSelectedVenue(venue);
    setIsEventModalOpen(true);
  }

  if (loading) return <p className="text-center mt-10">Cargando...</p>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Mi Dashboard</h1>

      {/* Botón registrar nuevo local */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/register-venue')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
        >
          Registrar Nuevo Local
        </button>
      </div>

      {/* Lista de locales */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myVenues.map((venue) => (
          <div
            key={venue.id}
            className="bg-gray-900 p-5 rounded-xl shadow-lg border border-gray-800"
          >
            <h2 className="text-lg font-semibold">{venue.name}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {venue.description}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => navigate('/venues/${venue.id}/edit')}
                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Editar
              </button>

              <button
                onClick={() => handleCreateEvent(venue)}
                className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md"
              >
                Crear Evento
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Evento */}
      {isEventModalOpen && selectedVenue && (
        <CreateEventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          venueId={selectedVenue.id}
        />
      )}
    </div>
  );
}