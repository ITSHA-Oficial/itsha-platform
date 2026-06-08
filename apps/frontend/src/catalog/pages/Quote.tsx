import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import { submitQuoteRequest } from '../utils/api';

export default function Quote() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + (item.total_price || 0) * item.quantity, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Por favor completa tu nombre y WhatsApp.');
      return;
    }

    if (!/^9\d{8}$/.test(clientPhone.replace(/\s/g, ''))) {
      setError('El número de WhatsApp debe empezar con 9 y tener 9 dígitos.');
      return;
    }

    if (items.length === 0) {
      setError('El carrito está vacío.');
      return;
    }

    setSending(true);
    try {
      const payload = {
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_email: clientEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id || undefined,
          quantity: item.quantity,
          selected_options: item.selected_options,
          formula_inputs: item.formula_inputs || undefined,
        })),
      };

      const response = await submitQuoteRequest(payload);

      if (response.error) {
        setError(response.error.message || 'Error al enviar la cotización.');
        setSending(false);
        return;
      }

      clearCart();
      navigate('/gracias', {
        state: {
          quoteRequestId: response.quote_request_id,
          publicToken: response.public_token,
          clientName: clientName.trim()
        },
      });
    } catch (err: any) {
      setError('Error de conexión. Intenta de nuevo.');
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Tu carrito está vacío.</p>
          <button onClick={() => navigate('/')} className="text-primary underline">Volver al catálogo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">← Volver</button>
          <h1 className="text-lg font-bold text-gray-900">Solicitar cotización</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Resumen */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Resumen del pedido</h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
                {item.total_price && (
                  <span className="font-medium">S/ {(item.total_price * item.quantity).toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
          {total > 0 && (
            <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
              <span>Total</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Tus datos</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[48px]"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
            <input
              type="tel"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[48px]"
              placeholder="999888777"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[48px]"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
              placeholder="Algún detalle extra para tu pedido..."
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar cotización por WhatsApp'}
          </button>
        </form>
      </main>
    </div>
  );
}