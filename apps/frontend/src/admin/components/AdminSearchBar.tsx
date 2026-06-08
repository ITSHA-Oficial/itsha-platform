import { useState, useEffect, useRef } from 'react';

interface Product {
  id: string;
  sku: string;
  name: string;
}

interface AdminSearchBarProps {
  onSelectProduct: (product: Product) => void;
  onSearch?: (query: string) => void;  // NUEVA PROP para filtrar la tabla
}

const API_URL = import.meta.env.VITE_API_URL;
const TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG;

export default function AdminSearchBar({ onSelectProduct, onSearch }: AdminSearchBarProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Efecto para búsqueda asíncrona con debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    
    // Notificar al padre para filtrar la tabla (incluso si está vacío)
    if (onSearch) {
      onSearch(query);
    }

    if (query.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/products?q=${encodeURIComponent(query)}&limit=8`, {
          headers: { 'X-Tenant-Slug': TENANT_SLUG }
        });
        if (!res.ok) return;
        const data = await res.json();
        const results = data.products || [];
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('Error en búsqueda predictiva:', error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onSearch]);

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

  const handleSelect = (product: Product) => {
    setValue('');
    setShowDropdown(false);
    onSelectProduct(product);
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
            onClick={() => { setValue(''); setShowDropdown(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
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