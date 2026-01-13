
import React, { useState } from 'react';
import { useStore } from '../App';
import { UserInfo } from '../types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateCartQuantity, csContacts } = useStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', address: '', phone: '' });

  const total = cart.reduce((acc, item) => {
    const price = item.selectedVariation ? item.selectedVariation.price : item.price;
    return acc + (price * item.quantity);
  }, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  const sendWhatsAppOrder = () => {
    if (!userInfo.name || !userInfo.address || !userInfo.phone) {
      alert('Mohon lengkapi data diri Anda.');
      return;
    }

    // 1. Pilih satu nomor customer_service secara acak yang berstatus is_active.
    const activeCS = csContacts.filter(c => c.isActive);
    if (activeCS.length === 0) {
      alert('Maaf, saat ini CS kami sedang tidak aktif.');
      return;
    }

    const cs = activeCS[Math.floor(Math.random() * activeCS.length)];
    
    // 2. Menyusun pesan dengan format yang diminta
    let message = `Halo ${cs.name}, saya ingin memesan.\n`;
    message += `Nama: ${userInfo.name}\n`;
    message += `Alamat: ${userInfo.address}\n`;
    message += `No HP: ${userInfo.phone}\n\n`;
    
    message += `_Daftar Pesanan:_\n\n`;
    
    cart.forEach((item) => {
      const price = item.selectedVariation ? item.selectedVariation.price : item.price;
      const variationName = item.selectedVariation ? ` (${item.selectedVariation.name})` : '';
      const subtotal = price * item.quantity;
      
      message += `- ${item.name}${variationName} x ${item.quantity} = Rp ${subtotal.toLocaleString('id-ID')}\n`;
    });
    
    message += `\n---\n\n`;
    message += `Total Akhir: Rp ${total.toLocaleString('id-ID')}\n\n`;
    message += `Mohon segera diproses, terima kasih!`;

    // 4. Mengarahkan (redirect) ke https://wa.me/[nomor_cs]?text=[pesan_encoded]
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cs.phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-background-dark shadow-2xl z-[101] transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-black">{showCheckout ? 'Checkout Info' : 'Shopping Cart'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!showCheckout ? (
            cart.length > 0 ? (
              <div className="flex flex-col gap-6">
                {cart.map(item => (
                  <div key={`${item.id}-${item.selectedVariation?.id}`} className="flex gap-4">
                    <img src={item.selectedVariation ? (item.coverMedia?.url || item.image) : item.image} alt={item.name} className="size-20 rounded-xl object-cover bg-gray-50 dark:bg-black/20" />
                    <div className="flex-1">
                      <h4 className="font-bold line-clamp-1">{item.name}</h4>
                      {item.selectedVariation && <p className="text-xs text-gray-400 font-black uppercase">Var: {item.selectedVariation.name}</p>}
                      <p className="text-primary font-black text-sm">Rp {(item.selectedVariation ? item.selectedVariation.price : item.price).toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                          <button onClick={() => updateCartQuantity(item.id, item.selectedVariation?.id || '', item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">-</button>
                          <span className="px-3 py-1 text-sm font-bold border-x border-gray-100 dark:border-gray-800">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, item.selectedVariation?.id || '', item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id, item.selectedVariation?.id)} className="text-red-500 text-xs font-black uppercase hover:underline">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                <span className="material-symbols-outlined text-6xl">shopping_cart_off</span>
                <p className="font-bold">Your cart is empty.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Full Name</label>
                <input type="text" className="h-12 border rounded-xl px-4 dark:bg-[#1a2e1a] border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-primary outline-none transition-all" value={userInfo.name} onChange={e => setUserInfo({ ...userInfo, name: e.target.value })} placeholder="e.g. John Doe" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Phone Number</label>
                <input type="tel" className="h-12 border rounded-xl px-4 dark:bg-[#1a2e1a] border-gray-200 dark:border-gray-800 focus:ring-1 focus:ring-primary outline-none transition-all" value={userInfo.phone} onChange={e => setUserInfo({ ...userInfo, phone: e.target.value })} placeholder="e.g. 0812345678" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">Full Address</label>
                <textarea className="h-24 border rounded-xl p-4 dark:bg-[#1a2e1a] border-gray-200 dark:border-gray-800 resize-none focus:ring-1 focus:ring-primary outline-none transition-all" value={userInfo.address} onChange={e => setUserInfo({ ...userInfo, address: e.target.value })} placeholder="Street name, house number..." />
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 text-sm font-bold hover:underline">Back to Cart</button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Total Amount</span>
            <span className="text-2xl font-black text-primary">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          {showCheckout ? (
            <button onClick={sendWhatsAppOrder} disabled={!userInfo.name || !userInfo.address || !userInfo.phone} className="w-full h-14 bg-primary text-[#111811] rounded-2xl font-black flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-50 shadow-xl shadow-primary/20 transition-all">
              <span className="material-symbols-outlined font-black">send</span> Order via WhatsApp
            </button>
          ) : (
            <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full h-14 bg-primary text-[#111811] rounded-2xl font-black flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-50 shadow-xl shadow-primary/20 transition-all">
              Proceed to Checkout
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
