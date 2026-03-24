import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Trash2, Plus, X } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBBy7nFUipYZ1FDegs-SsgZ9d7ViAZqInI';

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
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);

  // ✅ FIX 1: getUserLocation ya no se llama automáticamente
  useEffect(() => {
    fetchVenue();
    fetchVenueTypes();
  }, [id]);

  // Solo se usa como fallback si el venue no tiene coordenadas
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // ✅ NO llamamos reverseGeocode para no pisar el address
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.warn('No se pudo obtener ubicación, usando predeterminada', error);
          setLatitude(-0.1807);
          setLongitude(-78.4678);
        }
      );
    } else {
      setLatitude(-0.1807);
      setLongitude(-78.4678);
    }
  };

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

      if (data.latitude && data.longitude) {
        // ✅ Venue tiene coords → las usamos SIN llamar reverseGeocode
        setLatitude(data.latitude);
        setLongitude(data.longitude);
      } else {
        // Solo si no hay coordenadas guardadas usamos la ubicación del usuario
        getUserLocation();
      }

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

  // reverseGeocode solo cuando el usuario mueve el pin manualmente
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      }
    } catch (err) {
      console.error('Error de geocoding:', err);
    }
  };

  // ✅ FIX 2: Preview de fotos nuevas con createObjectURL
  const handlePhotoChange = (e) => {
    const newFiles = [...e.target.files];
    if (newFiles.length === 0) return;

    setPhotos((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Eliminar foto nueva antes de guardar
  const handleRemoveNewPhoto = (index) => {
    URL.revokeObjectURL(photoPreviews[index]); // liberar memoria
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!name || !address || !venueType)
      return alert('Completa nombre, dirección y tipo de local');

    const { error } = await supabase
      .from('venues')
      .update({ name, description, address, venue_type_id: venueType, latitude, longitude })
      .eq('id', id);
    if (error) return alert('Error al actualizar');

    for (const file of photos) {
      const fileName = `${id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('venue-photos')
        .upload(fileName, file);
      if (!uploadError) {
        await supabase
          .from('venue_photos')
          .insert({ venue_id: id, photo_url: fileName, is_primary: false });
      }
    }

    // Limpiar URLs de objeto al guardar
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));

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

      {latitude && longitude && (
        <div className="w-full h-64 rounded-lg overflow-hidden border border-[#222]">
          
            <Map
              defaultZoom={15}
              defaultCenter={{ lat: latitude, lng: longitude }}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
              onClick={(e) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setLatitude(lat);
                setLongitude(lng);
                reverseGeocode(lat, lng); // ✅ Solo aquí se actualiza el address
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
          
        </div>
      )}

      <div>
        <label className="block mb-2 font-semibold">Fotos existentes</label>
        <div className="flex flex-wrap gap-2">
          {existingPhotos.length === 0 && (
            <p className="text-sm text-gray-500">Sin fotos guardadas</p>
          )}
          {existingPhotos.map((photo) => {
            const url = supabase.storage
              .from('venue-photos')
              .getPublicUrl(photo.photo_url).data.publicUrl;
            return (
              <div key={photo.id} className="relative w-24 h-24">
                <img src={url} className="w-24 h-24 object-cover rounded-lg" alt="foto existente" />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            );
          })}
        </div>

        {/* ✅ FIX 2: Previews de fotos nuevas */}
        <label className="block mt-4 mb-2 font-semibold">Añadir fotos</label>
        <div className="flex flex-wrap gap-2">
          {photoPreviews.map((previewUrl, index) => (
            <div key={index} className="relative w-24 h-24">
              <img
                src={previewUrl}
                className="w-24 h-24 object-cover rounded-lg opacity-80 border border-[#ff0080]"
                alt={`nueva foto ${index + 1}`}
              />
              <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-[#ff0080]/80 rounded-b-lg py-0.5">
                Nueva
              </span>
              <button
                onClick={() => handleRemoveNewPhoto(index)}
                className="absolute top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}

          <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-[#222] rounded-lg cursor-pointer hover:border-[#ff0080] transition-colors">
            <Plus className="w-6 h-6 text-white" />
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        </div>
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