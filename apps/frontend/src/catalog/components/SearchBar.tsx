import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  products: any[];
  onSelectProduct: (sku: string) => void;
}

export default function SearchBar({ products, onSelectProduct }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const query = value.toLowerCase().trim();
    const filtered = products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
    );
    setSuggestions(filtered.slice(0, 8)); // máximo 8 sugerencias
    setShowDropdown(filtered.length > 0);
  }, [value, products]);

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

  const handleSelect = (sku: string) => {
    setValue('');
    setShowDropdown(false);
    onSelectProduct(sku);
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Buscar productos por nombre o SKU..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
        />
        {value && (
          <button
            onClick={() => setValue('')}
            className="px-3 py-3 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto">
          {suggestions.map((product: any) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product.sku)}
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