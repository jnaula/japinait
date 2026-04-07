import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, Share2, DollarSign, Music, Tag, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from '../components/venue/PhotoUpload';
import OpeningHoursEditor from '../components/venue/OpeningHoursEditor';
import MapPicker from '../components/MapPicker';

export default function RegisterVenue() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      navigate('/login');
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
      navigate('/dashboard');
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
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Building2 className="w-4 h-4 text-[#ff0080]" />
                <span>Nombre del Local *</span>
              </label>
              <input
                type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
                placeholder="Ej: Discoteca La Rumba"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Building2 className="w-4 h-4 text-[#ff0080]" />
                <span>Tipo de Local *</span>
              </label>
              <select
                name="venue_type_id" value={formData.venue_type_id} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
              >
                <option value="">Selecciona un tipo</option>
                {venueTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
              <MapPin className="w-4 h-4 text-[#ff0080]" />
              <span>Dirección *</span>
            </label>
            <input
              type="text" name="address" value={formData.address} onChange={handleChange} required
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] mb-4"
              placeholder="Av. Amazonas y Naciones Unidas, Quito"
            />
            <MapPicker
              location={{ lat: formData.latitude, lng: formData.longitude }}
              onLocationChange={handleLocationChange}
              onAddressChange={handleAddressChange}
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
              <Building2 className="w-4 h-4 text-[#ff0080]" />
              <span>Descripción</span>
            </label>
            <textarea
              name="description" value={formData.description} onChange={handleChange} rows={4}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] resize-none"
              placeholder="Describe tu local..."
            />
          </div>
           
          {/* ✅ SECCIÓN PROMOCIONES */}
          <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a]">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-[#ff0080]" />
                <span className="text-sm font-medium text-gray-300">Promociones</span>
                {promotions.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#ff0080] text-white text-xs font-bold">
                    {promotions.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPromoForm(!showPromoForm)}
                className="flex items-center space-x-1 text-sm text-[#ff0080] hover:text-[#ff40a0] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Formulario nueva promo */}
            {showPromoForm && (
              <div className="p-4 border-t border-[#2a2a2a] bg-[#0f0f0f] space-y-3">
                <input
                  type="text"
                  value={newPromoTitle}
                  onChange={(e) => setNewPromoTitle(e.target.value)}
                  placeholder="Título de la promoción *"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] text-sm"
                />
                <textarea
                  value={newPromoDescription}
                  onChange={(e) => setNewPromoDescription(e.target.value)}
                  rows={2}
                  placeholder="Descripción (opcional)"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] text-sm resize-none"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAddPromo}
                    className="flex-1 py-2 rounded-lg bg-[#ff0080] hover:bg-[#e60073] transition-colors text-sm font-semibold"
                  >
                    Agregar promoción
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPromoForm(false); setNewPromoTitle(''); setNewPromoDescription(''); }}
                    className="px-4 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors text-sm text-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            

            {/* Lista de promos agregadas */}
            {promotions.length > 0 && (
              <div className="divide-y divide-[#2a2a2a]">
                {promotions.map((promo) => (
                  <div key={promo.tempId} className="flex items-start justify-between p-4 bg-[#0f0f0f]">
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#ff0080] to-[#7928ca] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Tag className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{promo.title}</p>
                        {promo.description && (
                          <p className="text-gray-400 text-xs mt-0.5">{promo.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePromo(promo.tempId)}
                      className="p-1.5 rounded-full hover:bg-red-600/20 text-gray-500 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {promotions.length === 0 && !showPromoForm && (
              <p className="text-sm text-gray-500 p-4 text-center bg-[#0f0f0f]">
                Sin promociones. Toca "Agregar" para añadir una.
              </p>
            )}
          </div>


          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Phone className="w-4 h-4 text-[#ff0080]" />
                <span>Teléfono</span>
              </label>
              <input
                type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
                placeholder="+593 99 123 4567"
              />
            </div>

            

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 text-[#ff0080]" />
                <span>Email</span>
              </label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
                placeholder="contacto@local.com"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Share2 className="w-4 h-4 text-[#ff0080]" />
                <span>Redes Sociales</span>
              </label>
              <input
                type="url" name="website" value={formData.website} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
                placeholder="https://instagram.com/tulocal"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
              <Music className="w-4 h-4 text-[#ff0080]" />
              <span>Tipo de Música</span>
            </label>
            <input
              type="text" name="music_type" value={formData.music_type} onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
              placeholder="Ej: Electrónica, Reggaeton, Rock"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 text-[#ff0080]" />
              <span>Rango de Precio</span>
            </label>
            <select
              name="price_range" value={formData.price_range} onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
            >
              <option value="$">Económico ($)</option>
              <option value="$$">Medio ($$)</option>
              <option value="$$$">Alto ($$$)</option>
            </select>
          </div>

          

          <OpeningHoursEditor
            value={formData.opening_hours}
            onChange={(val) => setFormData(prev => ({ ...prev, opening_hours: val }))}
          />

          
          <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={5} />

          <div className="flex justify-end space-x-4">
            <a href="/" className="px-6 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors">
              Cancelar
            </a>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrar Local'}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}