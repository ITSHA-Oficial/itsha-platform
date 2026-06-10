import { useState, useEffect, useRef } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

interface Attribute {
  id: string;
  value: string;
  sort_order: number;
}

interface Feature {
  id: string;
  name: string;
  sort_order: number;
  attributes: Attribute[];
}

interface Variant {
  id: string;
  sku_variant: string | null;
  variant_signature: string;
  price: number;
  min_quantity: number;
  is_active: boolean;
  is_main: boolean;
  attributes: { feature_name: string; value: string }[];
}

interface VariantEditorProps {
  productId: string;
}

export default function VariantEditor({ productId }: VariantEditorProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [price, setPrice] = useState('');
  const [minQty, setMinQty] = useState('1');
  const processingRef = useRef(false);

  const fetchData = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${productId}`, {
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      const data = await res.json();
      setFeatures(data.features || []);
      setVariants(data.variants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  useEffect(() => { fetchData(); }, [productId]);

  const handleCreateVariant = async () => {
    const attrIds = Object.values(selectedAttrs).filter(Boolean);
    if (attrIds.length !== features.length || processingRef.current) return;
    if (!price || parseFloat(price) <= 0) return alert('Ingresa un precio válido.');
    processingRef.current = true;
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({
          attribute_ids: attrIds,
          price: parseFloat(price),
          min_quantity: parseInt(minQty) || 1
        })
      });
      if (res.ok) {
        setCreating(false);
        setSelectedAttrs({});
        setPrice('');
        setMinQty('1');
        processingRef.current = false; // Liberar antes de recargar
        await fetchData();
      } else {
        const err = await res.json();
        alert(err?.error?.message || 'Error al crear la variante.');
        processingRef.current = false;
      }
    } catch (err) {
      console.error(err);
      processingRef.current = false;
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('¿Eliminar esta variante?') || processingRef.current) return;
    processingRef.current = true;
    try {
      await fetch(`${API_URL}/api/v1/variants/${variantId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      processingRef.current = false; // Liberar antes de recargar
      await fetchData();
    } catch (err) {
      console.error(err);
      processingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {variants.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800">Variantes activas</h4>
          <div className="space-y-2">
            {variants.map(variant => (
              <div key={variant.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {variant.is_main && '⭐ '}{variant.attributes.map(a => `${a.feature_name}: ${a.value}`).join(' | ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Precio: S/ {variant.price.toFixed(2)} | Mín: {variant.min_quantity} u.
                  </p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => handleDeleteVariant(variant.id)} className="text-red-500 text-sm hover:underline">
                    Eliminar
                  </button>
                  <button
                    onClick={async () => {
                      if (processingRef.current) return;
                      processingRef.current = true;
                      try {
                        await fetch(`${API_URL}/api/v1/variants/${variant.id}/main`, {
                          method: 'PUT',
                          headers: { 'X-Tenant-Slug': TENANT_SLUG }
                        });
                        processingRef.current = false;
                        await fetchData();
                      } catch (err) {
                        console.error(err);
                        processingRef.current = false;
                      }
                    }}
                    className="text-yellow-500 text-sm hover:underline ml-2"
                    title="Establecer como variante principal"
                  >
                    ⭐ Principal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!creating ? (
        <button onClick={() => setCreating(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Crear variante
        </button>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-gray-800">Nueva variante</h4>
          {features.map(feature => (
            <div key={feature.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{feature.name}</label>
              <select
                value={selectedAttrs[feature.id] || ''}
                onChange={e => setSelectedAttrs(prev => ({ ...prev, [feature.id]: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona...</option>
                {feature.attributes.map(attr => (
                  <option key={attr.id} value={attr.id}>{attr.value}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cant. mínima</label>
              <input type="number" value={minQty} onChange={e => setMinQty(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateVariant} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              Guardar variante
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}