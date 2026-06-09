import { useState, useRef } from 'react';

interface ImageGalleryProps {
  images: { url: string; alt_text?: string }[];
  placeholder: string;
}

export default function ImageGallery({ images, placeholder }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const displayImages = images.length > 0 ? images : [{ url: placeholder, alt_text: 'Sin imagen' }];

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, displayImages.length - 1)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Imagen principal */}
      <div
        className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={displayImages[currentIndex].url}
          alt={displayImages[currentIndex].alt_text || 'Producto'}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        
        {/* Flechas de navegación (escritorio) */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
              aria-label="Siguiente"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Puntos indicadores */}
      {displayImages.length > 1 && (
        <div className="flex justify-center gap-2">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}