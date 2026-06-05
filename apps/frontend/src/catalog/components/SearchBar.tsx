import { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  sku: string;
  name: string;
  // otros campos...
}

interface SearchBarProps {
  products: Product[];
  onSearch: (query: string) => void;        // Para filtrar el grid en tiempo real
  onSelectProduct: (sku: string) => void;  // Para navegar al hacer clic en sugerencia
}

export default function SearchBar({ products, onSearch, onSelectProduct }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para filtrar sugerencias (dropdown) y grid (onSearch) con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = value.trim().toLowerCase();
      // Llamamos a onSearch para el grid
      onSearch(query);

      // Generamos sugerencias locales para el dropdown
      if (query.length === 0) {
        setSuggestions([]);
        setShowDropdown(false);
      } else {
        const filtered = products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query)
        );
        setSuggestions(filtered.slice(0, 8));
        setShowDropdown(filtered.length > 0);
      }
    }, 300); // debounce de 300ms

    return () => clearTimeout(timer);
  }, [value, products, onSearch]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (sku: string) => {
    setValue('');
    setShowDropdown(false);
    onSelectProduct(sku);
  };

  const handleClear = () => {
    setValue('');
    setShowDropdown(false);
    onSearch('');
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Buscar productos por nombre o SKU..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px]"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelectSuggestion(product.sku)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <span className="font-medium text-gray-900 block">{product.name}</span>
              <span className="text-xs text-gray-400">{product.sku}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}