import { useState } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';
import useProducts from '../hooks/useProducts';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../catalog/components/SearchBar';

export default function Products() {
  const { products, pagination, loading, fetchProducts } = useProducts(TENANT_SLUG);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const fetchSuggestions = async (query: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/products?q=${encodeURIComponent(query)}&limit=8`, {
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.products || [];
    } catch {
      return [];
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Nuevo producto
        </button>
      </div>

      {/* Buscador */}
      <SearchBar
        fetchSuggestions={fetchSuggestions}
        getProductUrl={(product) => `/admin/products/${product.id}`}
        onSearch={(query) => { setSearch(query); fetchProducts(1, query ? { q: query } : undefined); }}
      />

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Pricing</th>
              <th className="px-6 py-3">Precio</th>
              <th className="px-6 py-3">Activo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(product => (
              <tr
                key={product.id}
                onClick={() => navigate(`/admin/products/${product.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{product.sku}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 text-gray-500">{product.pricing_mode === 'explicit_variant' ? 'Variantes' : 'Fórmula'}</td>
                <td className="px-6 py-4 text-gray-500">{product.display_price_mode === 'hidden' ? 'Oculto' : product.display_price_mode}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchProducts(page, search ? { q: search } : undefined)}
              className={`px-3 py-1 rounded-lg text-sm ${page === pagination.page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}