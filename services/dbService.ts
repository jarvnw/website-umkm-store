
import { Product, CSContact, SiteSettings, Testimonial, AdminCredentials, FAQ, BenefitItem } from '../types';

const PRODUCTS_KEY = 'lumina_products';
const CS_KEY = 'lumina_cs_contacts';
const TESTIMONIALS_KEY = 'lumina_testimonials';
const FAQS_KEY = 'lumina_faqs';
const BENEFITS_KEY = 'lumina_benefit_items';
const SITE_SETTINGS_KEY = 'lumina_site_settings';
const ADMIN_KEY = 'lumina_admin_creds';

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'LuminaGoods',
  logoUrl: '',
  faviconUrl: '',
  themeColor: 'Green',
  themeFont: 'Default',
  heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000',
  heroTitle: 'Elegance in Every Detail.',
  heroSubtitle: 'Koleksi produk UMKM berkualitas tinggi.',
  footerDescription: 'Toko UMKM modern dengan kualitas premium.',
  aboutHeaderTitle: 'Cerita Kami',
  aboutHeaderDesc: 'Kami hadir untuk mendukung produk lokal.',
  aboutSectionTitle: 'Kualitas Terjamin',
  aboutSectionDesc: 'Setiap produk dipilih dengan teliti.',
  aboutSectionImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1200',
  contactEmail: 'halo@umkm.id',
  contactPhone: '6281234567890',
  contactAddress: 'Indonesia',
  instagramUrl: '', tiktokUrl: '', facebookUrl: '', youtubeUrl: '',
  promoLabel: 'LIMITED TIME OFFER',
  promoTitle: '',
  promoSubtitle: '',
  promoEndAt: 0,
  // Social Proof Defaults
  isSocialProofEnabled: false,
  socialProofNames: 'Budi\nSiti\nAndi\nRina\nDewi\nJoko\nLani',
  socialProofProductIds: [],
  // Home Section Titles Defaults
  featuredTitle: 'Featured Selection',
  featuredSubtitle: 'Quality Choices, Tailored for You',
  benefitsTitle: 'Mengapa Memilih Kami',
  benefitsSubtitle: 'Keunggulan layanan dan produk kami untuk kepuasan Anda.',
  testimonialsTitle: 'Happy Customers',
  testimonialsSubtitle: 'What they say about our products and services',
  faqsTitle: 'Pertanyaan Umum',
  faqsSubtitle: 'Hal-hal yang sering ditanyakan pelanggan kami.',
  contactTitle: 'Hubungi Kami',
  contactSubtitle: 'Kami siap membantu Anda dengan pertanyaan atau pesanan Anda.',
  // Navigation Labels Defaults
  navHome: 'Home',
  navProducts: 'Products',
  navAbout: 'About Us',
  navContact: 'Contact'
};

