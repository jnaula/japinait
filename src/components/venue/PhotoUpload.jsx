import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    setError(null);

    console.log('PhotoUpload: Files selected:', files.length);

    if (photos.length + files.length > maxPhotos) {
      setError(`Puedes subir máximo ${maxPhotos} fotos`);
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('El tamaño máximo por imagen es 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const newPhotos = await Promise.all(
        validFiles.map(async (file) => {
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onloadend = () => {
              resolve({
                file,
                preview: reader.result,
                id: Math.random().toString(36).substr(2, 9),
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      console.log('PhotoUpload: Photos processed:', newPhotos.length);
      onPhotosChange([...photos, ...newPhotos]);
    } catch (err) {
      console.error('PhotoUpload: Error processing photos:', err);
      setError('Error al procesar las imágenes');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoId) => {
    console.log('PhotoUpload: Removing photo:', photoId);
    onPhotosChange(photos.filter((p) => p.id !== photoId));
  };

  const setPrimaryPhoto = (photoId) => {
    console.log('PhotoUpload: Setting primary photo:', photoId);
    const updatedPhotos = photos.map((p) => ({
      ...p,
      isPrimary: p.id === photoId,
    }));
    onPhotosChange(updatedPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
          <ImageIcon className="w-4 h-4 text-[#ff0080]" />
          <span>Fotos del Venue ({photos.length}/{maxPhotos})</span>
        </label>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group aspect-square rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]"
            >
              <img
                src={photo.preview}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setPrimaryPhoto(photo.id)}
                  className={`p-2 rounded-lg font-medium text-xs transition-colors ${
                    photo.isPrimary
                      ? 'bg-[#ff0080] text-white'
                      : 'bg-white/90 text-gray-900 hover:bg-white'
                  }`}
                >
                  {photo.isPrimary ? 'Principal' : 'Marcar'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {photo.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-[#ff0080] text-white text-xs font-medium rounded">
                  Principal
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {photos.length < maxPhotos && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-[#2a2a2a] hover:border-[#ff0080] transition-colors cursor-pointer flex flex-col items-center justify-center space-y-2 bg-[#0f0f0f]">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex flex-col items-center space-y-2"
            >
              <Upload className={`w-8 h-8 ${uploading ? 'text-gray-600' : 'text-[#ff0080]'}`} />
              <span className="text-sm text-gray-400 text-center px-2">
                {uploading ? 'Procesando...' : 'Subir Fotos'}
              </span>
            </motion.div>
          </label>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Sube hasta {maxPhotos} fotos. La primera será la foto principal. Máximo 5MB por foto.
      </p>
    </div>
  );
}
