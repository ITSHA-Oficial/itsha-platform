import { useState, useEffect, useMemo } from 'react';
import { TENANT_SLUG } from '../../catalog/utils/api';
import useProducts from '../hooks/useProducts';
import { useNavigate } from 'react-router-dom';
import AdminSearchBar from '../components/AdminSearchBar';

export default function Products() {
  const { products: allProducts, pagination, loading, fetchProducts } = useProducts(TENANT_SLUG);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Cargar productos UNA SOLA VEZ al montar la página
  useEffect(() => {
    fetchProducts(1, { limit: '100' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrar localmente según el texto del buscador
  const products = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.toLowerCase().trim();
    return allProducts.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [allProducts, search]);

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
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Nuevo producto
        </button>
      </div>

      {/* Única barra de búsqueda: predictiva + filtro en tiempo real */}
      <AdminSearchBar
        onSelectProduct={(product) => navigate(`/admin/products/${product.id}`)}
        onSearch={(query) => setSearch(query)}
      />

      {/* Tabla de productos */}
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
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              products.map(product => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación (solo se muestra si no hay búsqueda activa) */}
      {!search && pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchProducts(page, { limit: '100' })}
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