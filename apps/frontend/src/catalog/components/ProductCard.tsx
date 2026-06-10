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
}

export default function ProductCard({
  id,
  sku,
  name,
  description,
  imageUrl,
  pricingMode,
  displayPriceMode,
  minPrice
}: ProductCardProps) {
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

  return (
    <Link
      to={`/producto/${sku}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl || placeholder}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
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