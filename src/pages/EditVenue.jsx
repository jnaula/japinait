import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function EditVenue() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados del venue
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [venueType, setVenueType] = useState('');
  const [photos, setPhotos] = useState([]); // fotos nuevas
  const [existingPhotos, setExistingPhotos] = useState([]); // fotos existentes
  const [venueTypes, setVenueTypes] = useState([]); // opciones del select

  // Cargar datos
  useEffect(() => {
    if (id) {
      fetchVenue();
      fetchVenueTypes();
    }
  }, [id]);

  // Fetch venue
  async function fetchVenue() {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setVenue(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setAddress(data.address || '');
      setVenueType(data.venue_type_id || '');

      // Cargar fotos existentes
      const { data: photosData, error: photosError } = await supabase
        .from('venue_photos')
        .select('*')
        .eq('venue_id', id)
        .order('order_index');

      if (!photosError && photosData) setExistingPhotos(photosData);
    } catch (err) {
      console.error('Error cargando venue:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch tipos de local
  async function fetchVenueTypes() {
    const { data, error } = await supabase.from('venue_types').select('*');
    if (!error && data) setVenueTypes(data);
  }

  // Actualizar venue
  async function handleUpdate() {
    if (!name || !address || !venueType) {
      alert('Por favor completa nombre, dirección y tipo de local.');
      return;
    }

    const updates = {
      name,
      description,
      address,
      venue_type_id: venueType,
    };

    const { error } = await supabase
      .from('venues')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error actualizando:', error);
      alert('Error al actualizar ❌');
      return;
    }

    // Subir fotos nuevas
    for (const file of photos) {
      const fileName = `${id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('venue-photos')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error subiendo foto:', uploadError);
      } else {
        await supabase.from('venue_photos').insert({
          venue_id: id,
          photo_url: fileName,
          is_primary: false,
        });
      }
    }

    alert('Actualizado correctamente 🔥');
    navigate(`/venue/${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>No encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editar Local</h1>
      <div className="space-y-4">

        {/* Nombre */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">Dirección</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
          />
        </div>

        {/* Tipo de Local */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">Tipo de Local</label>
          <select
            value={venueType}
            onChange={(e) => setVenueType(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
          >
            <option value="">Selecciona un tipo</option>
            {venueTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        {/* Fotos */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">Fotos</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setPhotos([...e.target.files])}
            className="w-full p-2 rounded-lg bg-[#111] border border-[#222]"
          />
          <div className="flex space-x-2 mt-2 overflow-x-auto">
            {existingPhotos.map((photo) => (
              <img
                key={photo.id}
                src={supabase.storage.from('venue-photos').getPublicUrl(photo.photo_url).data.publicUrl}
                alt="venue"
                className="w-20 h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          onClick={handleUpdate}
          className="w-full py-3 rounded-lg bg-[#ff0080] hover:bg-[#e60073] transition-colors font-semibold"
        >
          Guardar cambios
        </button>

      </div>
    </div>
  );
}