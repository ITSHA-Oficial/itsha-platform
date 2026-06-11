import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface ProductSearchDropdownProps {
  products: Product[];
}

export default function ProductSearchDropdown({ products }: ProductSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar productos en tiempo real (búsqueda local)
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products
      .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, products]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (product: Product) => {
    setQuery('');
    setShowDropdown(false);
    navigate(`/admin/products/${product.id}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
            showDropdown ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Buscar producto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="p-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {suggestions.length > 0 && (
              <div className="max-h-64 overflow-y-auto border-t border-gray-100">
                {suggestions.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <span className="font-medium text-gray-900 block text-sm">{product.name}</span>
                    <span className="text-xs text-gray-400">{product.sku}</span>
                  </button>
                ))}
              </div>
            )}
            {query && suggestions.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-400">
                No se encontraron productos.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}