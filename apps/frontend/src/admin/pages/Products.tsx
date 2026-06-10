import { useState, useEffect, useMemo, useRef } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';
import useProducts from '../hooks/useProducts';
import { useNavigate } from 'react-router-dom';
import AdminSearchBar from '../components/AdminSearchBar';

export default function Products() {
  const { products: allProducts, pagination, loading, fetchProducts } = useProducts(TENANT_SLUG);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  // Cargar una página grande de productos (500) una sola vez al montar
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      fetchProducts(1, { limit: '500' });
    }
  }, [fetchProducts]);

  // Recargar cuando la página recibe el foco de nuevo (ej: al volver de editar)
  useEffect(() => {
    const handleFocus = () => fetchProducts(1, { limit: '500' });
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProducts]);

  // Filtrado local en tiempo real
  const products = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.toLowerCase().trim();
    return allProducts.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [allProducts, search]);

  const featuredCount = useMemo(() => allProducts.filter((p: any) => p.is_featured).length, [allProducts]);

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Eliminar este producto? Se ocultará del catálogo público.')) return;
    setDeletingId(productId);
    try {
      const res = await fetch(`${API_URL}/api/v1/products/${productId}`, {
        method: 'DELETE',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      if (res.ok) {
        fetchProducts(1, { limit: '500' }); // Recargar la lista
      } else {
        alert('Error al eliminar el producto.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setDeletingId(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Nuevo producto
        </button>
      </div>

      <AdminSearchBar onSearch={(query) => setSearch(query)} />

      {featuredCount < 5 && (
        <p className="text-amber-600 text-sm my-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          ⚠️ Solo hay {featuredCount} producto(s) destacado(s). El carrusel necesita al menos 5 para verse óptimo.
        </p>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Pricing</th>
              <th className="px-6 py-3">Precio</th>
              <th className="px-6 py-3">Activo</th>
              <th className="px-4 py-3 text-center">Destacado</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
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
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`${API_URL}/api/v1/products/${product.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'X-Tenant-Slug': TENANT_SLUG
                            },
                            body: JSON.stringify({ is_featured: !product.is_featured })
                          });
                          // Refrescar la lista
                          fetchProducts(1, { limit: '500' });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`text-2xl transition-transform hover:scale-110 ${
                        product.is_featured ? 'text-yellow-500' : 'text-gray-300'
                      }`}
                      title={product.is_featured ? 'Quitar del carrusel' : 'Agregar al carrusel'}
                    >
                      ★
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="text-red-500 text-sm hover:underline disabled:opacity-50"
                    >
                      {deletingId === product.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchProducts(page, { limit: '500' })}
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