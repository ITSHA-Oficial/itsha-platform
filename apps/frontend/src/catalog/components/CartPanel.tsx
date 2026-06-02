import { useNavigate } from 'react-router-dom';
import type { CartItem } from '../hooks/useCart';

interface CartPanelProps {
  items: CartItem[];
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onClose: () => void;
}

export default function CartPanel({ items, onRemove, onUpdateQuantity, onClose }: CartPanelProps) {
  const navigate = useNavigate();

  const total = items.reduce((sum, item) => sum + (item.total_price || 0) * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">Tu carrito</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">Tu carrito está vacío.</p>
              <button onClick={() => { onClose(); navigate('/'); }} className="text-blue-600 underline">
                Explorar catálogo
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product_name}</p>
                  {item.variant_signature && (
                    <p className="text-xs text-gray-500 truncate">{item.variant_signature}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-300"
                    >−</button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-300"
                    >+</button>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <button onClick={() => onRemove(index)} className="text-gray-400 hover:text-red-500 text-lg leading-none">&times;</button>
                  {item.total_price && (
                    <p className="text-sm font-bold text-green-600">S/ {(item.total_price * item.quantity).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t px-6 py-4 space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => { onClose(); navigate('/cotizar'); }}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Solicitar cotización
            </button>
          </div>
        )}
      </div>
    </div>
  );
}