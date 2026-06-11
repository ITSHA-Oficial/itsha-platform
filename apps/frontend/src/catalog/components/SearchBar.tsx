import { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface SearchBarProps {
  products?: Product[];
  getProductUrl?: (product: Product) => string;
  onSearch?: (query: string) => void;
  fetchSuggestions?: (query: string) => Promise<Product[]>;
  onSelectProduct?: (product: Product) => void;
}

export default function SearchBar({
  products = [],
  getProductUrl,
  onSearch,
  fetchSuggestions,
  onSelectProduct
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para obtener sugerencias sin forzar apertura
  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = value.trim().toLowerCase();
      // Notificar al padre para filtrar (siempre)
      if (onSearch) onSearch(query);

      if (query.length === 0) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      let results: Product[] = [];
      if (fetchSuggestions) {
        results = await fetchSuggestions(query);
      } else {
        results = products.filter(p =>
          p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
        );
      }
      setSuggestions(results.slice(0, 8));
      // Solo mostrar dropdown si el input está enfocado
      // El estado de foco lo manejamos con onFocus/onBlur en el input
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

  // Cerrar con Escape y con scroll (solo si el scroll no es del dropdown)
  useEffect(() => {
    const handleScroll = (event: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setShowDropdown(false);
    };
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
    setShowDropdown(false);
    if (getProductUrl) {
      window.location.href = getProductUrl(product);
    }
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  // Mostrar dropdown al enfocar si hay sugerencias
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  // Mostrar dropdown al cambiar texto si hay sugerencias
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    // Pequeño truco: después de un cambio, si hay sugerencias, abrir dropdown
    // pero esperamos al efecto de sugerencias; podemos forzar apertura aquí
    // pero el efecto ya se encargará después de 300ms. Para respuesta inmediata,
    // podemos abrirlo si ya hay sugerencias (antes del debounce).
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Buscar productos..."
          className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-xl text-sm shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:shadow-md transition-all min-h-[48px] placeholder-gray-400"
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
        <div className="absolute top-full left-0 right-0 z-[100] bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
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