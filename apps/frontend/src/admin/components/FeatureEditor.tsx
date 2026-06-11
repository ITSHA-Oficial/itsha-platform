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

  const persistOrder = async (updatedFeatures: Feature[]) => {
    const items = updatedFeatures.map((f, index) => ({
      id: f.id,
      sort_order: index + 1 // órdenes 1,2,3... desde 1
    }));
    await fetch(`${API_URL}/api/v1/products/${productId}/features/batch-sort`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
      body: JSON.stringify({ items })
    });
  };

  const moveFeature = async (index: number, direction: 'up' | 'down') => {
    if (processingRef.current) return;
    const newFeatures = [...features];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFeatures.length) return;

    // Intercambiar
    [newFeatures[index], newFeatures[targetIndex]] = [newFeatures[targetIndex], newFeatures[index]];
    setFeatures(newFeatures); // Optimistic UI

    processingRef.current = true;
    try {
      await persistOrder(newFeatures);
      await fetchFeatures(); // Refrescar para asegurar consistencia
    } catch (err) {
      console.error(err);
      // Revertir en caso de error (volvemos a cargar del servidor)
      await fetchFeatures();
    } finally {
      processingRef.current = false;
    }
  };

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
      processingRef.current = false;
      await fetchFeatures();
    } catch (err) {
      console.error(err);
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
      processingRef.current = false;
      await fetchFeatures();
    } catch (err) {
      console.error(err);
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
      processingRef.current = false;
      await fetchFeatures();
    } catch (err) {
      console.error(err);
      processingRef.current = false;
    }
  };

  const handleDeleteAttribute = async (attributeId: string) => {
    if (!confirm('¿Eliminar este atributo?')) return;
    try {
      await fetch(`${API_URL}/api/v1/attributes/${attributeId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      fetchFeatures();
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
        features.map((feature, index) => (
          <div key={feature.id} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-800">{feature.name}</h4>
                {/* Botones de movimiento */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveFeature(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5 leading-none"
                    title="Subir"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveFeature(index, 'down')}
                    disabled={index === features.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5 leading-none"
                    title="Bajar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
              <button onClick={() => deleteFeature(feature.id)} className="text-red-500 text-sm hover:underline">
                Eliminar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {feature.attributes.map(attr => (
                <span key={attr.id} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 group">
                  {attr.value}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAttribute(attr.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none ml-1"
                    title="Eliminar atributo"
                  >
                    ×
                  </button>
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