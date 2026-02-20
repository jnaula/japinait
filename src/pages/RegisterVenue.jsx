import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone, Mail, Share2, DollarSign, Music, Clock, Image } from 'lucide-react';
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
      console.log('RegisterVenue: Fetching venue types...');
      const { data, error } = await supabase
        .from('venue_types')
        .select('*')
        .order('name');

      if (error) throw error;
      console.log('RegisterVenue: Venue types fetched:', data);
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
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleAddressChange = (address) => {
    setFormData(prev => ({
      ...prev,
      address
    }));
  };

  const uploadPhotos = async (venueId) => {
    console.log('RegisterVenue: Uploading photos for venue:', venueId);
    const uploadedUrls = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileExt = photo.file.name.split('.').pop();
      const fileName = `${venueId}/${Date.now()}_${i}.${fileExt}`;

      console.log('RegisterVenue: Uploading photo:', fileName);
      const { data, error } = await supabase.storage
        .from('venue-photos')
        .upload(fileName, photo.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('RegisterVenue: Error uploading photo:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('venue-photos')
        .getPublicUrl(fileName);

      uploadedUrls.push({
        url: urlData.publicUrl,
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
      console.log('RegisterVenue: Submitting venue registration...');
      
      // Validate venue_type_id is a valid UUID or null (though required)
      const venueTypeId = formData.venue_type_id && formData.venue_type_id.length > 0 ? formData.venue_type_id : null;
      
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .insert([
          {
            ...formData,
            owner_id: user.id,
            venue_type_id: venueTypeId,
            status: 'approved',
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
          },
        ])
        .select()
        .single();

      if (venueError) throw venueError;

      console.log('RegisterVenue: Venue registered successfully:', venueData);

      if (photos.length > 0) {
        console.log('RegisterVenue: Uploading venue photos...');
        const uploadedPhotos = await uploadPhotos(venueData.id);

        const photoRecords = uploadedPhotos.map((photo) => ({
          venue_id: venueData.id,
          photo_url: photo.url,
          is_primary: photo.isPrimary,
          order_index: photo.orderIndex,
        }));

        const { error: photosError } = await supabase
          .from('venue_photos')
          .insert(photoRecords);

        if (photosError) {
          console.error('RegisterVenue: Error saving photo records:', photosError);
        } else {
          console.log('RegisterVenue: Photos saved successfully');
        }
      }

      alert('Local registrado exitosamente.');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('RegisterVenue: Error registering venue:', err);
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
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
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
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
                name="venue_type_id"
                value={formData.venue_type_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
              >
                <option value="">Selecciona un tipo</option>
                {venueTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
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
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] mb-4"
              placeholder="Av. Amazonas y Naciones Unidas, Quito"
            />
            <MapPicker 
              location={{ lat: formData.latitude, lng: formData.longitude }}
              onLocationChange={handleLocationChange}
              onAddressChange={handleAddressChange}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Phone className="w-4 h-4 text-[#ff0080]" />
                <span>Teléfono</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
                placeholder="+507 1234-5678"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 text-[#ff0080]" />
                <span>Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
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
              type="text"
              name="music_type"
              value={formData.music_type}
              onChange={handleChange}
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
              name="price_range"
              value={formData.price_range}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080]"
            >
              <option value="$">Económico ($)</option>
              <option value="$$">Medio ($$)</option>
              <option value="$$$">Alto ($$$)</option>
            </select>
          </div>

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
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff0080] focus:ring-1 focus:ring-[#ff0080] resize-none"
              placeholder="Describe tu local..."
            />
          </div>

          <OpeningHoursEditor 
            value={formData.opening_hours} 
            onChange={(val) => setFormData(prev => ({ ...prev, opening_hours: val }))} 
          />

          <PhotoUpload photos={photos} onPhotosChange={setPhotos} maxPhotos={5} />

          <div className="flex justify-end space-x-4">
            <a
              href="/"
              className="px-6 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg font-medium hover:bg-[#2a2a2a] transition-colors"
            >
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
