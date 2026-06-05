import { useState, useEffect, FormEvent } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newOrder, setNewOrder] = useState('0');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/categories`, {
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      if (!res.ok) throw new Error('Error al cargar categorías');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName || !newSlug) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({ name: newName, slug: newSlug, sort_order: parseInt(newOrder) || 0 })
      });
      if (res.ok) {
        setNewName('');
        setNewSlug('');
        setNewOrder('0');
        setCreating(false);
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return;
    try {
      await fetch(`${API_URL}/api/v1/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <button
          onClick={() => setCreating(!creating)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {creating ? 'Cancelar' : 'Nueva categoría'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-6 mb-6 max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input type="text" value={newSlug} onChange={e => setNewSlug(e.target.value)} required className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <input type="number" value={newOrder} onChange={e => setNewOrder(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            Crear categoría
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Slug</th>
              <th className="px-6 py-3">Orden</th>
              <th className="px-6 py-3">Activo</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                <td className="px-6 py-4 text-gray-500">{cat.sort_order}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cat.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 text-sm hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}