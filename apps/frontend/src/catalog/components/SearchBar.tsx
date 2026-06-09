import { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface SearchBarProps {
  products?: Product[];                    // Para búsqueda local
  getProductUrl?: (product: Product) => string; // Para navegar al hacer clic
  onSearch?: (query: string) => void;      // Para filtrar en tiempo real
  fetchSuggestions?: (query: string) => Promise<Product[]>; // Para búsqueda remota
  onSelectProduct?: (product: Product) => void; // Para manejar acciones extra al seleccionar
}

export default function SearchBar({ products = [], getProductUrl, onSearch, fetchSuggestions, onSelectProduct }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para obtener sugerencias (local o remoto)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = value.trim().toLowerCase();
      if (onSearch) onSearch(query);

      if (query.length === 0) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      let results: Product[] = [];
      if (fetchSuggestions) {
        // Búsqueda remota (para admin)
        results = await fetchSuggestions(query);
      } else {
        // Búsqueda local (para catálogo)
        results = products.filter(p =>
          p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
        );
      }
      setSuggestions(results.slice(0, 8));
      setShowDropdown(results.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [value, products, fetchSuggestions, onSearch]);

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

  // Cerrar dropdown con Escape o scroll
  useEffect(() => {
    const handleScroll = () => setShowDropdown(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (product: Product) => {
    setValue('');
    setShowDropdown(false);
    if (getProductUrl) {
      window.location.href = getProductUrl(product);
    }
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
        />
        {value && (
          <button
            onClick={() => { setValue(''); if (onSearch) onSearch(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
          {suggestions.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
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