
import React, { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { Product, CartItem, CSContact, Variation, SiteSettings, Testimonial, Media } from './types';
import { dbService, DEFAULT_SETTINGS } from './services/dbService';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import ProductCard from './components/ProductCard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLogin from './pages/Admin/AdminLogin';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import { PrivacyPolicy, TermsOfService } from './pages/LegalPages';

// --- THEME COLORS MAPPING ---
export const THEME_COLORS: Record<string, string> = {
  'Green': '#13ec13',
  'Blue': '#2563eb',
  'Neutral': '#404040',
  'Orange': '#f97316',
  'Rose': '#f43f5e',
  'Violet': '#8b5cf6',
  'Yellow': '#facc15'
};

// --- THEME FONTS MAPPING ---
export const FONT_THEMES: Record<string, { heading: string, body: string }> = {
  'Default': { heading: "'Inter'", body: "'Inter'" },
  'Display 1': { heading: "'Playfair Display'", body: "'Inter'" },
  'Display 2': { heading: "'Playfair Display'", body: "'Plus Jakarta Sans'" },
  'Bold': { heading: "'Fraunces'", body: "'Space Grotesk'" },
  'Aesthetic 1': { heading: "'EB Garamond'", body: "'Carme'" },
  'Aesthetic 2': { heading: "'EB Garamond'", body: "'Inter'" }
};

// --- HELPER COMPONENTS ---

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product, variation?: Variation) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  updateCartQuantity: (productId: string, variationId: string, quantity: number) => void;
  clearCart: () => void;
  csContacts: CSContact[];
  testimonials: Testimonial[];
  siteSettings: SiteSettings;
  refreshData: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};

