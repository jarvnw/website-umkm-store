import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const log = (msg: string) => {
  console.log(`${new Date().toISOString()} - ${msg}`);
};

// Database Connection Logic
const getNeonUrl = () => {
  const directUrl = process.env.DATABASE_URL || 
                    process.env.VITE_DATABASE_URL || 
                    process.env.NEON_DATABASE_URL ||
                    process.env.POSTGRES_URL; 
  if (directUrl) return directUrl;

  const rawUrl = process.env.NEON_API_URL || process.env.VITE_NEON_API_URL || process.env.DATABASE_RAW_URL || '';
  const password = process.env.NEON_API_KEY || process.env.VITE_NEON_API_KEY || process.env.DATABASE_PASSWORD || '';
  
  if (rawUrl && password) {
    const host = rawUrl
      .replace('https://', '').replace('postgres://', '').replace('postgresql://', '')
      .split('@').pop()!.replace('-pooler', '').split('/')[0];
    return `postgres://neondb_owner:${password}@${host}/neondb?sslmode=require`;
  }
  return null;
};

const neonUrl = getNeonUrl();
const sql = neonUrl ? neon(neonUrl) : null;
if (sql) {
  log('SQL Connection Prepared');
  // Run migrations in background
  (async () => {
    try {
      await sql`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, price DECIMAL(12,2) NOT NULL, original_price DECIMAL(12,2), category TEXT, image TEXT, cover_media JSONB, gallery JSONB, variations JSONB, is_featured BOOLEAN DEFAULT FALSE, created_at BIGINT)`;
      await sql`CREATE TABLE IF NOT EXISTS cs_contacts (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone_number TEXT NOT NULL, is_active BOOLEAN DEFAULT TRUE)`;
      await sql`CREATE TABLE IF NOT EXISTS testimonials (id TEXT PRIMARY KEY, image_url TEXT NOT NULL, customer_name TEXT, description TEXT, is_active BOOLEAN DEFAULT TRUE)`;
      await sql`CREATE TABLE IF NOT EXISTS faqs (id TEXT PRIMARY KEY, question TEXT NOT NULL, answer TEXT, is_active BOOLEAN DEFAULT TRUE, sort_order INTEGER DEFAULT 0, created_at BIGINT)`;
      await sql`CREATE TABLE IF NOT EXISTS benefit_items (id TEXT PRIMARY KEY, icon TEXT, title TEXT NOT NULL, subtitle TEXT, is_active BOOLEAN DEFAULT TRUE, sort_order INTEGER DEFAULT 0)`;
      await sql`CREATE TABLE IF NOT EXISTS site_settings (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS admin_auth (id TEXT PRIMARY KEY, username TEXT NOT NULL, password TEXT NOT NULL)`;
      log('Migrations finished');
    } catch (e: any) { log('Migration background note: ' + e.message); }
  })();
}

// Middleware
app.use((req, res, next) => {
  log(`[${req.method}] ${req.url}`);
  next();
});

// Helper for DB checks
const sqlGuard = (req: any, res: any, next: any) => {
  if (!sql) return res.status(503).json({ error: "DB not connected. Check environment variables." });
  next();
};

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    sql: !!sql, 
    env: process.env.NODE_ENV,
    ik: !!(process.env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_SECRET_KEY)
  });
});

app.get('/api/auth', (req, res) => {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_SECRET_KEY || process.env.VITE_IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) throw new Error("ImageKit Private Key missing");
    const token = (req.query.token as string) || crypto.randomBytes(16).toString('hex');
    const expire = Number(req.query.expire) || Math.floor(Date.now() / 1000) + 1800;
    const signature = crypto.createHmac('sha1', privateKey).update(token + expire.toString()).digest('hex');
    res.json({ token, expire, signature });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/config', (req, res) => {
  res.json({
    imageKitPublicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY,
    imageKitUrlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.VITE_IMAGEKIT_URL || process.env.IMAGEKIT_URL_ENDPOINT
  });
});

