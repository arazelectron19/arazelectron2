import React from 'react';

const OrderSuccessModal = ({ isOpen, onClose, orderCode, phone }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"></div>
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <svg 
              className="w-16 h-16 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          ✔️ Sifariş qeydə alındı!
        </h2>

        {/* Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Sifariş kodu:</span>
            <span className="text-orange-600 font-bold text-lg">{orderCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Telefon:</span>
            <span className="text-gray-900 font-semibold">{phone}</span>
          </div>
        </div>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">
          Tezliklə sizinlə əlaqə saxlayacağıq!
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Tamam
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
