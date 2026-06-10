import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pricingMode: 'explicit_variant' | 'dynamic_formula';
  displayPriceMode: 'hidden' | 'from_price' | 'exact' | 'contact_only';
  minPrice?: number;
  onQuickAdd?: (product: any) => void;
}

export default function ProductCard({
  id,
  sku,
  name,
  description,
  imageUrl,
  pricingMode,
  displayPriceMode,
  minPrice,
  onQuickAdd
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const placeholder = '/assets/placeholder.svg';

  const renderPrice = () => {
    if (displayPriceMode === 'hidden') return null;
    if (displayPriceMode === 'contact_only') return (
      <span className="text-sm text-primary font-medium">Consultar precio</span>
    );
    if (displayPriceMode === 'from_price' && minPrice !== undefined) return (
      <span className="text-lg font-bold text-green-600">Desde S/ {minPrice.toFixed(2)}</span>
    );
    if (displayPriceMode === 'exact' && minPrice !== undefined) return (
      <span className="text-lg font-bold text-green-600">S/ {minPrice.toFixed(2)}</span>
    );
    return null;
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd({
        product_id: id,
        sku,
        product_name: name,
        quantity: 1,
        selected_options: {},
        formula_inputs: null,
        image_url: imageUrl,
        variant_id: null,
        unit_price: minPrice || null,
        total_price: minPrice || null
      });
      // Animación de confirmación
      setAdded(true);
      setTimeout(() => setAdded(false), 600);
    }
  };

  return (
    <Link
      to={`/producto/${sku}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
    >
      <div className="aspect-square overflow-hidden bg-gray-100 relative group">
        <img
          src={imageUrl || placeholder}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {onQuickAdd && (
          <button
            onClick={handleQuickAdd}
            className={`absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
              added
                ? 'bg-green-500 text-white scale-110'
                : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md opacity-0 group-hover:opacity-100 active:opacity-100'
            }`}
            title="Agregar al carrito"
          >
            {added ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{name}</h3>
        <div className="mt-auto pt-2">
          {renderPrice()}
        </div>
      </div>
    </Link>
  );
}