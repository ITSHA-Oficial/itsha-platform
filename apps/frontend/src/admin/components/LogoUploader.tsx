import { useState, useRef, useEffect } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

interface LogoUploaderProps {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

export default function LogoUploader({ currentUrl, onUploaded }: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sincronizar vista previa cuando cambia la URL actual
  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mostrar vista previa local
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Subir al backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/v1/settings/logo`, {
        method: 'POST',
        headers: { 'X-Tenant-Slug': TENANT_SLUG },
        body: formData
      });
      if (!res.ok) throw new Error('Error al subir');
      const data = await res.json();
      onUploaded(data.logo_url);
    } catch (err) {
      alert('Error al subir el logo.');
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
          {preview ? (
            <img src={preview} alt="Logo preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin logo</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : 'Cambiar logo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}