import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value.trim());
    }, 300); // espera 300ms después de la última tecla

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Buscar productos por nombre o SKU..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
        />
        {value && (
          <button
            onClick={() => setValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}