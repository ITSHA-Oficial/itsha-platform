interface CartIconProps {
  totalItems: number;
  onClick: () => void;
  isActive?: boolean;
  pulse?: boolean; // Nueva prop
}

export default function CartIcon({ totalItems, onClick, isActive, pulse }: CartIconProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
        isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
      } ${pulse ? 'animate-bounce' : ''}`}
      aria-label="Abrir carrito"
    >
      {/* Icono de bolsa de compras */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
        <path d="M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}