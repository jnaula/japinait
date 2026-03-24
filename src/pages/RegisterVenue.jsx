import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, Share2, DollarSign, Music, Tag, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PhotoUpload from '../components/venue/PhotoUpload';
import OpeningHoursEditor from '../components/venue/OpeningHoursEditor';
import MapPicker from '../components/MapPicker';

export default function RegisterVenue() {
  const { user } = useAuth();
  const [venueTypes, setVenueTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);

  // Promociones locales (se guardan en Supabase al hacer submit)
  const [promotions, setPromotions] = useState([]);
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoDescription, setNewPromoDescription] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: -0.1807,
    longitude: -78.4678,
    phone: '',
    email: '',
    website: '',
    venue_type_id: '',
    description: '',
    music_type: '',
    price_range: '$$',
    opening_hours: {
      monday: { open: '18:00', close: '02:00' },
      tuesday: { open: '18:00', close: '02:00' },
      wednesday: { open: '18:00', close: '02:00' },
      thursday: { open: '18:00', close: '02:00' },
      friday: { open: '18:00', close: '03:00' },
      saturday: { open: '18:00', close: '03:00' },
      sunday: { open: '18:00', close: '02:00' },
    },
  });

  useEffect(() => {
    fetchVenueTypes();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      const { data, error } = await supabase.from('venue_types').select('*').order('name');
      if (error) throw error;
      setVenueTypes(data || []);
    } catch (err) {
      console.error('RegisterVenue: Error fetching venue types:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleAddressChange = (address) => {
    setFormData(prev => ({ ...prev, address }));
  };

  // ✅ Agregar promo localmente (sin Supabase todavía)
  const handleAddPromo = () => {
    if (!newPromoTitle.trim()) return alert('El título es obligatorio');
    setPromotions(prev => [...prev, {
      tempId: Date.now(), // ID temporal para el key de React
      title: newPromoTitle.trim(),
      description: newPromoDescription.trim() || null,
    }]);
    setNewPromoTitle('');
    setNewPromoDescription('');
    setShowPromoForm(false);
  };

  const handleDeletePromo = (tempId) => {
    setPromotions(prev => prev.filter(p => p.tempId !== tempId));
  };

  const uploadPhotos = async (venueId) => {
    const uploadedUrls = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileExt = photo.file.name.split('.').pop();
      const fileName = `${venueId}/${Date.now()}_${i}.${fileExt}`;
      const { error } = await supabase.storage
        .from('venue-photos')
        .upload(fileName, photo.file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      uploadedUrls.push({
        url: fileName,
        isPrimary: photo.isPrimary || i === 0,
        orderIndex: i,
      });
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Debes iniciar sesión para registrar un local');
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      const venueTypeId = formData.venue_type_id?.length > 0 ? formData.venue_type_id : null;

      // 1. Crear el venue
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .insert([{
          ...formData,
          opening_hours: JSON.stringify(formData.opening_hours),
          owner_id: user.id,
          venue_type_id: venueTypeId,
          status: 'approved',
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }])
        .select()
        .single();

      if (venueError) {
        alert('ERROR INSERT VENUE: ' + JSON.stringify(venueError));
        return;
      }

      // 2. Subir fotos
      if (photos.length > 0) {
        const uploadedPhotos = await uploadPhotos(venueData.id);
        const photoRecords = uploadedPhotos.map((photo) => ({
          venue_id: venueData.id,
          photo_url: photo.url,
          is_primary: photo.isPrimary,
          order_index: photo.orderIndex,
        }));
        const { error: photosError } = await supabase.from('venue_photos').insert(photoRecords);
        if (photosError) {
          alert('ERROR INSERT PHOTOS: ' + JSON.stringify(photosError));
          return;
        }
      }

      // ✅ 3. Insertar promociones con el venue_id recién creado
      if (promotions.length > 0) {
        const promoRecords = promotions.map(({ title, description }) => ({
          venue_id: venueData.id,
          title,
          description,
        }));
        const { error: promoError } = await supabase.from('promotions').insert(promoRecords);
        if (promoError) {
          alert('ERROR INSERT PROMOTIONS: ' + JSON.stringify(promoError));
          return;
        }
      }

      alert('Local registrado exitosamente.');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('RegisterVenue: Error:', err);
      alert('Error al registrar el local: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso Restringido</h2>
          <p className="text-gray-400 mb-6">Debes iniciar sesión para registrar un local</p>
          <a href="/login" className="px-6 py-3 bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white rounded-lg font-medium">
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Registrar Local</h1>
          <p className="text-gray-400">Completa el formulario para registrar tu local</p>
        </motion.div>

        <motion.form
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  onSubmit={handleSubmit}
  className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6 space-y-6"
>

  {/* NOMBRE + TIPO */}
  <div className="grid md:grid-cols-2 gap-6">
    <div>
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
        <Building2 className="w-4 h-4 text-[#ff0080]" />
        <span>Nombre del Local *</span>
      </label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
      />
    </div>

    <div>
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
        <Building2 className="w-4 h-4 text-[#ff0080]" />
        <span>Tipo de Local *</span>
      </label>
      <select
        name="venue_type_id"
        value={formData.venue_type_id}
        onChange={handleChange}
        required
        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
      >
        <option value="">Selecciona un tipo</option>
        {venueTypes.map((type) => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </select>
    </div>
  </div>

  {/* DIRECCIÓN + MAPA */}
  <div>
    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
      <MapPin className="w-4 h-4 text-[#ff0080]" />
      <span>Dirección *</span>
    </label>

    <input
      type="text"
      name="address"
      value={formData.address}
      onChange={handleChange}
      required
      className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white mb-4"
    />

    <MapPicker
      location={{ lat: formData.latitude, lng: formData.longitude }}
      onLocationChange={handleLocationChange}
      onAddressChange={handleAddressChange}
    />
  </div>

  {/* DESCRIPCIÓN */}
  <div>
    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
      <Building2 className="w-4 h-4 text-[#ff0080]" />
      <span>Descripción</span>
    </label>
    <textarea
      name="description"
      value={formData.description}
      onChange={handleChange}
      rows={4}
      className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white resize-none"
      placeholder="Describe tu local..."
    />
  </div>

  {/* PROMOCIONES */}
  <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
    <div className="flex items-center justify-between p-4 bg-[#1a1a1a]">
      <span className="text-sm text-gray-300">Promociones</span>
      <button type="button" onClick={() => setShowPromoForm(!showPromoForm)}>
        + Agregar
      </button>
    </div>

    {showPromoForm && (
      <div className="p-4 space-y-3">
        <input
          type="text"
          value={newPromoTitle}
          onChange={(e) => setNewPromoTitle(e.target.value)}
          placeholder="Título"
          className="w-full px-4 py-2 bg-[#1a1a1a] rounded text-white"
        />

        <textarea
          value={newPromoDescription}
          onChange={(e) => setNewPromoDescription(e.target.value)}
          placeholder="Descripción"
          className="w-full px-4 py-2 bg-[#1a1a1a] rounded text-white"
        />

        <button type="button" onClick={handleAddPromo}>
          Guardar promo
        </button>
      </div>
    )}

    {promotions.map((promo) => (
      <div key={promo.tempId} className="p-4 border-t border-[#2a2a2a]">
        <p className="text-white">{promo.title}</p>
        <button onClick={() => handleDeletePromo(promo.tempId)}>
          Eliminar
        </button>
      </div>
    ))}
  </div>

  {/* CONTACTO */}
  <div className="grid md:grid-cols-3 gap-6">
    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" className="input" />
    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input" />
    <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="Redes" className="input" />
  </div>

  {/* MÚSICA */}
  <input
    type="text"
    name="music_type"
    value={formData.music_type}
    onChange={handleChange}
    placeholder="Tipo de música"
    className="input"
  />

  {/* PRECIO */}
  <select name="price_range" value={formData.price_range} onChange={handleChange} className="input">
    <option value="$">$</option>
    <option value="$$">$$</option>
    <option value="$$$">$$$</option>
  </select>

  {/* HORARIOS */}
  <OpeningHoursEditor
    value={formData.opening_hours}
    onChange={(val) => setFormData(prev => ({ ...prev, opening_hours: val }))}
  />

  {/* FOTOS */}
  <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={5} />

  {/* BOTONES */}
  <div className="flex justify-end space-x-4">
    <button type="submit" disabled={loading}>
      {loading ? 'Guardando...' : 'Registrar'}
    </button>
  </div>

</motion.form>
      </div>
    </div>
  );
}