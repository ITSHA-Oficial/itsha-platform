import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchTenantSettings } from '../utils/api';

export default function Thanks() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { quoteRequestId?: string; publicToken?: string; clientName?: string } | null;
  const clientName = state?.clientName || 'Cliente';

  const [tenantPhone, setTenantPhone] = useState<string>('');

  useEffect(() => {
    // Usamos la función centralizada para obtener los datos del tenant
    fetchTenantSettings()
      .then(data => {
        if (data.whatsapp) setTenantPhone(data.whatsapp);
      })
      .catch(err => console.error('Error al obtener el teléfono del tenant:', err));
  }, []);

  if (!state?.publicToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No se encontró información de la cotización.</p>
          <button onClick={() => navigate('/')} className="text-primary underline">Volver al inicio</button>
        </div>
      </div>
    );
  }

  const backendUrl = import.meta.env.VITE_BACKEND_PUBLIC_URL || 'https://itshabackend-production.up.railway.app';
  const pdfLink = `${backendUrl}/api/v1/public/quotes/${state.publicToken}/pdf`;
  const whatsappUrl = `https://wa.me/${tenantPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hola, soy ${clientName}. Acabo de enviar una solicitud de cotización desde el catálogo web.\n\nPuedes ver el detalle completo aquí:\n${pdfLink}\n\nQuedo atento a tu respuesta. ¡Gracias!`
  )}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">¡Cotización enviada!</h1>
        <p className="text-gray-500">Tu solicitud ha sido recibida. La vendedora se comunicará contigo por WhatsApp.</p>

        <div className="space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
          >
            Contactar por WhatsApp
          </a>
          <a
            href={pdfLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-primary text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Descargar PDF
          </a>
          <button
            onClick={() => navigate('/')}
            className="block w-full py-3 font-medium text-primary hover:text-primary transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}