app.get('/api/products', async (req, res) => {
  if (!sql) return res.json([]);
  try { res.json(await sql`SELECT * FROM products ORDER BY created_at DESC`); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', sqlGuard, async (req, res) => {
  const p = req.body;
  try {
    await sql!`INSERT INTO products (id, name, description, price, original_price, category, image, cover_media, gallery, variations, is_featured, created_at)
      VALUES (${p.id}, ${p.name}, ${p.description}, ${p.price}, ${p.originalPrice || null}, ${p.category}, ${p.image}, ${JSON.stringify(p.coverMedia)}, ${JSON.stringify(p.gallery)}, ${JSON.stringify(p.variations)}, ${p.isFeatured}, ${p.createdAt})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, original_price = EXCLUDED.original_price, category = EXCLUDED.category, image = EXCLUDED.image, cover_media = EXCLUDED.cover_media, gallery = EXCLUDED.gallery, variations = EXCLUDED.variations, is_featured = EXCLUDED.is_featured;`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', sqlGuard, async (req, res) => {
  try { await sql!`DELETE FROM products WHERE id = ${req.params.id}`; res.json({ success: true }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/cs_contacts', async (req, res) => {
  if (!sql) return res.json([]);
  try { res.json(await sql`SELECT * FROM cs_contacts`); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cs_contacts', sqlGuard, async (req, res) => {
  const c = req.body;
  try {
    await sql!`INSERT INTO cs_contacts (id, name, phone_number, is_active) VALUES (${c.id || `cs_${Date.now()}`}, ${c.name}, ${c.phoneNumber}, ${c.isActive})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone_number = EXCLUDED.phone_number, is_active = EXCLUDED.is_active;`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/testimonials', async (req, res) => {
  if (!sql) return res.json([]);
  try { res.json(await sql`SELECT * FROM testimonials`); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/testimonials', sqlGuard, async (req, res) => {
  const t = req.body;
  try {
    await sql!`INSERT INTO testimonials (id, image_url, customer_name, description, is_active) VALUES (${t.id || `testi_${Date.now()}`}, ${t.imageUrl}, ${t.customerName || ''}, ${t.description || ''}, ${t.isActive})
      ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url, customer_name = EXCLUDED.customer_name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/faqs', async (req, res) => {
  if (!sql) return res.json([]);
  try { res.json(await sql`SELECT * FROM faqs ORDER BY sort_order ASC, created_at DESC`); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/faqs', sqlGuard, async (req, res) => {
  const f = req.body;
  try {
    await sql!`INSERT INTO faqs (id, question, answer, is_active, sort_order, created_at) VALUES (${f.id || `faq_${Date.now()}`}, ${f.question}, ${f.answer}, ${f.isActive}, ${f.sortOrder}, ${f.createdAt})
      ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, answer = EXCLUDED.answer, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/benefit_items', async (req, res) => {
  if (!sql) return res.json([]);
  try { res.json(await sql`SELECT * FROM benefit_items ORDER BY sort_order ASC`); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/benefit_items', sqlGuard, async (req, res) => {
  const b = req.body;
  try {
    await sql!`INSERT INTO benefit_items (id, icon, title, subtitle, is_active, sort_order) VALUES (${b.id}, ${b.icon}, ${b.title}, ${b.subtitle}, ${b.isActive}, ${b.sortOrder})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, is_active = EXCLUDED.is_active;`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/site_settings', async (req, res) => {
  if (!sql) return res.status(404).json({ error: "DB not connected" });
  try {
    const rows = await sql`SELECT data FROM site_settings WHERE id = 'main_settings'`;
    if (rows.length > 0) res.json(rows[0].data);
    else res.status(404).json({ error: "Not found" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/site_settings', sqlGuard, async (req, res) => {
  try {
    await sql!`INSERT INTO site_settings (id, data) VALUES ('main_settings', ${JSON.stringify(req.body)})
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin_auth', async (req, res) => {
  if (!sql) return res.status(404).json({ error: "DB not connected" });
  try {
    const rows = await sql`SELECT username, password FROM admin_auth WHERE id = 'admin_config'`;
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ error: "Not found" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin_auth', sqlGuard, async (req, res) => {
  const creds = req.body;
  try {
    await sql!`INSERT INTO admin_auth (id, username, password) VALUES ('admin_config', ${creds.username}, ${creds.password})
      ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password;`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Vite / Static Serving
if (process.env.NODE_ENV !== 'production') {
  createViteServer({ server: { middlewareMode: true }, appType: 'spa' }).then((vite) => {
    app.use(vite.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(3000, '0.0.0.0', () => log('Server running on 3000'));

export default app;
