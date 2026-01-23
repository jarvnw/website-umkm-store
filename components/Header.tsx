
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../App';

interface HeaderProps {
  onCartOpen: () => void;
  cartCount: number;
}

const Header: React.FC<HeaderProps> = ({ onCartOpen, cartCount }) => {
  const { siteSettings } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#dbe6db] dark:border-[#2a3a2a] px-4 md:px-10 lg:px-40 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-10">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center size-10 rounded-xl bg-gray-50 dark:bg-[#1a2e1a] hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

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
            <h1 className="text-xl font-black tracking-tight hidden sm:block">{siteSettings.siteName}</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`text-sm font-semibold transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary' : 'text-[#111811] dark:text-white'}`}
              >
                {link.name}
              </Link>
            ))}
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

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMobileMenu}
      />
      
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-background-dark shadow-2xl z-[101] transform transition-transform duration-300 md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
             {siteSettings.logoUrl ? (
                <img src={siteSettings.logoUrl} alt={siteSettings.siteName} className="h-6 w-auto object-contain" />
              ) : (
                <div className="size-6 text-primary">
                   <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                     <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                   </svg>
                 </div>
              )}
              <h2 className="font-black text-lg">{siteSettings.siteName}</h2>
          </div>
          <button onClick={closeMobileMenu} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={closeMobileMenu}
                className={`px-8 py-4 text-lg font-black uppercase tracking-tight transition-all border-l-4 ${location.pathname === link.path ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-900'}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <Link 
            to="/admin/login" 
            onClick={closeMobileMenu}
            className="flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            Panel Admin
          </Link>
        </div>
      </div>
    </>
  );
};

export default Header;
