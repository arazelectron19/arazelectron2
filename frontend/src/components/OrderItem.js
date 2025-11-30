import React from 'react';

const OrderItem = ({ item, index, onRemove, isRemoving }) => {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
      {/* Product Image */}
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 object-cover rounded flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-sm text-gray-600">
          Say: {item.qty} × {item.price} ₼
        </p>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          Cəmi: {(item.qty * item.price).toFixed(2)} ₼
        </p>
      </div>
      
      {/* Remove Button */}
      <button
        onClick={() => onRemove(index)}
        disabled={isRemoving}
        className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        title="Məhsulu sil"
      >
        {isRemoving ? '⏳' : '🗑️ Sil'}
      </button>
    </div>
  );
};

export default OrderItem;
