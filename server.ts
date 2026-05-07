import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const logPath = path.join(process.cwd(), 'server.log');
  const log = (msg: string) => {
    try {
      const entry = `${new Date().toISOString()} - ${msg}\n`;
      fs.appendFileSync(logPath, entry);
      console.log(entry.trim());
    } catch (e) {
      console.error('Logging failed:', e);
    }
  };

  log('startServer() invoked');
  const PORT = 3000;

  app.use(express.json());

  // Database Connection (Securely on the server)
  const getNeonUrl = () => {
    // Priority 1: Direct DATABASE_URL
    const directUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
    if (directUrl) return directUrl;

    // Priority 2: Reconstruct from components if available
    const rawUrl = process.env.NEON_API_URL || process.env.VITE_NEON_API_URL || '';
    const password = process.env.NEON_API_KEY || process.env.VITE_NEON_API_KEY || '';
    
    if (rawUrl && password) {
      const host = rawUrl
        .replace('https://', '')
        .replace('postgres://', '')
        .replace('postgresql://', '')
        .split('@').pop()!
        .replace('-pooler', '')
        .split('/')[0];
      return `postgres://neondb_owner:${password}@${host}/neondb?sslmode=require`;
    }
    return null;
  };

  const neonUrl = getNeonUrl();
  const sql = neonUrl ? neon(neonUrl) : null;
  log(`SQL Connection setup: ${neonUrl ? 'Attempted' : 'Skipped (No URL)'}`);

  // Logging middleware
  app.use((req, res, next) => {
    log(`[${req.method}] ${req.url}`);
    next();
  });

  // --- API ROUTES ---

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      sqlConnected: !!sql,
      env: process.env.NODE_ENV
    });
  });

  // ImageKit Auth Proxy
  app.get('/api/auth', (req, res) => {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || process.env.VITE_IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      return res.status(500).json({ error: "ImageKit Private Key is not configured." });
    }
    const token = (req.query.token as string) || crypto.randomBytes(16).toString('hex');
    const expire = Number(req.query.expire) || Math.floor(Date.now() / 1000) + 1800;
    const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');
    res.json({ token, expire, signature });
  });

  // DB Proxies
  app.get('/api/products', async (req, res) => {
    if (!sql) return res.json([]); 
    try {
      const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/products', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    const p = req.body;
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
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    try {
      await sql`DELETE FROM products WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/cs_contacts', async (req, res) => {
    if (!sql) return res.json([]);
    try {
      const rows = await sql`SELECT * FROM cs_contacts`;
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cs_contacts', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    const c = req.body;
    try {
      const contactId = c.id || `cs_${Date.now()}`;
      await sql`
        INSERT INTO cs_contacts (id, name, phone_number, is_active)
        VALUES (${contactId}, ${c.name}, ${c.phoneNumber}, ${c.isActive})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, phone_number = EXCLUDED.phone_number, is_active = EXCLUDED.is_active;
      `;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/cs_contacts/:id', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    try {
      await sql`DELETE FROM cs_contacts WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/testimonials', async (req, res) => {
    if (!sql) return res.json([]);
    try {
      const rows = await sql`SELECT * FROM testimonials`;
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/testimonials', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    const t = req.body;
    try {
      const testimonialId = t.id || `testi_${Date.now()}`;
      await sql`
        INSERT INTO testimonials (id, image_url, customer_name, description, is_active)
        VALUES (${testimonialId}, ${t.imageUrl}, ${t.customerName || ''}, ${t.description || ''}, ${t.isActive})
        ON CONFLICT (id) DO UPDATE SET
          image_url = EXCLUDED.image_url, customer_name = EXCLUDED.customer_name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;
      `;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/testimonials/:id', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    try {
      await sql`DELETE FROM testimonials WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/faqs', async (req, res) => {
    if (!sql) return res.json([]);
    try {
      const rows = await sql`SELECT * FROM faqs ORDER BY sort_order ASC, created_at DESC`;
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/faqs', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    const f = req.body;
    try {
      const faqId = f.id || `faq_${Date.now()}`;
      await sql`
        INSERT INTO faqs (id, question, answer, is_active, sort_order, created_at)
        VALUES (${faqId}, ${f.question}, ${f.answer}, ${f.isActive}, ${f.sortOrder}, ${f.createdAt})
        ON CONFLICT (id) DO UPDATE SET
          question = EXCLUDED.question, answer = EXCLUDED.answer, is_active = EXCLUDED.is_active, sort_order = EXCLUDED.sort_order;
      `;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/faqs/:id', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    try {
      await sql`DELETE FROM faqs WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/benefit_items', async (req, res) => {
    if (!sql) return res.json([]);
    try {
      const rows = await sql`SELECT * FROM benefit_items ORDER BY sort_order ASC`;
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/benefit_items', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    const b = req.body;
    try {
      await sql`
        INSERT INTO benefit_items (id, icon, title, subtitle, is_active, sort_order)
        VALUES (${b.id}, ${b.icon}, ${b.title}, ${b.subtitle}, ${b.isActive}, ${b.sortOrder})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, is_active = EXCLUDED.is_active;
      `;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/site_settings', async (req, res) => {
    if (!sql) return res.status(404).json({ error: "DB not connected" });
    try {
      const rows = await sql`SELECT data FROM site_settings WHERE id = 'main_settings'`;
      if (rows.length > 0) res.json(rows[0].data);
      else res.status(404).json({ error: "Not found" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/site_settings', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    try {
      await sql`
        INSERT INTO site_settings (id, data)
        VALUES ('main_settings', ${JSON.stringify(req.body)})
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
      `;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin_auth', async (req, res) => {
    if (!sql) return res.status(404).json({ error: "DB not connected" });
    try {
      const rows = await sql`SELECT username, password FROM admin_auth WHERE id = 'admin_config'`;
      if (rows.length > 0) res.json(rows[0]);
      else res.status(404).json({ error: "Not found" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin_auth', async (req, res) => {
    if (!sql) return res.status(503).json({ error: "DB not connected" });
    const creds = req.body;
    try {
      await sql`
        INSERT INTO admin_auth (id, username, password)
        VALUES ('admin_config', ${creds.username}, ${creds.password})
        ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password;
      `;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    log(`Server listening on port ${PORT} at 0.0.0.0`);
  });
}

startServer();
