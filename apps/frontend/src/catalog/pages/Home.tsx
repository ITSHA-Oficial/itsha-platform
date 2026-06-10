import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useCatalog from '../hooks/useCatalog';
import ProductCard from '../components/ProductCard';
import CategoryMenu from '../components/CategoryMenu';
import SearchBar from '../components/SearchBar';
import CartIcon from '../components/CartIcon';
import { fetchTenantSettings } from '../utils/api';

interface HomeProps {
  totalItems: number;
  cartOpen: boolean;
  onCartClick: () => void;
  onQuickAdd: (item: any) => void;
}

export default function Home({ totalItems, cartOpen, onCartClick, onQuickAdd }: HomeProps) {
  const { products, categories, tenant, loading, error } = useCatalog();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [socialLinks, setSocialLinks] = useState<any>({});
  const [cartPulse, setCartPulse] = useState(false);
  const navigate = useNavigate();

  // Cargar configuración del tenant (redes sociales, logo, etc.)
  useEffect(() => {
    fetchTenantSettings()
      .then(data => setSocialLinks(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const applyFilters = (categorySlug: string | null, query: string) => {
    let filtered = [...products];
    if (categorySlug) {
      filtered = filtered.filter(p => p.category_slug === categorySlug);
    }
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    setFilteredProducts(filtered);
  };

  const handleCategorySelect = (slug: string | null) => {
    setSelectedCategory(slug);
    applyFilters(slug, lastQuery);
  };

  const handleQuickAdd = (item: any) => {
    onQuickAdd(item);
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 600);
  };

  const getMinPrice = (product: any) => {
    if (!product.variants || product.variants.length === 0) return undefined;
    return Math.min(...product.variants.map((v: any) => v.price));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nuevo Header Profesional */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
          {/* Izquierda: Hamburguesa, Logo y Nombre */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-10 h-10 flex-shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú de categorías"
            >
              <span className="block w-5 h-0.5 bg-gray-600 rounded-full"></span>
              <span className="block w-5 h-0.5 bg-gray-600 rounded-full"></span>
              <span className="block w-5 h-0.5 bg-gray-600 rounded-full"></span>
            </button>
            
            {tenant?.logo_url && (
              <img 
                src={tenant.logo_url} 
                alt={tenant?.name || 'Logo'} 
                className="h-8 w-8 rounded-full object-cover flex-shrink-0" 
              />
            )}
            
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {tenant?.name || 'Catálogo'}
            </h1>
          </div>

          {/* Derecha: Lupa y Carrito */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                showSearch ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Buscar productos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            <CartIcon totalItems={totalItems} isActive={cartOpen} onClick={onCartClick} pulse={cartPulse} />
          </div>
        </div>

        {/* Barra de búsqueda desplegable con animación */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showSearch ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-3 bg-gray-50/95 backdrop-blur-sm border-t border-gray-100">
            <SearchBar
              products={products}
              onSearch={(query) => {
                setLastQuery(query);
                applyFilters(selectedCategory, query);
              }}
              onSelectProduct={(product) => {
                navigate(`/producto/${product.sku}`);
                setShowSearch(false);
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No se encontraron productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                id={product.id}
                sku={product.sku}
                name={product.name}
                description={product.description}
                imageUrl={product.primary_image_url}
                pricingMode={product.pricing_mode}
                displayPriceMode={product.display_price_mode}
                minPrice={getMinPrice(product)}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}
      </main>

      {/* Menú de categorías */}
      <CategoryMenu
        categories={categories}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        socialLinks={socialLinks}
      />
    </div>
  );
}