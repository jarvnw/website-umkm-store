
import { Product, CSContact, SiteSettings, Testimonial, AdminCredentials } from '../types';

const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key] || '';
    if (typeof process !== 'undefined' && process.env) return process.env[key] || '';
  } catch (e) {}
  return '';
};

/**
 * PEMBERSIHAN URL HOST NEON (Lebih Agresif)
 */
const rawUrl = getEnv('VITE_NEON_API_URL');
let NEON_HOST = '';
if (rawUrl) {
  NEON_HOST = rawUrl
    .replace(/^psql\s'/, '')        // Hapus psql ' di awal jika ada
    .replace(/'$/, '')               // Hapus ' di akhir jika ada
    .replace('https://', '')
    .replace('postgres://', '')
    .replace('postgresql://', '')
    .split('@').pop()!               // Ambil setelah @ jika ada (user:pass@host)
    .replace('.apirest', '')         // Hapus .apirest (ini untuk Management API)
    .replace('-pooler', '')          // Hapus -pooler (SQL API biasanya di host utama)
    .split('/')[0]                   // Ambil host saja sebelum path/database
    .split(':')[0]                   // Hapus port jika ada (:5432)
    .split('?')[0];                  // Hapus query params (?sslmode=...)
}

const NEON_API_KEY = getEnv('VITE_NEON_API_KEY');

const PRODUCTS_KEY = 'lumina_products';
const CS_KEY = 'lumina_cs_contacts';
const TESTIMONIALS_KEY = 'lumina_testimonials';
const SITE_SETTINGS_KEY = 'lumina_site_settings';
const ADMIN_KEY = 'lumina_admin_creds';

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'LuminaGoods',
  logoUrl: '',
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
  instagramUrl: '', tiktokUrl: '', facebookUrl: '', youtubeUrl: ''
};

const escapeSQL = (str: string) => (str || '').replace(/'/g, "''");
const escapeJSON = (obj: any) => JSON.stringify(obj).replace(/'/g, "''");

async function runQuery(sql: string) {
  if (!NEON_HOST || !NEON_API_KEY) {
    console.warn("Neon Config Missing. Using LocalStorage mode.");
    return null;
  }

  try {
    const url = `https://${NEON_HOST}/sql`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        // Gunakan Content-Type standar yang didukung oleh server Neon tanpa memicu blokir CORS ketat
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Neon Error ${response.status}:`, errText);
      return null;
    }

    const result = await response.json();
    if (result.error) {
      console.error('SQL Error:', result.error);
      return null;
    }
    return result.rows || [];
  } catch (e: any) {
    console.error('Fetch Error:', e.message);
    return null; 
  }
}

export const dbService = {
  async getProducts(): Promise<Product[]> {
    const rows = await runQuery('SELECT * FROM products ORDER BY created_at DESC');
    if (rows) {
      const formatted = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
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
    }
    const local = localStorage.getItem(PRODUCTS_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveProduct(p: Product): Promise<void> {
    const sql = `
      INSERT INTO products (id, name, description, price, category, image, cover_media, gallery, variations, is_featured, created_at)
      VALUES (
        '${p.id}', '${escapeSQL(p.name)}', '${escapeSQL(p.description)}', ${p.price}, 
        '${escapeSQL(p.category)}', '${escapeSQL(p.image)}', '${escapeJSON(p.coverMedia)}', 
        '${escapeJSON(p.gallery)}', '${escapeJSON(p.variations)}', ${p.isFeatured}, ${p.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
        category = EXCLUDED.category, image = EXCLUDED.image, cover_media = EXCLUDED.cover_media,
        gallery = EXCLUDED.gallery, variations = EXCLUDED.variations, is_featured = EXCLUDED.is_featured;
    `;
    
    // Update local storage dulu agar UI cepat berubah
    const local = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    const idx = local.findIndex((item: any) => item.id === p.id);
    if (idx >= 0) local[idx] = p; else local.push(p);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(local));

    const res = await runQuery(sql);
    if (res === null && NEON_HOST) {
        throw new Error("Koneksi ke Neon gagal. Cek VITE_NEON_API_KEY (Password) dan VITE_NEON_API_URL (Host) Anda.");
    }
  },

  async deleteProduct(id: string): Promise<void> {
    await runQuery(`DELETE FROM products WHERE id = '${id}'`);
    const local = localStorage.getItem(PRODUCTS_KEY);
    if (local) {
      const filtered = JSON.parse(local).filter((p: any) => p.id !== id);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
    }
  },

  async getCSContacts(): Promise<CSContact[]> {
    const rows = await runQuery('SELECT * FROM cs_contacts');
    if (rows) {
      const formatted = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        phoneNumber: r.phone_number,
        isActive: Boolean(r.is_active)
      }));
      localStorage.setItem(CS_KEY, JSON.stringify(formatted));
      return formatted;
    }
    const local = localStorage.getItem(CS_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveCSContact(c: CSContact): Promise<void> {
    const sql = `
      INSERT INTO cs_contacts (id, name, phone_number, is_active)
      VALUES ('${c.id}', '${escapeSQL(c.name)}', '${c.phoneNumber}', ${c.isActive})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, phone_number = EXCLUDED.phone_number, is_active = EXCLUDED.is_active;
    `;
    await runQuery(sql);
  },

  async deleteCSContact(id: string): Promise<void> {
    await runQuery(`DELETE FROM cs_contacts WHERE id = '${id}'`);
  },

  async getTestimonials(): Promise<Testimonial[]> {
    const rows = await runQuery('SELECT * FROM testimonials');
    if (rows) {
      const formatted = rows.map((r: any) => ({
        id: r.id,
        imageUrl: r.image_url,
        customerName: r.customer_name,
        isActive: Boolean(r.is_active)
      }));
      localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(formatted));
      return formatted;
    }
    const local = localStorage.getItem(TESTIMONIALS_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveTestimonial(t: Testimonial): Promise<void> {
    const sql = `
      INSERT INTO testimonials (id, image_url, customer_name, is_active)
      VALUES ('${t.id}', '${escapeSQL(t.imageUrl)}', '${escapeSQL(t.customerName || '')}', ${t.isActive})
      ON CONFLICT (id) DO UPDATE SET
        image_url = EXCLUDED.image_url, customer_name = EXCLUDED.customer_name, is_active = EXCLUDED.is_active;
    `;
    await runQuery(sql);
  },

  async deleteTestimonial(id: string): Promise<void> {
    await runQuery(`DELETE FROM testimonials WHERE id = '${id}'`);
  },

  async getSiteSettings(): Promise<SiteSettings> {
    const rows = await runQuery("SELECT data FROM site_settings WHERE id = 'main_settings'");
    if (rows && rows.length > 0) {
      const settings = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
      return settings;
    }
    const local = localStorage.getItem(SITE_SETTINGS_KEY);
    return local ? JSON.parse(local) : DEFAULT_SETTINGS;
  },

  async saveSiteSettings(settings: SiteSettings): Promise<void> {
    const sql = `
      INSERT INTO site_settings (id, data)
      VALUES ('main_settings', '${escapeJSON(settings)}')
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
    `;
    await runQuery(sql);
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
  },

  async getAdminCredentials(): Promise<AdminCredentials> {
    const rows = await runQuery("SELECT username, password FROM admin_auth WHERE id = 'admin_config'");
    if (rows && rows.length > 0) return { username: rows[0].username, password: rows[0].password };
    const local = localStorage.getItem(ADMIN_KEY);
    return local ? JSON.parse(local) : { username: 'admin', password: 'admin123' };
  },

  async saveAdminCredentials(creds: AdminCredentials): Promise<void> {
    const sql = `
      INSERT INTO admin_auth (id, username, password)
      VALUES ('admin_config', '${escapeSQL(creds.username)}', '${escapeSQL(creds.password)}')
      ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password;
    `;
    await runQuery(sql);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(creds));
  }
};
