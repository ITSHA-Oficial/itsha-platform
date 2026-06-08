import { useState } from 'react';

interface AdminSearchBarProps {
  onSearch: (query: string) => void;
}

export default function AdminSearchBar({ onSearch }: AdminSearchBarProps) {
  const [value, setValue] = useState('');

  const handleSearch = () => {
    if (value.trim()) {
      onSearch(value.trim());
    } else {
      onSearch('');
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Buscar productos por nombre o SKU..."
        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
      />
      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
      >
        Buscar
      </button>
    </div>
  );
}