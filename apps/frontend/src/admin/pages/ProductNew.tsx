import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

export default function ProductNew() {
  const navigate = useNavigate();
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pricingMode, setPricingMode] = useState('explicit_variant');
  const [displayPriceMode, setDisplayPriceMode] = useState('hidden');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/v1/categories`, { headers: { 'X-Tenant-Slug': TENANT_SLUG } })
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({ sku, name, description, pricing_mode: pricingMode, display_price_mode: displayPriceMode, category_id: categoryId || null })
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/admin/products/${data.id}`);
      } else {
        const err = await res.json();
        setMessage(err?.error?.message || 'Error al crear el producto.');
      }
    } catch (err) {
      setMessage('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/products')} className="text-gray-500 hover:text-gray-700">← Volver</button>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo producto</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input type="text" value={sku} onChange={e => setSku(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Modo de pricing</label>
              <select value={pricingMode} onChange={e => setPricingMode(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="explicit_variant">Variantes explícitas</option>
                <option value="dynamic_formula">Fórmula dinámica</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Modo de precio</label>
              <select value={displayPriceMode} onChange={e => setDisplayPriceMode(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="hidden">Oculto</option>
                <option value="from_price">Desde</option>
                <option value="exact">Exacto</option>
                <option value="contact_only">Consultar</option>
              </select>
            </div>
          </div>
          {message && (
            <div className={`px-4 py-2 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}
          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Creando...' : 'Crear producto'}
          </button>
        </form>
      </div>
    </div>
  );
}