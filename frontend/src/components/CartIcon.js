import React from 'react';
import { useCart } from '../contexts/CartContext';

const CartIcon = ({ onClick }) => {
  const { getCartCount } = useCart();
  const count = getCartCount();

  return (
    <button
      onClick={onClick}
      className="relative text-white transition-all duration-200 ease-in-out hover:scale-110"
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '8px',
        borderRadius: '50%',
        boxShadow: '0 0 6px rgba(0, 0, 0, 0.3)',
        color: '#ffffff',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
      }}
    >
      <svg
        className="w-7 h-7"
        style={{ fontSize: '26px' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default CartIcon;