// --- SOCIAL PROOF POPUP ---
const SocialProofPopup = () => {
  const { products, siteSettings } = useStore();
  const [currentProof, setCurrentProof] = useState<{ name: string; product: Product; time: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const timeOptions = [
    'Baru saja', '1 menit yang lalu', '2 menit yang lalu', '5 menit yang lalu', 
    '15 menit yang lalu', '30 menit yang lalu', '1 jam yang lalu', 'Hari ini'
  ];

  const triggerNext = useCallback(() => {
    if (!siteSettings.isSocialProofEnabled || !siteSettings.socialProofNames) return;

    const names = siteSettings.socialProofNames.split('\n').filter(n => n.trim());
    if (names.length === 0) return;

    // Filter products based on selected IDs in admin
    const selectedProductIds = siteSettings.socialProofProductIds || [];
    let pool = products;
    if (selectedProductIds.length > 0) {
      pool = products.filter(p => selectedProductIds.includes(p.id));
    }
    
    if (pool.length === 0) return;

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomProduct = pool[Math.floor(Math.random() * pool.length)];
    const randomTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];

    setCurrentProof({ name: randomName, product: randomProduct, time: randomTime });
    setIsVisible(true);

    // Stay visible for 6 seconds
    setTimeout(() => {
      setIsVisible(false);
      // Wait for 15-30 seconds before next trigger
      const delay = Math.floor(Math.random() * 15000) + 15000;
      timeoutRef.current = window.setTimeout(triggerNext, delay);
    }, 6000);
  }, [products, siteSettings]);

  useEffect(() => {
    if (!siteSettings.isSocialProofEnabled) {
      setIsVisible(false);
      return;
    }

    // Initial start after 5 seconds
    const initialDelay = 5000;
    timeoutRef.current = window.setTimeout(triggerNext, initialDelay);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [siteSettings.isSocialProofEnabled, triggerNext]);

  if (!currentProof) return null;

  return (
    <div className={`fixed bottom-6 left-6 z-[200] max-w-[320px] transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
      <div className="bg-white dark:bg-[#1a2e1a] rounded-2xl p-3 shadow-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4 group">
        <div className="size-14 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-black/20 border border-gray-50 dark:border-gray-800">
           <img src={currentProof.product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div className="flex-1">
           <p className="text-xs font-black leading-tight mb-1">
             <span className="text-primary">{currentProof.name}</span> memilih <span className="text-gray-900 dark:text-white">{currentProof.product.name}</span>
           </p>
           <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-[12px] fill-current">history</span>
              {currentProof.time}
           </div>
        </div>
        <button onClick={() => setIsVisible(false)} className="size-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-300">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
};

// --- PROMOTION SECTION ---
const PromotionSection = ({ settings }: { settings: SiteSettings }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!settings.promoEndAt) return;
    
    const calculateTime = () => {
      const now = Date.now();
      const diff = settings.promoEndAt - now;
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTime());
    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(timer);
  }, [settings.promoEndAt]);

  if (!settings.promoTitle) return null;

  return (
    <section className="px-4 md:px-10 lg:px-40 py-12 flex justify-center">
      <div className="max-w-[1200px] w-full bg-gradient-to-br from-[#0c1a0c] to-[#050a05] rounded-[40px] p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 size-64 bg-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
        <div className="absolute bottom-0 left-0 size-64 bg-primary/5 blur-[100px] translate-y-1/2 -translate-x-1/2 rounded-full"></div>
        
        <div className="relative z-10 flex-1 text-center lg:text-left">
          <span className="inline-block text-primary font-black text-[10px] md:text-xs uppercase tracking-[0.3em] mb-4 drop-shadow-sm">{settings.promoLabel}</span>
          <h2 className="text-white text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter">
            {settings.promoTitle}
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed max-w-[500px] mx-auto lg:mx-0">
            {settings.promoSubtitle}
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-10 shrink-0">
          <div className="grid grid-cols-4 gap-3 md:gap-5">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds }
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="size-16 md:size-24 bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/10 shadow-lg">
                  <span className="text-white text-2xl md:text-5xl font-black tabular-nums">{unit.value.toString().padStart(2, '0')}</span>
                </div>
                <span className="text-gray-500 font-black uppercase text-[8px] md:text-[10px] tracking-widest">{unit.label}</span>
              </div>
            ))}
          </div>

          <Link 
            to="/products"
            className="w-full md:w-auto px-10 h-16 md:h-20 bg-primary text-[#111811] rounded-[24px] text-lg font-black flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-2xl shadow-primary/40 active:scale-95"
          >
            Claim Offer
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- PAGES ---

const HomePage: React.FC = () => {
  const { products, testimonials, siteSettings } = useStore();
  const featured = products.filter(p => p.isFeatured);
  const activeTestimonials = testimonials.filter(t => t.isActive);

  return (
    <div className="flex flex-col flex-1">
      <Hero />
      
      <section id="products" className="px-4 md:px-10 lg:px-40 py-20 flex justify-center">
        <div className="max-w-[1200px] w-full">
          <div className="flex items-end justify-between px-4 pb-8 border-b border-[#dbe6db] dark:border-[#2a3a2a]">
            <div>
              <h2 className="text-[#111811] dark:text-white text-3xl font-black leading-tight">Featured Selection</h2>
              <p className="text-[#618961] mt-2 font-medium">Quality Choices, Tailored for You</p>
            </div>
            <Link to="/products" className="text-primary font-black hover:underline mb-1 text-sm uppercase tracking-widest">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
            {featured.length > 0 ? (
              featured.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <p className="col-span-full text-center text-gray-500 py-20 font-medium">No featured products available.</p>
            )}
          </div>
        </div>
      </section>

      <PromotionSection settings={siteSettings} />

      <section className="px-4 md:px-10 lg:px-40 py-20 bg-background-light dark:bg-background-dark/50">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-4xl font-black mb-12 tracking-tight">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: 'local_shipping', title: 'Fast Delivery', desc: 'Ships within 24 hours' },
              { icon: 'verified_user', title: 'Quality Assured', desc: 'Handpicked premium items' },
              { icon: 'forum', title: 'Easy Order', desc: 'Quick checkout via WhatsApp' },
              { icon: 'support_agent', title: '24/7 Support', desc: 'Ready to help you anytime' }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-white dark:bg-[#1a2e1a] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-transform hover:-translate-y-2">
                <span className="material-symbols-outlined text-primary text-4xl mb-4">{item.icon}</span>
                <h3 className="text-xl font-black mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeTestimonials.length > 0 && (
        <section className="px-4 md:px-10 lg:px-40 py-24">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black tracking-tight mb-4">Happy Customers</h2>
              <p className="text-gray-500 font-medium">What they say about our products and services</p>
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
              {activeTestimonials.map((t) => (
                <div key={t.id} className="break-inside-avoid bg-white dark:bg-[#1a2e1a] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                  <img src={t.imageUrl} alt="Customer Review" className="w-full h-auto object-cover" loading="lazy" />
                  <div className="p-6 border-t border-gray-50 dark:border-gray-800 flex flex-col gap-3">
                    {t.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm italic leading-relaxed text-center font-medium">
                        "{t.description}"
                      </p>
                    )}
                    {t.customerName && (
                      <p className="font-black text-[10px] text-primary uppercase tracking-[0.2em] text-center border-t border-gray-100 dark:border-gray-800 pt-3">
                        {t.customerName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const ProductsPage: React.FC = () => {
  const { products } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000000); // 10jt default
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);

  const filteredAndSorted = useMemo(() => {
    return products
      .filter(p => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesPrice && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return b.createdAt - a.createdAt; // newest
      });
  }, [products, selectedCategory, minPrice, maxPrice, searchQuery, sortBy]);

  return (
    <div className="px-4 md:px-10 lg:px-40 py-20 flex justify-center flex-col items-center">
      <div className="max-w-[1200px] w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
           <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Semua Produk</h1>
              <p className="text-gray-500 font-medium">Menampilkan {filteredAndSorted.length} koleksi pilihan.</p>
           </div>
           
           <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 md:flex-none md:w-64">
                 <input 
                   type="text" 
                   placeholder="Cari produk..." 
                   className="w-full h-12 bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-gray-800 rounded-xl px-12 font-bold text-sm outline-none focus:border-primary transition-all"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
                 <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              </div>
              <button 
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className={`h-12 px-6 rounded-xl border-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${isFilterVisible ? 'bg-primary border-primary text-black' : 'bg-white dark:bg-black/20 border-gray-100 dark:border-gray-800 text-gray-500 hover:border-primary hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-lg">tune</span> 
                {isFilterVisible ? 'Tutup Filter' : 'Filter & Urutkan'}
              </button>
           </div>
        </div>

        {/* EXPANDABLE FILTER SECTION */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFilterVisible ? 'max-h-[1000px] mb-12 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
           <div className="bg-white dark:bg-black/20 rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-10">
              
              {/* Category Filter */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Kategori</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Rentang Harga (Rp)</h4>
                <div className="flex items-center gap-3">
                   <div className="flex-1">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        className="w-full h-11 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-gray-800 rounded-xl px-4 text-xs font-bold outline-none focus:border-primary"
                        value={minPrice}
                        onChange={e => setMinPrice(Number(e.target.value))}
                      />
                   </div>
                   <div className="w-4 h-0.5 bg-gray-300"></div>
                   <div className="flex-1">
                      <input 
                        type="number" 
                        placeholder="Max" 
                        className="w-full h-11 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-gray-800 rounded-xl px-4 text-xs font-bold outline-none focus:border-primary"
                        value={maxPrice}
                        onChange={e => setMaxPrice(Number(e.target.value))}
                      />
                   </div>
                </div>
                <div className="flex justify-between mt-3 px-1">
                   <button onClick={() => { setMinPrice(0); setMaxPrice(10000000); }} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Reset Harga</button>
                </div>
              </div>

              {/* Sorting */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Urutkan Berdasarkan</h4>
                <div className="flex flex-col gap-2">
                   {[
                     { id: 'newest', label: 'Terbaru', icon: 'new_releases' },
                     { id: 'price-low', label: 'Harga: Rendah ke Tinggi', icon: 'trending_down' },
                     { id: 'price-high', label: 'Harga: Tinggi ke Rendah', icon: 'trending_up' }
                   ].map(sort => (
                     <button 
                       key={sort.id} 
                       onClick={() => setSortBy(sort.id as any)}
                       className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${sortBy === sort.id ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                     >
                       <span className="material-symbols-outlined text-lg">{sort.icon}</span>
                       <span className="text-xs font-black uppercase tracking-widest">{sort.label}</span>
                     </button>
                   ))}
                </div>
              </div>

           </div>
        </div>

        {/* PRODUCTS GRID */}
        {filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
            {filteredAndSorted.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-gray-50 dark:bg-black/10 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
             <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
             <h3 className="text-xl font-black mb-2">Produk Tidak Ditemukan</h3>
             <p className="text-gray-400 font-medium">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
             <button onClick={() => { setSelectedCategory('All'); setMinPrice(0); setMaxPrice(10000000); setSearchQuery(''); }} className="mt-8 px-8 py-3 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">Reset Semua Filter</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetailPage: React.FC = () => {
  const { id } = useParams();
  const { products, addToCart } = useStore();
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [activeMedia, setActiveMedia] = useState<Media | null>(null);
  const product = products.find(p => p.id === id);

  useEffect(() => {
    if (product) {
      setSelectedVariation(product.variations[0] || null);
      setActiveMedia(product.coverMedia);
    }
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product || products.length === 0) return [];

    const otherProducts = products.filter(p => p.id !== product.id);
    
    // (1) Same Category + Similar Price (90% - 120%)
    const group1 = otherProducts.filter(p => 
      p.category === product.category && 
      p.price >= product.price * 0.9 && 
      p.price <= product.price * 1.2
    );

    // (2) Same Category (but price not in 90%-120% range)
    const group2 = otherProducts.filter(p => 
      p.category === product.category && 
      !group1.some(g => g.id === p.id)
    );

    // (3) Similar Price but Different Category
    const group3 = otherProducts.filter(p => 
      p.category !== product.category && 
      p.price >= product.price * 0.9 && 
      p.price <= product.price * 1.2
    );

    // Combine in priority order and unique
    const combined = [...group1, ...group2, ...group3];
    return combined.slice(0, 4);
  }, [product, products]);

  if (!product) return <div className="p-20 text-center font-bold">Produk tidak ditemukan.</div>;
  const currentPrice = selectedVariation ? selectedVariation.price : product.price;
  const currentOriginalPrice = selectedVariation?.originalPrice || (selectedVariation ? undefined : product.originalPrice);

  return (
    <div className="px-4 md:px-10 lg:px-40 py-20 flex justify-center flex-col items-center">
      <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="flex flex-col gap-4">
          <div className="aspect-square rounded-[32px] overflow-hidden bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800">
            {activeMedia?.type === 'video' ? (
              <video src={activeMedia.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <img src={activeMedia?.url || product.image} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {[product.coverMedia, ...product.gallery].map((m, i) => (
              <button key={i} onClick={() => setActiveMedia(m)} className={`size-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${activeMedia?.url === m.url ? 'border-primary' : 'border-transparent'}`}>
                {m.type === 'video' ? (
                   <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800"><span className="material-symbols-outlined text-primary">play_circle</span></div>
                ) : (
                   <img src={m.url} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4">{product.category}</span>
          <h1 className="text-4xl font-black mb-6 leading-tight">{product.name}</h1>
          <div className="flex flex-col mb-8">
            {currentOriginalPrice && currentOriginalPrice > currentPrice && (
              <p className="text-lg text-gray-400 line-through">Rp {currentOriginalPrice.toLocaleString('id-ID')}</p>
            )}
            <p className="text-4xl font-black text-primary">Rp {currentPrice.toLocaleString('id-ID')}</p>
          </div>
          <div className="mb-10">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Pilih Variasi</h4>
            <div className="flex flex-wrap gap-3">
              {product.variations.map(v => (
                <button key={v.id} onClick={() => setSelectedVariation(v)} className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all ${selectedVariation?.id === v.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => addToCart(product, selectedVariation || undefined)} className="w-full h-16 bg-primary text-black rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20">
            <span className="material-symbols-outlined font-black">add_shopping_cart</span> Tambah ke Keranjang
          </button>
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Deskripsi Produk</h4>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium whitespace-pre-line">{product.description}</p>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <div className="max-w-[1200px] w-full mt-32">
          <div className="flex items-center justify-between mb-10 border-b border-[#dbe6db] dark:border-[#2a3a2a] pb-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Produk Terkait</h2>
              <p className="text-gray-500 mt-2 font-medium">Lengkapi koleksi Anda dengan pilihan serupa.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

const AboutPage: React.FC = () => {
  const { siteSettings } = useStore();
  return (
    <div className="flex flex-col">
       <div className="bg-gray-50 dark:bg-black/20 py-20 px-4 md:px-10 lg:px-40 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-4">{siteSettings.aboutHeaderTitle}</h1>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium">{siteSettings.aboutHeaderDesc}</p>
       </div>
       <div className="px-4 md:px-10 lg:px-40 py-24 flex flex-col md:flex-row items-center gap-16 max-w-[1200px] mx-auto">
          <div className="flex-1">
             <h2 className="text-3xl font-black mb-6">{siteSettings.aboutSectionTitle}</h2>
             <p className="text-gray-500 leading-relaxed font-medium whitespace-pre-line">{siteSettings.aboutSectionDesc}</p>
          </div>
          <div className="flex-1 aspect-video md:aspect-square rounded-[40px] overflow-hidden shadow-2xl">
             <img src={siteSettings.aboutSectionImage} className="w-full h-full object-cover" />
          </div>
       </div>
    </div>
  );
};

const ContactPage: React.FC = () => {
  const { siteSettings } = useStore();
  return (
    <div className="px-4 md:px-10 lg:px-40 py-24 flex justify-center">
       <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div>
             <h1 className="text-4xl font-black mb-8">Hubungi Kami</h1>
             <p className="text-gray-500 mb-12 font-medium">Kami siap membantu Anda dengan pertanyaan atau pesanan Anda.</p>
             <div className="space-y-8">
                {[
                  { icon: 'mail', title: 'Email', value: siteSettings.contactEmail },
                  { icon: 'call', title: 'WhatsApp', value: siteSettings.contactPhone },
                  { icon: 'location_on', title: 'Alamat', value: siteSettings.contactAddress }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6">
                     <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">{item.icon}</span>
                     </div>
                     <div>
                        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">{item.title}</p>
                        <p className="font-bold text-lg">{item.value}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-white dark:bg-[#1a2e1a] p-10 rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800">
             <h3 className="text-2xl font-black mb-8">Media Sosial</h3>
             <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Instagram', url: siteSettings.instagramUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' },
                  { name: 'TikTok', url: siteSettings.tiktokUrl, icon: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png' },
                  { name: 'Facebook', url: siteSettings.facebookUrl, icon: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
                  { name: 'YouTube', url: siteSettings.youtubeUrl, icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' }
                ].filter(s => s.url).map((social, i) => (
                  <a key={i} href={social.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl hover:scale-105 transition-transform">
                     <img src={social.icon} className="size-6 grayscale dark:invert" />
                     <span className="font-bold text-sm">{social.name}</span>
                  </a>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [csContacts, setCsContacts] = useState<CSContact[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshData = useCallback(async () => {
    const [p, cs, s, t] = await Promise.all([
      dbService.getProducts(),
      dbService.getCSContacts(),
      dbService.getSiteSettings(),
      dbService.getTestimonials()
    ]);
    setProducts(p);
    setCsContacts(cs);
    setSiteSettings(s);
    setTestimonials(t);
  }, []);

  useEffect(() => {
    refreshData();
    const savedCart = localStorage.getItem('lumina_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, [refreshData]);

  useEffect(() => {
    localStorage.setItem('lumina_cart', JSON.stringify(cart));
  }, [cart]);

  // Apply visual themes when settings change
  useEffect(() => {
    const color = THEME_COLORS[siteSettings.themeColor] || THEME_COLORS['Green'];
    // FIX: Gunakan --primary bukan --color-primary agar sesuai dengan konfigurasi Tailwind di index.html
    document.documentElement.style.setProperty('--primary', color);
    
    const fonts = FONT_THEMES[siteSettings.themeFont] || FONT_THEMES['Default'];
    document.documentElement.style.setProperty('--font-heading', fonts.heading);
    document.documentElement.style.setProperty('--font-body', fonts.body);
    
    if (siteSettings.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = siteSettings.faviconUrl;
    }
    document.title = siteSettings.siteName;
  }, [siteSettings]);

  const addToCart = (product: Product, variation?: Variation) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.id === product.id && 
        item.selectedVariation?.id === variation?.id
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex].quantity += 1;
        return next;
      }
      return [...prev, { ...product, quantity: 1, selectedVariation: variation }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && item.selectedVariation?.id === variationId)
    ));
  };

  const updateCartQuantity = (productId: string, variationId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId, variationId);
    setCart(prev => prev.map(item => 
      (item.id === productId && (item.selectedVariation?.id === variationId || (!item.selectedVariation && !variationId))) 
      ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const value = {
    products, cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
    csContacts, testimonials, siteSettings, refreshData, isCartOpen, setIsCartOpen
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <Router>
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#111811] dark:text-white transition-colors">
          <ScrollToTop />
          <HeaderWrapper />
          <main className="flex flex-col min-h-[calc(100vh-80px-400px)]">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
            </Routes>
          </main>
          <Footer />
          <CartSidebarWrapper />
          <SocialProofPopup />
          <WhatsAppFloatingButton />
        </div>
      </Router>
    </StoreProvider>
  );
};

const HeaderWrapper = () => {
  const { cart, setIsCartOpen } = useStore();
  return <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} />;
};

const CartSidebarWrapper = () => {
  const { isCartOpen, setIsCartOpen } = useStore();
  return <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />;
};

export default App;