export const dbService = {
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`/api/products?cb=${Date.now()}`);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const text = await response.text();
      try {
        const rows = JSON.parse(text);
        const formatted = rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          price: Number(r.price),
          originalPrice: r.original_price ? Number(r.original_price) : undefined,
          category: r.category,
          image: r.image,
          coverMedia: typeof r.cover_media === 'string' ? JSON.parse(r.cover_media) : r.cover_media,
          gallery: typeof r.gallery === 'string' ? JSON.parse(r.gallery) : r.gallery,
          variations: typeof r.variations === 'string' ? JSON.parse(r.variations) : r.variations,
          isFeatured: Boolean(r.is_featured),
          createdAt: Number(r.created_at)
        }));
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(formatted));
        return formatted;
      } catch (parseError) {
        console.error('JSON Parse Error in getProducts. Response was:', text.substring(0, 500));
        throw parseError;
      }
    } catch (e) {
      console.error('API GetProducts Error:', e);
      return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    }
  },

  async saveProduct(p: Product): Promise<void> {
    const local = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const idx = local.findIndex((item: any) => item.id === p.id);
    if (idx >= 0) local[idx] = p; else local.push(p);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(local));

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    if (!response.ok) throw new Error('Failed to save product');
  },

  async deleteProduct(id: string): Promise<void> {
    const local = localStorage.getItem(PRODUCTS_KEY);
    if (local) {
      const filtered = JSON.parse(local).filter((p: any) => p.id !== id);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
    }
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
  },

  async getCSContacts(): Promise<CSContact[]> {
    try {
      const response = await fetch('/api/cs_contacts');
      if (!response.ok) throw new Error('API Error');
      const rows = await response.json();
      const formatted = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        phoneNumber: r.phone_number,
        isActive: Boolean(r.is_active)
      }));
      localStorage.setItem(CS_KEY, JSON.stringify(formatted));
      return formatted;
    } catch (e) {
      return JSON.parse(localStorage.getItem(CS_KEY) || '[]');
    }
  },

  async saveCSContact(c: CSContact): Promise<void> {
    const response = await fetch('/api/cs_contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
    if (!response.ok) throw new Error('Failed to save CS contact');
  },

  async deleteCSContact(id: string): Promise<void> {
    await fetch(`/api/cs_contacts/${id}`, { method: 'DELETE' });
  },

  async getTestimonials(): Promise<Testimonial[]> {
    try {
      const response = await fetch('/api/testimonials');
      if (!response.ok) throw new Error('API Error');
      const rows = await response.json();
      const formatted = rows.map((r: any) => ({
        id: r.id,
        imageUrl: r.image_url,
        customerName: r.customer_name,
        description: r.description,
        isActive: Boolean(r.is_active)
      }));
      localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(formatted));
      return formatted;
    } catch (e) {
      return JSON.parse(localStorage.getItem(TESTIMONIALS_KEY) || '[]');
    }
  },

  async saveTestimonial(t: Testimonial): Promise<void> {
    const local = JSON.parse(localStorage.getItem(TESTIMONIALS_KEY) || '[]');
    const idx = local.findIndex((item: any) => item.id === t.id);
    if (idx >= 0) local[idx] = t; else local.push(t);
    localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(local));

    const response = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t)
    });
    if (!response.ok) throw new Error('Failed to save testimonial');
  },

  async deleteTestimonial(id: string): Promise<void> {
    const local = localStorage.getItem(TESTIMONIALS_KEY);
    if (local) {
      const filtered = JSON.parse(local).filter((t: any) => t.id !== id);
      localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(filtered));
    }
    await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
  },

  async getFaqs(): Promise<FAQ[]> {
    try {
      const response = await fetch('/api/faqs');
      if (!response.ok) throw new Error('API Error');
      const rows = await response.json();
      const formatted = rows.map((r: any) => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        isActive: Boolean(r.is_active),
        sortOrder: Number(r.sort_order),
        createdAt: Number(r.created_at)
      }));
      localStorage.setItem(FAQS_KEY, JSON.stringify(formatted));
      return formatted;
    } catch (e) {
      return JSON.parse(localStorage.getItem(FAQS_KEY) || '[]');
    }
  },

  async saveFaq(f: FAQ): Promise<void> {
    const local = JSON.parse(localStorage.getItem(FAQS_KEY) || '[]');
    const idx = local.findIndex((item: any) => item.id === f.id);
    if (idx >= 0) local[idx] = f; else local.push(f);
    localStorage.setItem(FAQS_KEY, JSON.stringify(local));

    const response = await fetch('/api/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f)
    });
    if (!response.ok) throw new Error('Failed to save FAQ');
  },

  async deleteFaq(id: string): Promise<void> {
    const local = localStorage.getItem(FAQS_KEY);
    if (local) {
      const filtered = JSON.parse(local).filter((f: any) => f.id !== id);
      localStorage.setItem(FAQS_KEY, JSON.stringify(filtered));
    }
    await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
  },

  async getBenefitItems(): Promise<BenefitItem[]> {
    try {
      const response = await fetch('/api/benefit_items');
      if (!response.ok) throw new Error('API Error');
      const rows = await response.json();
      const formatted = rows.map((r: any) => ({
        id: r.id,
        icon: r.icon,
        title: r.title,
        subtitle: r.subtitle,
        isActive: Boolean(r.is_active),
        sortOrder: Number(r.sort_order)
      }));
      localStorage.setItem(BENEFITS_KEY, JSON.stringify(formatted));
      return formatted;
    } catch (e) {
      return JSON.parse(localStorage.getItem(BENEFITS_KEY) || '[]');
    }
  },

  async saveBenefitItem(b: BenefitItem): Promise<void> {
    const local = JSON.parse(localStorage.getItem(BENEFITS_KEY) || '[]');
    const idx = local.findIndex((item: any) => item.id === b.id);
    if (idx >= 0) local[idx] = b; else local.push(b);
    localStorage.setItem(BENEFITS_KEY, JSON.stringify(local));

    const response = await fetch('/api/benefit_items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b)
    });
    if (!response.ok) throw new Error('Failed to save benefit item');
  },

  async getSiteSettings(): Promise<SiteSettings> {
    try {
      const response = await fetch('/api/site_settings');
      if (response.ok) {
        const settings = await response.json();
        localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
        return settings;
      }
    } catch (e) {}
    return JSON.parse(localStorage.getItem(SITE_SETTINGS_KEY) || JSON.stringify(DEFAULT_SETTINGS));
  },

  async saveSiteSettings(settings: SiteSettings): Promise<void> {
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
    const response = await fetch('/api/site_settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to save site settings');
  },

  async getAdminCredentials(): Promise<AdminCredentials> {
    try {
      const response = await fetch('/api/admin_auth');
      if (response.ok) return await response.json();
    } catch (e) {}
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || JSON.stringify({ username: 'admin', password: 'admin123' }));
  },

  async saveAdminCredentials(creds: AdminCredentials): Promise<void> {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(creds));
    const response = await fetch('/api/admin_auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    if (!response.ok) throw new Error('Failed to save admin credentials');
  }
};
