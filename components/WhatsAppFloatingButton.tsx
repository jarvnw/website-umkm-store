
import React from 'react';
import { useStore } from '../App';

const WhatsAppFloatingButton: React.FC = () => {
  const { csContacts, siteSettings } = useStore();

  // Filter only active contacts
  const activeContacts = csContacts.filter(c => c.isActive);

  // If no active contacts, do not render the button
  if (activeContacts.length === 0) return null;

  const handleFloatingClick = () => {
    // Mechanism: Random Rotation
    const randomCS = activeContacts[Math.floor(Math.random() * activeContacts.length)];
    
    const message = `Halo ${randomCS.name}, saya pengunjung dari website ${siteSettings.siteName}. Saya ingin bertanya mengenai produk Anda.`;
    const encodedMessage = encodeURIComponent(message);
    
    window.open(`https://wa.me/${randomCS.phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[150] group flex items-center gap-3">
      {/* Tooltip-like label that shows on hover */}
      <div className="bg-white dark:bg-[#1a2e1a] px-4 py-2 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 pointer-events-none">
        <p className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Hubungi Kami</p>
      </div>
      
      {/* The Floating Button */}
      <button
        onClick={handleFloatingClick}
        className="size-16 bg-primary text-[#111811] rounded-full shadow-[0_10px_30px_rgba(var(--primary-rgb),0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 relative overflow-hidden"
        aria-label="Chat with us on WhatsApp"
      >
        {/* Subtle pulse animation background */}
        <div className="absolute inset-0 bg-white/20 animate-ping opacity-20"></div>
        
        {/* Updated Icon: Material Symbol for Customer Service */}
        <span className="material-symbols-outlined text-4xl relative z-10 font-black">
          support_agent
        </span>
      </button>
    </div>
  );
};

export default WhatsAppFloatingButton;
