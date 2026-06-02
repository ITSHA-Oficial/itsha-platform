import useCatalog from '../hooks/useCatalog';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { products, tenant, loading, error } = useCatalog();

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

  const getMinPrice = (product: any) => {
    if (!product.variants || product.variants.length === 0) return undefined;
    return Math.min(...product.variants.map((v: any) => v.price));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{tenant?.name || 'Catálogo'}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No hay productos disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
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
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}