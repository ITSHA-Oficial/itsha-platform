import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
}

interface CategoryMenuProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export default function CategoryMenu({ categories, selected, onSelect }: CategoryMenuProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[48px] ${
          selected === null
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
        }`}
      >
        Todos
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.slug)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[48px] ${
            selected === cat.slug
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}