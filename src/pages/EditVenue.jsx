import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Trash2, Plus } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'TU_GOOGLE_MAPS_API_KEY_AQUI'; // Pon tu API Key de Google

export default function EditVenue() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [venueTypes, setVenueTypes] = useState([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [venueType, setVenueType] = useState('');
  const [latitude, setLatitude] = useState(-0.1807);
  const [longitude, setLongitude] = useState(-78.4678);

  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);

  useEffect(() => {
    fetchVenue();
    fetchVenueTypes();
  }, [id]);

  async function fetchVenue() {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      setVenue(data);
      setName(data.name);
      setDescription(data.description);
      setAddress(data.address);
      setVenueType(data.venue_type_id);
      setLatitude(data.latitude || -0.1807);
      setLongitude(data.longitude || -78.4678);

      const { data: photosData } = await supabase
        .from('venue_photos')
        .select('*')
        .eq('venue_id', id)
        .order('order_index');
      setExistingPhotos(photosData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVenueTypes() {
    const { data } = await supabase.from('venue_types').select('*');
    if (data) setVenueTypes(data);
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const handleUpdate = async () => {
    if (!name || !address || !venueType) {
      alert('Completa nombre, dirección y tipo de local');
      return;
    }

    const { error } = await supabase
      .from('venues')
      .update({ name, description, address, venue_type_id: venueType, latitude, longitude })
      .eq('id', id);
    if (error) return alert('Error al actualizar');

    for (const file of photos) {
      const fileName = `${id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('venue-photos').upload(fileName, file);
      if (!uploadError) {
        await supabase.from('venue_photos').insert({ venue_id: id, photo_url: fileName, is_primary: false });
      }
    }

    alert('Local actualizado 🔥');
    navigate(`/venue/${id}`);
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('¿Eliminar foto?')) return;
    const { error } = await supabase.from('venue_photos').delete().eq('id', photoId);
    if (!error) setExistingPhotos(existingPhotos.filter((p) => p.id !== photoId));
  };

  if (loading) return <div className="p-4 text-white">Cargando...</div>;
  if (!venue) return <div className="p-4 text-white">No encontrado</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">Editar Local</h1>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="Descripción"
        className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
      />

      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Dirección"
        className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
      />

      <select
        value={venueType}
        onChange={(e) => setVenueType(e.target.value)}
        className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
      >
        <option value="">Selecciona un tipo</option>
        {venueTypes.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <div className="w-full h-64 rounded-lg overflow-hidden border border-[#222]">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultZoom={15}
            defaultCenter={{ lat: latitude, lng: longitude }}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            onClick={(e) => {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              setLatitude(lat);
              setLongitude(lng);
              reverseGeocode(lat, lng);
            }}
          >
            <AdvancedMarker
              position={{ lat: latitude, lng: longitude }}
              draggable
              onDragEnd={(e) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setLatitude(lat);
                setLongitude(lng);
                reverseGeocode(lat, lng);
              }}
            >
              <div className="w-6 h-6 bg-[#ff0080] rounded-full border-2 border-white" />
            </AdvancedMarker>
          </Map>
        </APIProvider>
      </div>

      <div>
        <label className="block mb-2">Fotos existentes</label>
        <div className="flex space-x-2 overflow-x-auto">
          {existingPhotos.map((photo) => {
            const url = supabase.storage.from('venue-photos').getPublicUrl(photo.photo_url).data.publicUrl;
            return (
              <div key={photo.id} className="relative w-24 h-24">
                <img src={url} className="w-24 h-24 object-cover rounded-lg" />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-0 right-0 p-1 bg-black/70 rounded-full hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            );
          })}
        </div>

        <label className="block mt-4 mb-2">Añadir fotos</label>
        <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-[#222] rounded-lg cursor-pointer hover:border-[#ff0080]">
          <Plus className="w-6 h-6 text-white" />
          <input type="file" multiple className="hidden" onChange={(e) => setPhotos([...photos, ...e.target.files])} />
        </label>
      </div>

      <button
        onClick={handleUpdate}
        className="w-full py-3 mt-4 rounded-lg bg-[#ff0080] hover:bg-[#e60073] transition-colors font-semibold"
      >
        Guardar cambios
      </button>
    </div>
  );
}