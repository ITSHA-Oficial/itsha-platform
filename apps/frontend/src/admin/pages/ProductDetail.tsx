import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';
import FeatureEditor from '../components/FeatureEditor';
import VariantEditor from '../components/VariantEditor';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'features' | 'variants'>('info');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [pricingMode, setPricingMode] = useState('explicit_variant');
  const [displayPriceMode, setDisplayPriceMode] = useState('hidden');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/products/${id}`, { headers: { 'X-Tenant-Slug': TENANT_SLUG } })
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setName(data.name || '');
        setDescription(data.description || '');
        setSku(data.sku || '');
        setPricingMode(data.pricing_mode || 'explicit_variant');
        setDisplayPriceMode(data.display_price_mode || 'hidden');
        setIsActive(data.is_active);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({ name, description, pricing_mode: pricingMode, display_price_mode: displayPriceMode, is_active: isActive })
      });
      if (res.ok) {
        setMessage('Producto actualizado correctamente.');
      } else {
        setMessage('Error al actualizar el producto.');
      }
    } catch (err) {
      setMessage('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Información general' },
    { id: 'features', label: 'Características' },
    { id: 'variants', label: 'Variantes' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return <p className="text-gray-500">Producto no encontrado.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/products')} className="text-gray-500 hover:text-gray-700">← Volver</button>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <span className="text-sm text-gray-400">SKU: {product.sku}</span>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input type="text" value={sku} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-blue-600" />
              <label className="text-sm text-gray-700">Producto activo</label>
            </div>
            {message && (
              <div className={`px-4 py-2 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
              </div>
            )}
            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-4">Características y atributos</h3>
          <FeatureEditor productId={id!} />
        </div>
      )}

      {activeTab === 'variants' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-4">Variantes</h3>
          {pricingMode === 'dynamic_formula' ? (
            <p className="text-sm text-gray-400">Este producto usa fórmula dinámica. Las variantes no están disponibles.</p>
          ) : !product?.features || product.features.length === 0 ? (
            <p className="text-sm text-gray-400">Primero agrega características en la pestaña "Características".</p>
          ) : (
            <VariantEditor productId={id!} />
          )}
        </div>
      )}
    </div>
  );
}