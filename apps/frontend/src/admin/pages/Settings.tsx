import { useState, useEffect } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

export default function Settings() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1a56db');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/settings`, { headers: { 'X-Tenant-Slug': TENANT_SLUG } })
      .then(res => res.json())
      .then(data => {
        setName(data.name || '');
        setWhatsapp(data.whatsapp || '');
        setPrimaryColor(data.primary_color || '#1a56db');
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({ name, whatsapp, primary_color: primaryColor })
      });
      if (res.ok) {
        setMessage('Configuración guardada correctamente.');
      } else {
        setMessage('Error al guardar la configuración.');
      }
    } catch (err) {
      setMessage('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            type="text"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}