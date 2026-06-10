import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface CarouselProduct {
  id: string;
  sku: string;
  name: string;
  primary_image_url: string | null;
  display_price_mode: string;
  minPrice?: number;
  is_featured?: boolean;
}

interface FeaturedCarouselProps {
  products: CarouselProduct[];
}

export default function FeaturedCarousel({ products }: FeaturedCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const navigate = useNavigate();

  const count = products.length;
  if (count === 0) return null;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goTo = (index: number) => setCurrent(index);

  // Autoplay cada 4 segundos
  useEffect(() => {
    timerRef.current = setInterval(next, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  // Pausar autoplay al tocar, reiniciar al soltar
  const pauseAutoplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const resumeAutoplay = () => {
    timerRef.current = setInterval(next, 4000);
  };

  // Soporte táctil
  const handleTouchStart = (e: React.TouchEvent) => {
    pauseAutoplay();
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    resumeAutoplay();
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  // Navegar al detalle del producto
  const handleProductClick = (sku: string) => {
    navigate(`/producto/${sku}`);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-md bg-white">
      {/* Pista deslizante */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-full flex-shrink-0 cursor-pointer"
            onClick={() => handleProductClick(product.sku)}
          >
            <div className="aspect-[16/9] sm:aspect-[21/9] bg-gray-100 relative overflow-hidden">
              <img
                src={product.primary_image_url || '/assets/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                <h3 className="text-white font-bold text-lg sm:text-xl line-clamp-1">{product.name}</h3>
                {product.minPrice !== undefined && (
                  <p className="text-white/90 text-sm font-semibold">
                    Desde S/ {product.minPrice.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flechas de navegación (escritorio) */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}

      {/* Puntos indicadores */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); goTo(index); }}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === current ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Ir al producto ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}