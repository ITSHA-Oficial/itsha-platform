import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

export default function Dashboard() {
  const { user, role } = useAuth();
  const [kpis, setKpis] = useState({ products: 0, quotes: 0, version: 0, jobs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKPIs() {
      try {
        const headers = { 'X-Tenant-Slug': TENANT_SLUG };
        
        const [prodRes, quoteRes, catRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/products?is_active=true`, { headers }),
          fetch(`${API_URL}/api/v1/quote-requests?status=nuevo`, { headers }),
          fetch(`${API_URL}/api/v1/catalog/versions?limit=1`, { headers }),
        ]);

        const products = await prodRes.json();
        const quotes = await quoteRes.json();
        const catalog = await catRes.json();

        setKpis({
          products: products?.pagination?.total || 0,
          quotes: quotes?.pagination?.total || 0,
          version: catalog?.versions?.[0]?.version || 0,
          jobs: 0,
        });
      } catch (err) {
        console.error('Error al cargar KPIs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadKPIs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-gray-500 mb-8">Bienvenido, {user?.email}. Rol: {role}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Productos activos</p>
          <p className="text-3xl font-bold text-gray-900">{kpis.products}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Cotizaciones nuevas</p>
          <p className="text-3xl font-bold text-blue-600">{kpis.quotes}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Versión del catálogo</p>
          <p className="text-3xl font-bold text-gray-900">v{kpis.version}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Jobs fallidos</p>
          <p className="text-3xl font-bold text-red-500">{kpis.jobs}</p>
        </div>
      </div>
    </div>
  );
}