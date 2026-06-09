import { useState, useCallback } from 'react';

interface AdminSearchBarProps {
  onSearch: (query: string) => void;
}

export default function AdminSearchBar({ onSearch }: AdminSearchBarProps) {
  const [value, setValue] = useState('');

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    onSearch(newValue);
  }, [onSearch]);

  return (
    <div className="relative mb-4">
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder="Buscar productos..."
        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
      />
      {value && (
        <button
          onClick={() => handleChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}