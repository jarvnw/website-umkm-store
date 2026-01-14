
import { Product, CSContact, SiteSettings, Testimonial, AdminCredentials } from '../types';
import { neon } from '@neondatabase/serverless';

const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key] || '';
    if (typeof process !== 'undefined' && process.env) return process.env[key] || '';
  } catch (e) {}
  return '';
};

/**
 * KONFIGURASI KONEKSI NEON
 */
const NEON_HOST = getEnv('VITE_NEON_API_URL')
  .replace('https://', '')
  .replace('postgres://', '')
  .replace('postgresql://', '')
  .split('@').pop()!
  .replace('-pooler', '')
  .split('/')[0];

const NEON_PASSWORD = getEnv('VITE_NEON_API_KEY');

const connectionString = NEON_HOST && NEON_PASSWORD 
  ? `postgres://neondb_owner:${NEON_PASSWORD}@${NEON_HOST}/neondb?sslmode=require`
  : '';

const sql = connectionString ? neon(connectionString) : null;

const PRODUCTS_KEY = 'lumina_products';
const CS_KEY = 'lumina_cs_contacts';
const TESTIMONIALS_KEY = 'lumina_testimonials';
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
  socialProofProductIds: []
};

export const dbService = {
  async getProducts(): Promise<Product[]> {
    if (!sql) return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    try {
      const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
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
    } catch (e) {
      console.error('Neon GetProducts Error:', e);
      return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    }
  },

  async saveProduct(p: Product): Promise<void> {
    const local = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const idx = local.findIndex((item: any) => item.id === p.id);
    if (idx >= 0) local[idx] = p; else local.push(p);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(local));

    if (!sql) return;

    try {
      await sql`
        INSERT INTO products (id, name, description, price, original_price, category, image, cover_media, gallery, variations, is_featured, created_at)
        VALUES (
          ${p.id}, ${p.name}, ${p.description}, ${p.price}, ${p.originalPrice || null}, ${p.category}, ${p.image}, 
          ${JSON.stringify(p.coverMedia)}, ${JSON.stringify(p.gallery)}, ${JSON.stringify(p.variations)}, 
          ${p.isFeatured}, ${p.createdAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
          original_price = EXCLUDED.original_price, category = EXCLUDED.category, image = EXCLUDED.image, 
          cover_media = EXCLUDED.cover_media, gallery = EXCLUDED.gallery, variations = EXCLUDED.variations, 
          is_featured = EXCLUDED.is_featured;
      `;
    } catch (e: any) {
      console.error('Neon SaveProduct Error:', e.message);
      throw e;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const local = localStorage.getItem(PRODUCTS_KEY);
    if (local) {
      const filtered = JSON.parse(local).filter((p: any) => p.id !== id);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
    }
    if (sql) await sql`DELETE FROM products WHERE id = ${id}`;
  },

  async getCSContacts(): Promise<CSContact[]> {
    if (!sql) return JSON.parse(localStorage.getItem(CS_KEY) || '[]');
    try {
      const rows = await sql`SELECT * FROM cs_contacts`;
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
    if (!sql) return;
    const contactId = c.id || `cs_${Date.now()}`;
    await sql`
      INSERT INTO cs_contacts (id, name, phone_number, is_active)
      VALUES (${contactId}, ${c.name}, ${c.phoneNumber}, ${c.isActive})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, phone_number = EXCLUDED.phone_number, is_active = EXCLUDED.is_active;
    `;
  },

  async deleteCSContact(id: string): Promise<void> {
    if (sql) await sql`DELETE FROM cs_contacts WHERE id = ${id}`;
  },

  async getTestimonials(): Promise<Testimonial[]> {
    if (!sql) return JSON.parse(localStorage.getItem(TESTIMONIALS_KEY) || '[]');
    try {
      const rows = await sql`SELECT * FROM testimonials`;
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

    if (!sql) return;
    const testimonialId = t.id || `testi_${Date.now()}`;
    try {
      await sql`
        INSERT INTO testimonials (id, image_url, customer_name, description, is_active)
        VALUES (${testimonialId}, ${t.imageUrl}, ${t.customerName || ''}, ${t.description || ''}, ${t.isActive})
        ON CONFLICT (id) DO UPDATE SET
          image_url = EXCLUDED.image_url, customer_name = EXCLUDED.customer_name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;
      `;
    } catch (e) {
      console.error("Neon SaveTestimonial Error:", e);
    }
  },

  async deleteTestimonial(id: string): Promise<void> {
    const local = localStorage.getItem(TESTIMONIALS_KEY);
    if (local) {
      const filtered = JSON.parse(local).filter((t: any) => t.id !== id);
      localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(filtered));
    }
    if (sql) await sql`DELETE FROM testimonials WHERE id = ${id}`;
  },

  async getSiteSettings(): Promise<SiteSettings> {
    if (!sql) return JSON.parse(localStorage.getItem(SITE_SETTINGS_KEY) || JSON.stringify(DEFAULT_SETTINGS));
    try {
      const rows = await sql`SELECT data FROM site_settings WHERE id = 'main_settings'`;
      if (rows.length > 0) {
        const settings = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
        localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
        return settings;
      }
    } catch (e) {}
    return JSON.parse(localStorage.getItem(SITE_SETTINGS_KEY) || JSON.stringify(DEFAULT_SETTINGS));
  },

  async saveSiteSettings(settings: SiteSettings): Promise<void> {
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
    if (!sql) return;
    await sql`
      INSERT INTO site_settings (id, data)
      VALUES ('main_settings', ${JSON.stringify(settings)})
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
    `;
  },

  async getAdminCredentials(): Promise<AdminCredentials> {
    if (!sql) return JSON.parse(localStorage.getItem(ADMIN_KEY) || JSON.stringify({ username: 'admin', password: 'admin123' }));
    try {
      const rows = await sql`SELECT username, password FROM admin_auth WHERE id = 'admin_config'`;
      if (rows.length > 0) return { username: rows[0].username, password: rows[0].password };
    } catch (e) {}
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || JSON.stringify({ username: 'admin', password: 'admin123' }));
  },

  async saveAdminCredentials(creds: AdminCredentials): Promise<void> {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(creds));
    if (!sql) return;
    await sql`
      INSERT INTO admin_auth (id, username, password)
      VALUES ('admin_config', ${creds.username}, ${creds.password})
      ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password;
    `;
  }
};
