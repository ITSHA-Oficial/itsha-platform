import { useState, useEffect } from 'react';
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
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const triggerRefetch = () => setRefetchTrigger(c => c + 1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/api/v1/products/${productId}`, { headers: { 'X-Tenant-Slug': TENANT_SLUG } })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setFeatures(data.features || []);
          setVariants(data.variants || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error(err);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [productId, refetchTrigger]);

  const handleCreateVariant = async () => {
    const attrIds = Object.values(selectedAttrs).filter(Boolean);
    if (attrIds.length !== features.length) {
      alert('Selecciona un atributo para cada característica.');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert('Ingresa un precio válido.');
      return;
    }

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
        triggerRefetch();
      } else {
        const err = await res.json();
        alert(err?.error?.message || 'Error al crear la variante.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('¿Eliminar esta variante?')) return;
    try {
      await fetch(`${API_URL}/api/v1/variants/${variantId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      triggerRefetch();
    } catch (err) {
      console.error(err);
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
      {/* Variantes existentes */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800">Variantes activas</h4>
          <div className="space-y-2">
            {variants.map(variant => (
              <div key={variant.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {variant.attributes.map(a => `${a.feature_name}: ${a.value}`).join(' | ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Precio: S/ {variant.price.toFixed(2)} | Mín: {variant.min_quantity} u.
                  </p>
                </div>
                <button onClick={() => handleDeleteVariant(variant.id)} className="text-red-500 text-sm hover:underline">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crear nueva variante */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
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
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="150.00" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cant. mínima</label>
              <input type="number" value={minQty} onChange={e => setMinQty(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="50" />
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