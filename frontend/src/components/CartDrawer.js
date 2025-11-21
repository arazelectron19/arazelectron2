import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { firestoreService } from '../firestoreService';
import OrderSuccessModal from './OrderSuccessModal';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState({ code: '', phone: '' });
  const [phone, setPhone] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreateOrder = async () => {
    if (!phone.trim()) {
      setError('Telefon nömrəsini daxil edin!');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          image: item.image || ''
        })),
        total: getTotal(),
        phone: phone.trim()
      };

      const result = await firestoreService.createOrder(orderData);
      
      setOrderCode(result.code);
      setSuccessOrderData({ code: result.code, phone: phone.trim() });
      clearCart();
      setPhone('');
      setShowOrderModal(false);
      
      // Show custom success modal immediately (no redirect)
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Order creation error:', error);
      setError('Sifariş yaradılarkən xəta baş verdi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">🛒 Səbət</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-orange-700 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500 text-lg">Səbət boşdur</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Alış-verişə davam et
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-gray-50 rounded-lg p-3"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-orange-600 font-bold">{item.price} ₼</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold">{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between mb-4">
              <span className="text-lg font-semibold">Cəmi:</span>
              <span className="text-2xl font-bold text-orange-600">
                {getTotal().toFixed(2)} ₼
              </span>
            </div>
            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Sifarişi yarat
            </button>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Sifariş məlumatları
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon nömrəsi *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+994 XX XXX XX XX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Ümumi məbləğ:</p>
              <p className="text-2xl font-bold text-orange-600">{getTotal().toFixed(2)} ₼</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Ləğv et
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Göndərilir...' : 'Təsdiq et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderCode={successOrderData.code}
        phone={successOrderData.phone}
      />
    </>
  );
};

export default CartDrawer;
