
import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Product, CartItem, CSContact, UserInfo, Variation, SiteSettings, Testimonial } from './types';
import { dbService, DEFAULT_SETTINGS } from './services/dbService';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import ProductCard from './components/ProductCard';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLogin from './pages/Admin/AdminLogin';
import { PrivacyPolicy, TermsOfService } from './pages/LegalPages';

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

// --- PAGES ---

const HomePage: React.FC = () => {
  const { products, testimonials } = useStore();
  const featured = products.filter(p => p.isFeatured);
  const activeTestimonials = testimonials.filter(t => t.isActive);

  return (
    <div className="flex flex-col flex-1">
      <Hero />
      
      <section id="products" className="px-4 md:px-10 lg:px-40 py-20 flex justify-center">
        <div className="max-w-[1200px] w-full">
          <div className="flex items-end justify-between px-4 pb-8 border-b border-[#dbe6db] dark:border-[#2a3a2a]">
            <div>
              <h2 className="text-[#111811] dark:text-white text-3xl font-bold leading-tight">Featured Selection</h2>
              <p className="text-[#618961] mt-2">Curated quality for your lifestyle</p>
            </div>
            <Link to="/products" className="text-primary font-bold hover:underline mb-1">View All</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
            {featured.length > 0 ? (
              featured.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <p className="col-span-full text-center text-gray-500 py-20">No featured products available.</p>
            )}
          </div>
        </div>
      </section>

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
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
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
                  {t.customerName && (
                    <div className="p-4 border-t border-gray-50 dark:border-gray-800">
                      <p className="font-black text-sm text-primary uppercase tracking-widest text-center">{t.customerName}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, addToCart } = useStore();
  const product = products.find(p => p.id === id);
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [activeMedia, setActiveMedia] = useState<number>(0);

  useEffect(() => {
    if (product && product.variations?.length > 0) {
      setSelectedVar(product.variations[0]);
    }
  }, [product]);

  if (!product) return <div className="p-20 text-center">Product not found.</div>;

  const allMedia = [product.coverMedia, ...(product.gallery || [])].filter(m => m && m.url);

  return (
    <div className="px-4 md:px-10 lg:px-40 py-20 flex justify-center">
      <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl overflow-hidden aspect-square bg-gray-50 dark:bg-black/20 relative border border-gray-100 dark:border-gray-800">
            {allMedia[activeMedia]?.type === 'video' ? (
              <video src={allMedia[activeMedia].url} className="w-full h-full object-cover" controls autoPlay loop muted />
            ) : (
              <img src={allMedia[activeMedia]?.url || product.image} alt={product.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="grid grid-cols-5 gap-4">
            {allMedia.map((m, i) => (
              <button 
                key={i} 
                onClick={() => setActiveMedia(i)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeMedia === i ? 'border-primary' : 'border-transparent'}`}
              >
                {m.type === 'video' ? (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs">play_circle</span>
                  </div>
                ) : (
                  <img src={m.url} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-primary font-black text-sm tracking-widest uppercase mb-4">{product.category}</span>
          <h1 className="text-5xl font-black mb-8 leading-tight tracking-tight">{product.name}</h1>
          
          <p className="text-4xl font-black text-primary mb-10">
            Rp {(selectedVar?.price || product.price).toLocaleString('id-ID')}
          </p>

          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-10 text-lg">{product.description}</p>

          {product.variations?.length > 0 && (
            <div className="mb-10">
              <h4 className="text-sm font-black uppercase tracking-widest mb-4">Choose Variation</h4>
              <div className="flex flex-wrap gap-3">
                {product.variations.map(v => (
                  <button 
                    key={v.id}
                    onClick={() => setSelectedVar(v)}
                    className={`px-6 py-3 rounded-xl font-bold border-2 transition-all ${selectedVar?.id === v.id ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 dark:border-gray-800'}`}
                  >
                    {v.name} {v.stock > 0 ? '' : '(Out of Stock)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={() => addToCart(product, selectedVar || undefined)}
            disabled={selectedVar && selectedVar.stock <= 0}
            className="flex items-center justify-center gap-4 bg-primary text-[#111811] h-16 rounded-2xl text-xl font-black hover:scale-105 transition-all shadow-2xl shadow-primary/20 disabled:opacity-50 disabled:scale-100"
          >
            <span className="material-symbols-outlined font-black">add_shopping_cart</span>
            Add to Shopping Cart
          </button>
        </div>
      </div>
    </div>
  );
};

const AboutPage: React.FC = () => {
  const { siteSettings } = useStore();
  return (
    <div className="flex flex-col items-center">
      <section className="w-full bg-primary/10 py-32 px-4 md:px-10 lg:px-40 flex justify-center text-center">
        <div className="max-w-[800px]">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">{siteSettings.aboutHeaderTitle}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
            {siteSettings.aboutHeaderDesc}
          </p>
        </div>
      </section>
      <section className="max-w-[1200px] w-full px-4 md:px-10 lg:px-40 py-24 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <div><img src={siteSettings.aboutSectionImage} className="rounded-3xl shadow-2xl w-full object-cover aspect-video md:aspect-square" alt="About Section" /></div>
        <div className="flex flex-col gap-6">
          <h2 className="text-4xl font-black tracking-tight">{siteSettings.aboutSectionTitle}</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg whitespace-pre-line">{siteSettings.aboutSectionDesc}</p>
        </div>
      </section>
    </div>
  );
};

const ContactPage: React.FC = () => {
  const { siteSettings } = useStore();

  return (
    <div className="px-4 md:px-10 lg:px-40 py-24 flex justify-center">
      <div className="max-w-[1000px] w-full text-center">
        <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Get in Touch</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-16 max-w-[700px] mx-auto">
          We're here to help! Connect with us through any of these platforms or visit us at our office.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
           {/* Phone */}
           <div className="bg-white dark:bg-[#1a2e1a] p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all">
              <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">call</span>
              </div>
              <h4 className="font-black text-xl mb-2">Phone</h4>
              <p className="text-gray-500 font-bold">{siteSettings.contactPhone}</p>
           </div>
           
           {/* Email */}
           <div className="bg-white dark:bg-[#1a2e1a] p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all">
              <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">mail</span>
              </div>
              <h4 className="font-black text-xl mb-2">Email</h4>
              <p className="text-gray-500 font-bold">{siteSettings.contactEmail}</p>
           </div>

           {/* Location */}
           <div className="bg-white dark:bg-[#1a2e1a] p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all">
              <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">location_on</span>
              </div>
              <h4 className="font-black text-xl mb-2">Address</h4>
              <p className="text-gray-500 font-bold">{siteSettings.contactAddress}</p>
           </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <h3 className="text-2xl font-black tracking-tight uppercase tracking-widest text-xs text-primary">Find Us on Social Media</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {siteSettings.instagramUrl && (
              <a href={siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="size-14 rounded-2xl bg-white dark:bg-[#1a2e1a] border border-gray-100 dark:border-gray-800 flex items-center justify-center hover:scale-110 transition-transform shadow-sm">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" className="size-6 grayscale hover:grayscale-0 transition-all" alt="Instagram" />
              </a>
            )}
            {siteSettings.tiktokUrl && (
              <a href={siteSettings.tiktokUrl} target="_blank" rel="noopener noreferrer" className="size-14 rounded-2xl bg-white dark:bg-[#1a2e1a] border border-gray-100 dark:border-gray-800 flex items-center justify-center hover:scale-110 transition-transform shadow-sm">
                <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" className="size-6 grayscale hover:grayscale-0 transition-all" alt="TikTok" />
              </a>
            )}
            {siteSettings.facebookUrl && (
              <a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="size-14 rounded-2xl bg-white dark:bg-[#1a2e1a] border border-gray-100 dark:border-gray-800 flex items-center justify-center hover:scale-110 transition-transform shadow-sm">
                <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" className="size-6 grayscale hover:grayscale-0 transition-all" alt="Facebook" />
              </a>
            )}
            {siteSettings.youtubeUrl && (
              <a href={siteSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="size-14 rounded-2xl bg-white dark:bg-[#1a2e1a] border border-gray-100 dark:border-gray-800 flex items-center justify-center hover:scale-110 transition-transform shadow-sm">
                <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" className="size-6 grayscale hover:grayscale-0 transition-all" alt="YouTube" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsPage: React.FC = () => {
  const { products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  // Mendapatkan kategori unik dari produk
  const categories = useMemo(() => {
    const cats = products.map(p => p.category);
    return ['All', ...Array.from(new Set(cats))];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchMinPrice = minPrice === '' || p.price >= Number(minPrice);
      const matchMaxPrice = maxPrice === '' || p.price <= Number(maxPrice);
      
      return matchSearch && matchCategory && matchMinPrice && matchMaxPrice;
    });

    // Sorting
    if (sortBy === 'price-low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'newest') result.sort((a, b) => b.createdAt - a.createdAt);

    return result;
  }, [products, searchTerm, selectedCategory, minPrice, maxPrice, sortBy]);

  return (
    <div className="px-4 md:px-10 lg:px-40 py-20">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col gap-10 mb-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <h1 className="text-4xl font-black uppercase tracking-tighter">Collections</h1>
            <div className="relative w-full md:w-96 group">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
              <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Search products..." 
                className="w-full pl-14 pr-6 h-14 bg-white dark:bg-[#1a2e1a] border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:border-primary transition-all font-medium" 
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-6 p-8 bg-white dark:bg-[#1a2e1a] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 mr-2">Category:</span>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${selectedCategory === cat ? 'bg-primary border-primary text-black' : 'border-gray-100 dark:border-gray-800 hover:border-primary text-gray-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-50 dark:border-gray-800">
               <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sort By</label>
                 <select 
                    className="h-12 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none font-bold text-sm px-4 cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                 >
                   <option value="newest">Latest Products</option>
                   <option value="price-low">Price: Low to High</option>
                   <option value="price-high">Price: High to Low</option>
                 </select>
               </div>
               
               <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Min Price (Rp)</label>
                 <input 
                    type="number" 
                    placeholder="0" 
                    className="h-12 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none font-bold text-sm px-4" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                 />
               </div>

               <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Max Price (Rp)</label>
                 <input 
                    type="number" 
                    placeholder="Unlimited" 
                    className="h-12 rounded-xl bg-gray-50 dark:bg-black/20 border-none outline-none font-bold text-sm px-4" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                 />
               </div>
            </div>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filtered.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 gap-4 text-gray-400">
            <span className="material-symbols-outlined text-6xl">search_off</span>
            <p className="font-bold text-xl">No products found matching your criteria.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setMinPrice(''); setMaxPrice(''); }}
              className="text-primary font-black uppercase tracking-widest text-xs hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [csContacts, setCSContacts] = useState<CSContact[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [p, c, s, t] = await Promise.all([
        dbService.getProducts(), 
        dbService.getCSContacts(),
        dbService.getSiteSettings(),
        dbService.getTestimonials()
      ]);
      setProducts(p || []);
      setCSContacts(c || []);
      if (s) setSiteSettings(s);
      setTestimonials(t || []);
    } catch (e) {
      console.error("Gagal memuat data:", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const savedCart = localStorage.getItem('lumina_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        localStorage.removeItem('lumina_cart');
      }
    }
  }, [fetchData]);

  useEffect(() => {
    localStorage.setItem('lumina_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, variation?: Variation) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedVariation?.id === variation?.id);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedVariation?.id === variation?.id) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, selectedVariation: variation, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedVariation?.id === variationId)));
  };

  const updateCartQuantity = (productId: string, variationId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId, variationId);
    setCart(prev => prev.map(item => (item.id === productId && item.selectedVariation?.id === variationId) ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  return (
    <StoreContext.Provider value={{ 
      products, cart, addToCart, removeFromCart, updateCartQuantity, 
      clearCart, csContacts, testimonials, siteSettings, refreshData: fetchData, isCartOpen, setIsCartOpen 
    }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
          <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
      </Router>
    </StoreContext.Provider>
  );
};

export default App;
