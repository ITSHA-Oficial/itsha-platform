import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useCatalog from '../hooks/useCatalog';
import CartIcon from '../components/CartIcon';
import ImageGallery from '../components/ImageGallery';
import SpecConfigurator from '../components/SpecConfigurator';
import FormulaInputs from '../components/FormulaInputs';
import SearchBar from '../components/SearchBar';

interface ProductDetailProps {
  onAddToCart: (item: any) => void;
  totalItems: number;
  onCartClick: () => void;
}

export default function ProductDetail({ onAddToCart, totalItems, onCartClick }: ProductDetailProps) {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const { products, tenant, loading, error } = useCatalog();

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [formulaInputs, setFormulaInputs] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [showSearch, setShowSearch] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const product = products.find((p: any) => p.sku === sku);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg mb-4">Producto no encontrado</p>
        <button onClick={() => navigate('/')} className="text-blue-600 underline">
          Volver al inicio
        </button>
      </div>
    );
  }

  const placeholder = '/assets/placeholder.svg';
  const productImages = product.images?.length
    ? product.images.map((img: any) => ({ url: img.url, alt_text: img.alt_text || product.name }))
    : [{ url: product.primary_image_url || placeholder, alt_text: product.name }];

  const handleAddToCart = () => {
    const variant = product.variants?.find((v: any) => {
      if (!v.attributes || v.attributes.length === 0) return false;
      return v.attributes.every((a: any) => selectedOptions[a.feature_name] === a.value);
    });

    const item = {
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      variant_id: variant?.id || null,
      variant_signature: variant?.variant_signature || null,
      selected_options: selectedOptions,
      formula_inputs: Object.keys(formulaInputs).length > 0 ? formulaInputs : null,
      quantity,
      unit_price: variant?.price || null,
      total_price: variant?.price ? variant.price * quantity : null,
      image_url: product.primary_image_url
    };

    onAddToCart(item);
    alert('¡Producto agregado al carrito!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con logo y lupa */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white hover:shadow-sm transition-all text-gray-500 hover:text-gray-700"
              title="Volver"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {tenant?.logo_url && (
              <img src={tenant.logo_url} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
            )}
            <h1 className="text-lg font-bold text-gray-900 truncate">{product.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`w-10 h-10 flex items-center justify-center rounded-full ${
                showSearch ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <CartIcon totalItems={totalItems} onClick={onCartClick} />
          </div>
        </div>
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showSearch ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-3 bg-gray-50/95 backdrop-blur-sm border-t border-gray-100">
            <SearchBar
              products={products}
              onSelectProduct={(p: any) => {
                navigate(`/producto/${p.sku}`);
                setShowSearch(false);
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ImageGallery images={productImages} placeholder={placeholder} />

          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
            {product.description && (
              <p className="text-gray-500 mb-6">{product.description}</p>
            )}

            {product.pricing_mode === 'explicit_variant' ? (
              <SpecConfigurator
                features={product.features || []}
                variants={product.variants || []}
                selectedOptions={selectedOptions}
                onOptionsChange={setSelectedOptions}
              />
            ) : (
              <FormulaInputs
                formulaVars={product.formula_vars || []}
                onInputsChange={setFormulaInputs}
              />
            )}

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-lg font-bold text-gray-500 hover:bg-gray-50"
                >
                  −
                </button>
                <span className="px-4 py-2 text-lg font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-lg font-bold text-gray-500 hover:bg-gray-50"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}