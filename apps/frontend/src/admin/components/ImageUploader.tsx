import { useState, useEffect } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

interface Image {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

interface ImageUploaderProps {
  productId: string;
}

export default function ImageUploader({ productId }: ImageUploaderProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${productId}`, {
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, [productId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', file.name);

      await fetch(`${API_URL}/api/v1/products/${productId}/images`, {
        method: 'POST',
        headers: { 'X-Tenant-Slug': TENANT_SLUG },
        body: formData
      });

      fetchImages();
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await fetch(`${API_URL}/api/v1/images/${imageId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      fetchImages();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800">Imágenes ({images.length}/10)</h4>
        <label className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">
          {uploading ? 'Subiendo...' : 'Subir imagen'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-gray-400">Este producto no tiene imágenes.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map(img => (
            <div key={img.id} className="relative bg-gray-100 rounded-lg overflow-hidden group">
              <img src={img.url} alt={img.alt_text || ''} className="w-full h-32 object-cover" />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}