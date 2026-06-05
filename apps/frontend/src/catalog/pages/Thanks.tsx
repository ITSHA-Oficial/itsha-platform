import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Thanks() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { quoteRequestId?: string; publicToken?: string } | null;

  const [tenantPhone, setTenantPhone] = useState<string>('+51947112803');

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/public/tenant/settings?slug=lrimprenta')
      .then(res => res.json())
      .then(data => {
        if (data.whatsapp) setTenantPhone(data.whatsapp);
      })
      .catch(() => {});
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

  const whatsappUrl = `https://wa.me/${tenantPhone.replace(/\D/g, '')}?text=Hola%2C%20acabo%20de%20enviar%20mi%20cotización.%20Mi%20código%20es%3A%20${state.publicToken}`;
  const pdfUrl = `http://localhost:3000/api/v1/public/quotes/${state.publicToken}/pdf`;

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
            href={pdfUrl}
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