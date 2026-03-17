import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function EditVenue() {
  const { id } = useParams();
  console.log("ID:",id);
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if(id){
    fetchVenue();
    }
  }, [id]);

  async function fetchVenue() {
    console.log("fetching venue with id:",id)
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error cargando venue:', error);
      return;
    }

    setVenue(data);
    setName(data.name || '');
    setDescription(data.description || '');
    setLoading(false);
  }

  async function handleUpdate() {
    const { error } = await supabase
      .from('venues')
      .update({
        name,
        description,
      })
      .eq('id', id);

    if (error) {
      console.error('Error actualizando:', error);
      alert('Error al actualizar ❌');
      return;
    }

    alert('Actualizado correctamente 🔥');

    // Redirige al detalle
    navigate(`/venue/${id}`);
  }

  if (loading) {
    return (
      <div className="p-4 text-white">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="p-4 text-white">
        <p>No encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-6">
        Editar Local
      </h1>

      <div className="space-y-4">

        {/* Nombre */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block mb-1 text-sm text-gray-400">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080]"
          />
        </div>

        {/* Botón guardar */}
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