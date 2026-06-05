import { useEffect } from 'react';

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
  isOpen: boolean;
  onClose: () => void;
  socialLinks?: {
    facebook_url?: string;
    instagram_url?: string;
    whatsapp?: string;
    tiktok_url?: string;
    address?: string;
  };
}

export default function CategoryMenu({ categories, selected, onSelect, isOpen, onClose, socialLinks }: CategoryMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!categories || categories.length === 0) return null;

  const handleSelect = (slug: string | null) => {
    onSelect(slug);
    onClose();
  };

  const hasSocialLinks = socialLinks && (
    socialLinks.facebook_url ||
    socialLinks.instagram_url ||
    socialLinks.whatsapp ||
    socialLinks.tiktok_url ||
    socialLinks.address
  );

  return (
    <>
      {/* Overlay oscuro */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Panel deslizante */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header con botón de cierre */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Categorías</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Cerrar menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de categorías (scrollable) */}
        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left px-6 py-4 transition-colors flex items-center gap-3 ${
              selected === null
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {selected === null && (
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            )}
            <span>Todas las categorías</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.slug)}
              className={`w-full text-left px-6 py-4 transition-colors flex items-center gap-3 ${
                selected === cat.slug
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {selected === cat.slug && (
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              )}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Redes sociales y dirección (fijo abajo) */}
        {hasSocialLinks && (
          <div className="border-t px-6 py-4 space-y-3 flex-shrink-0">
            <div className="flex justify-center gap-5">
              {socialLinks.facebook_url && (
                <a href={socialLinks.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
              )}
              {socialLinks.instagram_url && (
                <a href={socialLinks.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="5" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}
              {socialLinks.whatsapp && (
                <a href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </a>
              )}
              {socialLinks.tiktok_url && (
                <a href={socialLinks.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10.5V3.5M14 10.5a4.5 4.5 0 01-9 0V7m9 3.5a4.5 4.5 0 009 0V7M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </a>
              )}
            </div>
            {socialLinks.address && (
              <p className="text-xs text-gray-400 text-center">{socialLinks.address}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}