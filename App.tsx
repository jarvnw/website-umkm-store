
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
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
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filtered = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);

  return (
    <div className="px-4 md:px-10 lg:px-40 py-20 flex justify-center flex-col items-center">
      <div className="max-w-[1200px] w-full">
        <h1 className="text-4xl font-black mb-8">Semua Produk</h1>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
          {filtered.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
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

  if (!product) return <div className="p-20 text-center font-bold">Produk tidak ditemukan.</div>;
  const currentPrice = selectedVariation ? selectedVariation.price : product.price;
  const currentOriginalPrice = selectedVariation?.originalPrice || (selectedVariation ? undefined : product.originalPrice);

  return (
    <div className="px-4 md:px-10 lg:px-40 py-20 flex justify-center">
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
    document.documentElement.style.setProperty('--color-primary', color);
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
