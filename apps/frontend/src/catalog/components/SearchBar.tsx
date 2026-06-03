import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    onSearch(value.trim());
  };

  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Buscar productos..."
        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Buscar
      </button>
    </div>
  );
}