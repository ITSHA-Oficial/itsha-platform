import { useState, useEffect } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';
import LogoUploader from '../components/LogoUploader';

export default function Settings() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1a56db');
  const [logoUrl, setLogoUrl] = useState('');
  const [showCartTotal, setShowCartTotal] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/settings`, { headers: { 'X-Tenant-Slug': TENANT_SLUG } })
      .then(res => res.json())
      .then(data => {
        setName(data.name || '');
        setWhatsapp(data.whatsapp || '');
        setPrimaryColor(data.primary_color || '#1a56db');
        setShowCartTotal(data.show_cart_total !== false);
        setShowPrices(data.show_prices !== false);
        setFacebookUrl(data.facebook_url || '');
        setInstagramUrl(data.instagram_url || '');
        setTiktokUrl(data.tiktok_url || '');
        setAddress(data.address || '');
        setLogoUrl(data.logo_url || '');
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
        body: JSON.stringify({
          name,
          whatsapp,
          primary_color: primaryColor,
          show_cart_total: showCartTotal,
          show_prices: showPrices,
          facebook_url: facebookUrl,
          instagram_url: instagramUrl,
          tiktok_url: tiktokUrl,
          address,
          logo_url: logoUrl || null
        })
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
          <LogoUploader
            currentUrl={logoUrl}
            onUploaded={(url) => setLogoUrl(url)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
          <input
            type="text"
            value={facebookUrl}
            onChange={e => setFacebookUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://facebook.com/tunegocio"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
          <input
            type="text"
            value={instagramUrl}
            onChange={e => setInstagramUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://instagram.com/tunegocio"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
          <input
            type="text"
            value={tiktokUrl}
            onChange={e => setTiktokUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://tiktok.com/@tunegocio"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Av. Principal 123, Lima"
          />
        </div>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setShowCartTotal(!showCartTotal)}
            className={`relative w-11 h-6 rounded-full transition-colors ${showCartTotal ? 'bg-blue-600' : 'bg-gray-200'}`}
            aria-label="Mostrar total en el carrito"
          >
            <span className={`absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-transform ${showCartTotal ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">Mostrar total en el carrito</p>
            <p className="text-sm text-gray-500">Muestra "S/ X.XX" en el panel del carrito.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setShowPrices(!showPrices)}
            className={`relative w-11 h-6 rounded-full transition-colors ${showPrices ? 'bg-blue-600' : 'bg-gray-200'}`}
            aria-label="Mostrar precios en el catálogo"
          >
            <span className={`absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-transform ${showPrices ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">Mostrar precios en el catálogo</p>
            <p className="text-sm text-gray-500">Muestra los precios en las tarjetas de productos y en el detalle.</p>
          </div>
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