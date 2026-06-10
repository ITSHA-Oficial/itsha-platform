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
      setAdded(true);
      setTimeout(() => setAdded(false), 600);
    }
  };

  return (
    <Link
      to={`/producto/${sku}`}
      className="group bg-white overflow-hidden flex flex-col"
    >
      {/* Imagen sin bordes */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl || placeholder}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Contenido inferior */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{name}</h3>
        
        {/* Precio y botón de agregar */}
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div className="flex-1">
            {renderPrice()}
          </div>
          {onQuickAdd && (
            <button
              onClick={handleQuickAdd}
              className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                added
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-gray-100 text-gray-600 hover:bg-primary hover:text-white active:scale-95'
              }`}
              title="Agregar al carrito"
            >
              {added ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
                  <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}