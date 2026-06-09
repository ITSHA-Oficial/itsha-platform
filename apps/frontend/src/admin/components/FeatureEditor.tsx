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

interface FeatureEditorProps {
  productId: string;
}

export default function FeatureEditor({ productId }: FeatureEditorProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newAttrValue, setNewAttrValue] = useState<Record<string, string>>({});
  const processingRef = useRef(false);

  const fetchFeatures = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${productId}`, {
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      const data = await res.json();
      setFeatures(data.features || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  useEffect(() => { fetchFeatures(); }, [productId]);

  const addFeature = async () => {
    if (!newFeatureName.trim() || processingRef.current) return;
    processingRef.current = true;
    try {
      await fetch(`${API_URL}/api/v1/products/${productId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({ name: newFeatureName.trim(), sort_order: features.length + 1 })
      });
      setNewFeatureName('');
      await fetchFeatures();
    } catch (err) {
      console.error(err);
    } finally {
      processingRef.current = false;
    }
  };

  const addAttribute = async (featureId: string) => {
    const value = newAttrValue[featureId]?.trim();
    if (!value || processingRef.current) return;
    processingRef.current = true;
    try {
      await fetch(`${API_URL}/api/v1/features/${featureId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({ value, sort_order: 1 })
      });
      setNewAttrValue(prev => ({ ...prev, [featureId]: '' }));
      await fetchFeatures();
    } catch (err) {
      console.error(err);
    } finally {
      processingRef.current = false;
    }
  };

  const deleteFeature = async (featureId: string) => {
    if (!confirm('¿Eliminar esta característica y todos sus atributos?') || processingRef.current) return;
    processingRef.current = true;
    try {
      await fetch(`${API_URL}/api/v1/features/${featureId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      // Desbloquear manualmente antes de recargar
      processingRef.current = false;
      await fetchFeatures();
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
      <div className="flex gap-2">
        <input
          type="text"
          value={newFeatureName}
          onChange={e => setNewFeatureName(e.target.value)}
          placeholder="Nueva característica (ej: Material)"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={e => { if (e.key === 'Enter') addFeature(); }}
        />
        <button onClick={addFeature} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Agregar
        </button>
      </div>

      {features.length === 0 ? (
        <p className="text-sm text-gray-400">Este producto no tiene características. Agrega una para empezar.</p>
      ) : (
        features.map(feature => (
          <div key={feature.id} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{feature.name}</h4>
              <button onClick={() => deleteFeature(feature.id)} className="text-red-500 text-sm hover:underline">
                Eliminar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {feature.attributes.map(attr => (
                <span key={attr.id} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600">
                  {attr.value}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newAttrValue[feature.id] || ''}
                onChange={e => setNewAttrValue(prev => ({ ...prev, [feature.id]: e.target.value }))}
                placeholder="Nuevo atributo (ej: Couche)"
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => { if (e.key === 'Enter') addAttribute(feature.id); }}
              />
              <button onClick={() => addAttribute(feature.id)} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700">
                Agregar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}