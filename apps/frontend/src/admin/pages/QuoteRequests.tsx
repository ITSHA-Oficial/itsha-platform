import { useState, useEffect } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

interface QuoteRequest {
  id: string;
  client_name: string;
  client_phone: string;
  status: string;
  processing_status: string;
  created_at: string;
}

export default function QuoteRequests() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/quote-requests`, {
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      if (!res.ok) throw new Error('Error al cargar cotizaciones');
      const data = await res.json();
      setQuotes(data.quote_requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'nuevo': return 'bg-blue-100 text-blue-700';
      case 'contactado': return 'bg-yellow-100 text-yellow-700';
      case 'cerrado': return 'bg-green-100 text-green-700';
      case 'perdido': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const processingColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'expired': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cotizaciones</h1>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Teléfono</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotes.map(quote => (
              <tr key={quote.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(quote.created_at).toLocaleString('es-PE')}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{quote.client_name}</td>
                <td className="px-6 py-4 text-gray-500">{quote.client_phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${processingColor(quote.processing_status)}`}>
                    {quote.processing_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}