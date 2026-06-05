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
  // Bloquear scroll del body cuando el menú está abierto
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
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header con botón de cierre */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
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

        {/* Lista de categorías */}
        <div className="py-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 73px)' }}>
          {/* Opción "Todas las categorías" */}
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

          {/* Categorías individuales */}
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

        {socialLinks && (socialLinks.facebook_url || socialLinks.instagram_url || socialLinks.whatsapp || socialLinks.tiktok_url || socialLinks.address) && (
          <div className="px-6 py-5 border-t bg-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-3">Conecta con nosotros</p>
            <div className="flex flex-wrap gap-3 mb-4">
              {socialLinks.facebook_url && (
                <a
                  href={socialLinks.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                >
                  <span>Facebook</span>
                </a>
              )}
              {socialLinks.instagram_url && (
                <a
                  href={socialLinks.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500 text-white text-sm hover:bg-pink-600"
                >
                  <span>Instagram</span>
                </a>
              )}
              {socialLinks.whatsapp && (
                <a
                  href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                >
                  <span>WhatsApp</span>
                </a>
              )}
              {socialLinks.tiktok_url && (
                <a
                  href={socialLinks.tiktok_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-900"
                >
                  <span>TikTok</span>
                </a>
              )}
            </div>
            {socialLinks.address && (
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-800">Dirección</p>
                <p>{socialLinks.address}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}