
import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../App';

const Footer: React.FC = () => {
  const { siteSettings } = useStore();

  return (
    <footer className="bg-white dark:bg-background-dark border-t border-[#dbe6db] dark:border-[#2a3a2a] px-4 md:px-10 lg:px-40 py-20">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
        {/* Kolom 1: Branding & Deskripsi */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            {siteSettings.logoUrl ? (
              <img src={siteSettings.logoUrl} alt={siteSettings.siteName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="size-8 text-primary">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                </svg>
              </div>
            )}
            <h2 className="text-xl font-black">{siteSettings.siteName}</h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            {siteSettings.footerDescription}
          </p>
        </div>
        
        {/* Kolom 2: Navigasi Utama */}
        <div className="md:pl-10">
          <h4 className="font-black mb-8 uppercase tracking-widest text-xs text-primary">Navigasi</h4>
          <ul className="flex flex-col gap-4 text-sm font-bold text-gray-500">
            <li><Link to="/" className="hover:text-primary transition-colors">Beranda</Link></li>
            <li><Link to="/products" className="hover:text-primary transition-colors">Semua Produk</Link></li>
            <li><Link to="/about" className="hover:text-primary transition-colors">Tentang Kami</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-colors">Kontak</Link></li>
          </ul>
        </div>
        
        {/* Kolom 3: Internal & Admin */}
        <div className="md:pl-10">
          <h4 className="font-black mb-8 uppercase tracking-widest text-xs text-primary">Legal & Admin</h4>
          <ul className="flex flex-col gap-4 text-sm font-bold text-gray-500">
            <li>
              <Link to="/admin/login" className="hover:text-primary transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                Panel Admin
              </Link>
            </li>
            <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
            <li><Link to="/terms-of-service" className="hover:text-primary transition-colors">Syarat dan Ketentuan</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1200px] mx-auto mt-20 pt-8 border-t border-gray-50 dark:border-gray-800 text-center md:text-left text-xs text-gray-400 font-bold">
        © 2024 {siteSettings.siteName}. Crafted for modern lifestyle.
      </div>
    </footer>
  );
};

export default Footer;
