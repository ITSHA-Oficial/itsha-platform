import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

interface QuoteRequest {
  id: string;
  client_name: string;
  client_phone: string;
  status: string;
  processing_status: string;
  created_at: string;
}

interface CatalogVersion {
  version: number;
  products_count: number;
  created_at: string;
  trigger: string;
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [pendingQuotes, setPendingQuotes] = useState<QuoteRequest[]>([]);
  const [closedQuotes, setClosedQuotes] = useState<QuoteRequest[]>([]);
  const [catalogInfo, setCatalogInfo] = useState<CatalogVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      const headers = { 'X-Tenant-Slug': TENANT_SLUG };

      const [pendingRes, closedRes, catalogRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/quote-requests?status=nuevo&limit=5`, { headers }),
        fetch(`${API_URL}/api/v1/quote-requests?status=cerrado&limit=5`, { headers }),
        fetch(`${API_URL}/api/v1/catalog/versions?limit=1`, { headers })
      ]);

      const pendingData = await pendingRes.json();
      const closedData = await closedRes.json();
      const catalogData = await catalogRes.json();

      setPendingQuotes(pendingData.quote_requests || []);
      setClosedQuotes(closedData.quote_requests || []);
      if (catalogData.versions && catalogData.versions.length > 0) {
        setCatalogInfo(catalogData.versions[0]);
      }
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCloseQuote = async (quoteId: string) => {
    setClosingId(quoteId);
    try {
      await fetch(`${API_URL}/api/v1/quote-requests/${quoteId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': TENANT_SLUG },
        body: JSON.stringify({ status: 'cerrado' })
      });
      // Recargar ambas listas
      await loadDashboard();
    } catch (err) {
      console.error('Error al cerrar cotización:', err);
    } finally {
      setClosingId(null);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-6">Bienvenido, {user?.email}. Rol: {role}</p>

      {/* Tarjetas de resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Pendientes de contacto</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingQuotes.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Cotizaciones cerradas</p>
          <p className="text-3xl font-bold text-green-600">{closedQuotes.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Catálogo activo</p>
          {catalogInfo ? (
            <div>
              <p className="text-3xl font-bold text-blue-600">v{catalogInfo.version}</p>
              <p className="text-xs text-gray-400">{catalogInfo.products_count} productos</p>
              <p className="text-xs text-gray-400">Actualizado {new Date(catalogInfo.created_at).toLocaleDateString('es-PE')}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No disponible</p>
          )}
        </div>
      </div>

      {/* Cotizaciones pendientes */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Cotizaciones pendientes de contacto</h2>
        {pendingQuotes.length === 0 ? (
          <p className="text-sm text-gray-400">No hay cotizaciones pendientes.</p>
        ) : (
          <div className="space-y-3">
            {pendingQuotes.map(q => (
              <div key={q.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{q.client_name}</p>
                  <p className="text-xs text-gray-500">{q.client_phone} · {new Date(q.created_at).toLocaleDateString('es-PE')}</p>
                </div>
                <button
                  onClick={() => handleCloseQuote(q.id)}
                  disabled={closingId === q.id}
                  className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100 disabled:opacity-50"
                >
                  {closingId === q.id ? 'Cerrando...' : 'Cerrar cotización'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => navigate('/admin/products')} className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
            Ver productos
          </button>
          <button onClick={() => navigate('/admin/products/new')} className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
            Nuevo producto
          </button>
          <button onClick={() => navigate('/admin/quote-requests')} className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
            Ver cotizaciones
          </button>
          <button onClick={() => navigate('/admin/categories')} className="p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
            Gestionar categorías
          </button>
        </div>
      </div>
    </div>
  );
}