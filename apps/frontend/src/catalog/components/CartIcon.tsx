interface CartIconProps {
  totalItems: number;
  onClick: () => void;
}

export default function CartIcon({ totalItems, onClick }: CartIconProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 bg-red-500 text-white rounded-full z-50"
      aria-label="Abrir carrito"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 003 3h4.5a3 3 0 003-3H18m-9 0H5.25m9.75 0h3.5M6.75 3.75l1.5 5.625m0 0h7.5m-7.5 0L9 14.25m7.5-4.875l.75 4.875" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}