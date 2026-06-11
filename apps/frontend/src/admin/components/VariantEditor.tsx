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

  // Edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMinQty, setEditMinQty] = useState('');

  // Confirmación de eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
        processingRef.current = false;
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

  // Iniciar edición: guardar valores actuales en el estado
  const startEditing = (variant: Variant) => {
    setEditingId(variant.id);
    setEditPrice(variant.price.toString());
    setEditMinQty(variant.min_quantity.toString());
    setDeleteConfirmId(null); // cerrar confirmación de borrado si estuviera abierta
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async (variantId: string) => {
    if (processingRef.current) return;
    const newPrice = parseFloat(editPrice);
    const newMin = parseInt(editMinQty) || 1;
    if (newPrice <= 0) return alert('Ingresa un precio válido.');

    processingRef.current = true;
    try {
      const res = await fetch(`${API_URL}/api/v1/variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({ price: newPrice, min_quantity: newMin })
      });
      if (res.ok) {
        setEditingId(null);
        processingRef.current = false;
        await fetchData();
      } else {
        const err = await res.json();
        alert(err?.error?.message || 'Error al actualizar la variante.');
        processingRef.current = false;
      }
    } catch (err) {
      console.error(err);
      processingRef.current = false;
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const res = await fetch(`${API_URL}/api/v1/variants/${variantId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      processingRef.current = false;

      if (!res.ok) {
        const err = await res.json();
        alert(err?.error?.message || 'Error al eliminar la variante.');
        setDeleteConfirmId(null);
        return;
      }

      setDeleteConfirmId(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      processingRef.current = false;
      alert('Error de conexión al intentar eliminar.');
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
              <div
                key={variant.id}
                className={`flex items-center justify-between rounded-xl p-3 ${
                  variant.is_main ? 'bg-yellow-50 border border-yellow-300 shadow-sm' : 'bg-gray-50'
                }`}
              >
                {editingId === variant.id ? (
                  /* --- MODO EDICIÓN --- */
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-gray-800">
                      {variant.attributes.map(a => `${a.feature_name}: ${a.value}`).join(' | ')}
                    </p>
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Precio (S/)</label>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Cant. mín.</label>
                        <input
                          type="number"
                          value={editMinQty}
                          onChange={e => setEditMinQty(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <button
                          onClick={() => saveEditing(variant.id)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs rounded-lg font-medium hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : deleteConfirmId === variant.id ? (
                  /* --- CONFIRMACIÓN DE ELIMINACIÓN --- */
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm text-red-600 font-medium">¿Eliminar esta variante?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg font-medium hover:bg-red-700"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg font-medium hover:bg-gray-300"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  /* --- MODO VISUALIZACIÓN --- */
                  <>
                    <div className="flex items-center gap-3">
                      {variant.is_main && (
                        <span className="text-yellow-500 text-lg" title="Variante principal">⭐</span>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {variant.attributes.map(a => `${a.feature_name}: ${a.value}`).join(' | ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Precio: S/ {variant.price.toFixed(2)} | Mín: {variant.min_quantity} u.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(variant)}
                        className="text-blue-500 text-sm hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(variant.id)}
                        className="text-red-500 text-sm hover:underline"
                      >
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
                        className={`text-sm underline ml-1 ${
                          variant.is_main ? 'text-yellow-600 font-semibold' : 'text-yellow-500 hover:text-yellow-600'
                        }`}
                        title={variant.is_main ? 'Ya es la principal' : 'Establecer como variante principal'}
                      >
                        {variant.is_main ? '★ Principal' : '☆ Establecer'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de creación (sin cambios) */}
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
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cant. mínima</label>
              <input
                type="number"
                value={minQty}
                onChange={e => setMinQty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateVariant}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Guardar variante
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}