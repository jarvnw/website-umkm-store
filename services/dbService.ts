
import { Product, CSContact, SiteSettings, Testimonial, AdminCredentials } from '../types';

const NEON_API_URL = process.env.VITE_NEON_API_URL || '';
const NEON_API_KEY = process.env.VITE_NEON_API_KEY || '';

const PRODUCTS_KEY = 'lumina_products';
const CS_KEY = 'lumina_cs_contacts';
const TESTIMONIALS_KEY = 'lumina_testimonials';
const SITE_SETTINGS_KEY = 'lumina_site_settings';
const ADMIN_KEY = 'lumina_admin_creds';

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'LuminaGoods',
  logoUrl: '',
  heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000',
  heroTitle: 'Elegance in Every Detail.',
  heroSubtitle: 'Discover premium goods curated for those who appreciate high-quality craftsmanship and modern minimalist design.',
  footerDescription: 'Crafting a seamless shopping experience for the modern aesthetic. Your one-stop shop for premium, artisanal UMKM goods.'
};

async function apiFetch(endpoint: string, options?: RequestInit) {
  if (!NEON_API_URL) return null;
  
  try {
    const res = await fetch(`${NEON_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(NEON_API_KEY ? { 'Authorization': `Bearer ${NEON_API_KEY}` } : {}),
        ...options?.headers
      }
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Neon API Error:', e);
    return null;
  }
}

export const dbService = {
  async getProducts(): Promise<Product[]> {
    const apiData = await apiFetch('/products');
    if (apiData) return apiData;
    
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async saveProduct(product: Product): Promise<void> {
    await apiFetch('/products', { method: 'POST', body: JSON.stringify(product) });
    
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) products[index] = product;
    else products.push(product);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  async deleteProduct(id: string): Promise<void> {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    const products = await this.getProducts();
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products.filter(p => p.id !== id)));
  },

  async getCSContacts(): Promise<CSContact[]> {
    const apiData = await apiFetch('/cs-contacts');
    if (apiData) return apiData;
    
    const data = localStorage.getItem(CS_KEY);
    return data ? JSON.parse(data) : [{ id: '1', name: 'Admin CS', phoneNumber: '6281234567890', isActive: true }];
  },

  async saveCSContact(contact: CSContact): Promise<void> {
    await apiFetch('/cs-contacts', { method: 'POST', body: JSON.stringify(contact) });
    const contacts = await this.getCSContacts();
    const index = contacts.findIndex(c => c.id === contact.id);
    if (index >= 0) contacts[index] = contact;
    else contacts.push(contact);
    localStorage.setItem(CS_KEY, JSON.stringify(contacts));
  },

  async deleteCSContact(id: string): Promise<void> {
    await apiFetch(`/cs-contacts/${id}`, { method: 'DELETE' });
    const contacts = await this.getCSContacts();
    localStorage.setItem(CS_KEY, JSON.stringify(contacts.filter(c => c.id !== id)));
  },

  async getTestimonials(): Promise<Testimonial[]> {
    const apiData = await apiFetch('/testimonials');
    if (apiData) return apiData;
    
    const data = localStorage.getItem(TESTIMONIALS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async saveTestimonial(testimonial: Testimonial): Promise<void> {
    await apiFetch('/testimonials', { method: 'POST', body: JSON.stringify(testimonial) });
    const testimonials = await this.getTestimonials();
    const index = testimonials.findIndex(t => t.id === testimonial.id);
    if (index >= 0) testimonials[index] = testimonial;
    else testimonials.push(testimonial);
    localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(testimonials));
  },

  async deleteTestimonial(id: string): Promise<void> {
    await apiFetch(`/testimonials/${id}`, { method: 'DELETE' });
    const testimonials = await this.getTestimonials();
    localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(testimonials.filter(t => t.id !== id)));
  },

  async getSiteSettings(): Promise<SiteSettings> {
    const apiData = await apiFetch('/settings');
    if (apiData) return apiData;
    
    const data = localStorage.getItem(SITE_SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  async saveSiteSettings(settings: SiteSettings): Promise<void> {
    await apiFetch('/settings', { method: 'POST', body: JSON.stringify(settings) });
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
  },

  async getAdminCredentials(): Promise<AdminCredentials> {
    const apiData = await apiFetch('/admin-auth');
    if (apiData) return apiData;
    
    const data = localStorage.getItem(ADMIN_KEY);
    return data ? JSON.parse(data) : { username: 'admin', password: 'admin123' };
  },

  async saveAdminCredentials(creds: AdminCredentials): Promise<void> {
    await apiFetch('/admin-auth', { method: 'POST', body: JSON.stringify(creds) });
    localStorage.setItem(ADMIN_KEY, JSON.stringify(creds));
  }
};
