import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, X, Crown, Tag, Pencil } from 'lucide-react';
import MapPicker from '../components/MapPicker';

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
  const [primaryPhoto, setPrimaryPhoto] = useState(null);

  // Promociones
  const [promotions, setPromotions] = useState([]);
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoDescription, setNewPromoDescription] = useState('');
  const [addingPromo, setAddingPromo] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Edición de promociones
  const [editingPromo, setEditingPromo] = useState(null);
  const [editPromoTitle, setEditPromoTitle] = useState('');
  const [editPromoDescription, setEditPromoDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVenue();
    fetchVenueTypes();
    fetchPromotions();
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
      if (data.latitude && data.longitude) {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
      }

      const { data: photosData } = await supabase
        .from('venue_photos')
        .select('*')
        .eq('venue_id', id)
        .order('order_index');
      setExistingPhotos(photosData || []);

      const currentPrimary = photosData?.find((p) => p.is_primary);
      if (currentPrimary) setPrimaryPhoto(`existing-${currentPrimary.id}`);
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

  async function fetchPromotions() {
    const { data } = await supabase
      .from('promotions')
      .select('*')
      .eq('venue_id', id)
      .order('created_at', { ascending: false });
    setPromotions(data || []);
  }

  const handleAddPromo = async () => {
    if (!newPromoTitle.trim()) return alert('El título es obligatorio');
    setAddingPromo(true);
    const { error } = await supabase.from('promotions').insert({
      venue_id: id,
      title: newPromoTitle.trim(),
      description: newPromoDescription.trim() || null,
    });
    if (error) {
      alert('Error al agregar promoción');
    } else {
      setNewPromoTitle('');
      setNewPromoDescription('');
      setShowPromoForm(false);
      fetchPromotions();
    }
    setAddingPromo(false);
  };

  const handleDeletePromo = async (promoId) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', promoId);
    if (!error) setPromotions(promotions.filter((p) => p.id !== promoId));
  };

  const handleEditPromo = (promo) => {
    setEditingPromo(promo.id);
    setEditPromoTitle(promo.title);
    setEditPromoDescription(promo.description || '');
  };

  const handleSaveEditPromo = async (promoId) => {
    if (!editPromoTitle.trim()) return alert('El título es obligatorio');
    const { error } = await supabase
      .from('promotions')
      .update({
        title: editPromoTitle.trim(),
        description: editPromoDescription.trim() || null,
      })
      .eq('id', promoId);
    if (error) return alert('Error al actualizar promoción');
    setEditingPromo(null);
    fetchPromotions();
  };

  const handlePhotoChange = (e) => {
    const newFiles = [...e.target.files];
    if (newFiles.length === 0) return;
    setPhotos((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveNewPhoto = (index) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    if (primaryPhoto === `new-${index}`) setPrimaryPhoto(null);
  };

  const handleUpdate = async () => {
  if (!name || !address || !venueType)
    return alert('Completa nombre, dirección y tipo de local');

  setSaving(true); // ✅
  try {
    const { error } = await supabase
      .from('venues')
      .update({ name, description, address, venue_type_id: venueType, latitude, longitude })
      .eq('id', id);
    if (error) throw error;

    for (const photo of existingPhotos) {
      const isPrimary = primaryPhoto === `existing-${photo.id}`;
      await supabase.from('venue_photos').update({ is_primary: isPrimary }).eq('id', photo.id);
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const fileName = `${id}/${Date.now()}_${file.name}`;
      const isPrimary = primaryPhoto === `new-${i}`;
      const { error: uploadError } = await supabase.storage.from('venue-photos').upload(fileName, file);
      if (!uploadError) {
        await supabase.from('venue_photos').insert({ venue_id: id, photo_url: fileName, is_primary: isPrimary });
      }
    }

    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    alert('Local actualizado 🔥');
    navigate(`/venue/${id}`);
  } catch (err) {
    // ✅ Manejo de sesión expirada
    if (err?.message?.includes('JWT') || err?.message?.includes('session')) {
      alert('Tu sesión expiró. Por favor inicia sesión de nuevo.');
      navigate('/login');
    } else {
      alert('Error al actualizar: ' + err.message);
    }
  } finally {
    setSaving(false); // ✅
  }
};

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('¿Eliminar foto?')) return;
    const { error } = await supabase.from('venue_photos').delete().eq('id', photoId);
    if (!error) {
      setExistingPhotos(existingPhotos.filter((p) => p.id !== photoId));
      if (primaryPhoto === `existing-${photoId}`) setPrimaryPhoto(null);
    }
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
        <MapPicker
          location={{ lat: latitude, lng: longitude }}
          onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
          onAddressChange={(addr) => setAddress(addr)}
        />
      )}

      {/* SECCIÓN PROMOCIONES */}
      <div className="border border-[#222] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-[#111]">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-[#ff0080]" />
            <span className="font-semibold">Promociones</span>
            {promotions.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#ff0080] text-white text-xs font-bold">
                {promotions.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowPromoForm(!showPromoForm)}
            className="flex items-center space-x-1 text-sm text-[#ff0080] hover:text-[#ff40a0] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Formulario nueva promo */}
        {showPromoForm && (
          <div className="p-4 border-t border-[#222] bg-[#0a0a0a] space-y-3">
            <input
              type="text"
              value={newPromoTitle}
              onChange={(e) => setNewPromoTitle(e.target.value)}
              placeholder="Título de la promoción *"
              className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080] text-sm"
            />
            <textarea
              value={newPromoDescription}
              onChange={(e) => setNewPromoDescription(e.target.value)}
              rows={2}
              placeholder="Descripción (opcional)"
              className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080] text-sm resize-none"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddPromo}
                disabled={addingPromo}
                className="flex-1 py-2 rounded-lg bg-[#ff0080] hover:bg-[#e60073] transition-colors text-sm font-semibold disabled:opacity-50"
              >
                {addingPromo ? 'Guardando...' : 'Guardar promoción'}
              </button>
              <button
                onClick={() => { setShowPromoForm(false); setNewPromoTitle(''); setNewPromoDescription(''); }}
                className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de promos */}
        {promotions.length > 0 && (
          <div className="divide-y divide-[#222]">
            {promotions.map((promo) => (
              <div key={promo.id} className="p-4 bg-[#0a0a0a]">
                {editingPromo === promo.id ? (
                  // Modo edición
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editPromoTitle}
                      onChange={(e) => setEditPromoTitle(e.target.value)}
                      placeholder="Título *"
                      className="w-full p-3 rounded-lg bg-[#111] border border-[#ff0080] focus:outline-none text-sm text-white"
                    />
                    <textarea
                      value={editPromoDescription}
                      onChange={(e) => setEditPromoDescription(e.target.value)}
                      rows={2}
                      placeholder="Descripción (opcional)"
                      className="w-full p-3 rounded-lg bg-[#111] border border-[#222] focus:outline-none focus:border-[#ff0080] text-sm text-white resize-none"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveEditPromo(promo.id)}
                        className="flex-1 py-2 rounded-lg bg-[#ff0080] hover:bg-[#e60073] transition-colors text-sm font-semibold"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingPromo(null)}
                        className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] transition-colors text-sm text-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo vista
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Tag className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{promo.title}</p>
                        {promo.description && (
                          <p className="text-gray-400 text-xs mt-0.5 whitespace-pre-line">{promo.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditPromo(promo)}
                        className="p-1.5 rounded-full hover:bg-[#ff0080]/20 text-gray-500 hover:text-[#ff0080] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        className="p-1.5 rounded-full hover:bg-red-600/20 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {promotions.length === 0 && !showPromoForm && (
          <p className="text-sm text-gray-500 p-4 text-center bg-[#0a0a0a]">
            Sin promociones activas. Toca "Agregar" para crear una.
          </p>
        )}
      </div>

      {/* FOTOS */}
      <div>
        <label className="block mb-2 font-semibold">Fotos existentes</label>
        <div className="flex flex-wrap gap-2">
          {existingPhotos.length === 0 && (
            <p className="text-sm text-gray-500">Sin fotos guardadas</p>
          )}
          {existingPhotos.map((photo) => {
            const url = supabase.storage.from('venue-photos').getPublicUrl(photo.photo_url).data.publicUrl;
            const isPrimary = primaryPhoto === `existing-${photo.id}`;
            return (
              <div key={photo.id} className="relative w-24 h-24">
                <img
                  src={url}
                  className={`w-24 h-24 object-cover rounded-lg transition-all ${isPrimary ? 'ring-2 ring-yellow-400' : ''}`}
                  alt="foto existente"
                />
                {isPrimary && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-yellow-400/90 text-black font-bold rounded-b-lg py-0.5">
                    Principal
                  </span>
                )}
                <button
                  onClick={() => setPrimaryPhoto(`existing-${photo.id}`)}
                  className={`absolute top-1 left-1 p-1 rounded-full transition-colors ${isPrimary ? 'bg-yellow-400 text-black' : 'bg-black/70 text-white hover:bg-yellow-400 hover:text-black'}`}
                >
                  <Crown className="w-3 h-3" />
                </button>
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

        <label className="block mt-4 mb-2 font-semibold">Añadir fotos</label>
        <div className="flex flex-wrap gap-2">
          {photoPreviews.map((previewUrl, index) => {
            const isPrimary = primaryPhoto === `new-${index}`;
            return (
              <div key={index} className="relative w-24 h-24">
                <img
                  src={previewUrl}
                  className={`w-24 h-24 object-cover rounded-lg opacity-90 transition-all ${isPrimary ? 'ring-2 ring-yellow-400' : 'border border-[#ff0080]'}`}
                  alt={`nueva foto ${index + 1}`}
                />
                <span className={`absolute bottom-0 left-0 right-0 text-center text-[10px] rounded-b-lg py-0.5 font-bold ${isPrimary ? 'bg-yellow-400/90 text-black' : 'bg-[#ff0080]/80 text-white'}`}>
                  {isPrimary ? 'Principal' : 'Nueva'}
                </span>
                <button
                  onClick={() => setPrimaryPhoto(`new-${index}`)}
                  className={`absolute top-1 left-1 p-1 rounded-full transition-colors ${isPrimary ? 'bg-yellow-400 text-black' : 'bg-black/70 text-white hover:bg-yellow-400 hover:text-black'}`}
                >
                  <Crown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleRemoveNewPhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-black/70 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            );
          })}

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

        {!primaryPhoto && (existingPhotos.length > 0 || photos.length > 0) && (
          <p className="text-xs text-yellow-500 mt-2">
            👑 Ninguna foto marcada como principal. Toca la corona para elegir una.
          </p>
        )}
      </div>

      <button
  onClick={handleUpdate}
  disabled={saving}
  className="w-full py-3 mt-4 rounded-lg bg-[#ff0080] hover:bg-[#e60073] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
>
  {saving ? (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <span>Guardando...</span>
    </div>
  ) : (
    'Guardar cambios'
  )}
</button>
    </div>
  );
}

