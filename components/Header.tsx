
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../App';

interface HeaderProps {
  onCartOpen: () => void;
  cartCount: number;
}

const Header: React.FC<HeaderProps> = ({ onCartOpen, cartCount }) => {
  const { siteSettings } = useStore();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#dbe6db] dark:border-[#2a3a2a] px-4 md:px-10 lg:px-40 py-4 flex items-center justify-between">
      <div className="flex items-center gap-10">
        <Link to="/" className="flex items-center gap-3">
          {siteSettings.logoUrl ? (
            <img src={siteSettings.logoUrl} alt={siteSettings.siteName} className="h-8 w-auto object-contain" />
          ) : (
            <div className="size-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
              </svg>
            </div>
          )}
          <h1 className="text-xl font-black tracking-tight">{siteSettings.siteName}</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</Link>
          <Link to="/products" className="text-sm font-semibold hover:text-primary transition-colors">Products</Link>
          <Link to="/about" className="text-sm font-semibold hover:text-primary transition-colors">About Us</Link>
          <Link to="/contact" className="text-sm font-semibold hover:text-primary transition-colors">Contact</Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onCartOpen}
          className="relative flex items-center justify-center size-10 rounded-xl bg-gray-50 dark:bg-[#1a2e1a] hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined">shopping_bag</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 bg-primary text-[#111811] text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-background-dark">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
