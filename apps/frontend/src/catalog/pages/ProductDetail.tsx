import { useParams, useNavigate } from 'react-router-dom';
import useCatalog from '../hooks/useCatalog';
import SpecConfigurator from '../components/SpecConfigurator';
import SearchBar from '../components/SearchBar';
import FormulaInputs from '../components/FormulaInputs';
import { useState, useEffect } from 'react';

interface ProductDetailProps {
  onAddToCart: (item: any) => void;
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();
  const { products, loading, error } = useCatalog();

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [formulaInputs, setFormulaInputs] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);

  // Reset state when SKU changes
  useEffect(() => {
    setSelectedOptions({});
    setFormulaInputs({});
    setQuantity(1);
  }, [sku]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
        <button onClick={() => navigate('/')} className="text-primary underline">
          Volver al inicio
        </button>
      </div>
    );
  }

  const placeholder = '/assets/placeholder.svg';

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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 shrink-0">
              ← Volver
            </button>
            <h1 className="text-lg font-bold text-gray-900 truncate">{product.name}</h1>
          </div>
          {/* Barra de búsqueda reutilizada */}
          <SearchBar
            products={products}
            onSearch={() => {}} // No necesitamos filtrar nada en detalle
            onSelectProduct={(sku) => navigate(`/producto/${sku}`)}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="aspect-video bg-gray-100">
            <img
              src={product.primary_image_url || placeholder}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>

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
                className="flex-1 bg-primary text-white py-3 px-6 rounded-xl font-semibold transition-colors"
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