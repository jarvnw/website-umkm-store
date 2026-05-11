# CatalogWeb - Platform Katalog Produk UMKM

CatalogWeb adalah aplikasi katalog produk modern yang dirancang khusus untuk membantu UMKM (Usaha Mikro Kecil dan Menengah) menampilkan produk mereka secara profesional, meningkatkan kepercayaan pelanggan melalui testimoni, dan memudahkan komunikasi melalui integrasi layanan pelanggan yang cepat.

## 🚀 Fitur Utama

- **Katalog Produk Dinamis**: Tampilan produk yang bersih dengan dukungan galeri foto dan variasi produk.
- **Admin Dashboard**: Kelola semua data situs (produk, testimoni, FAQ, kontak) melalui satu panel kontrol yang aman.
- **Integrasi ImageKit**: Sistem upload gambar yang efisien dan cepat menggunakan layanan cloud ImageKit.io.
- **Real-time Database**: Menggunakan PostgreSQL (Neon) untuk penyimpanan data yang andal dan responsif.
- **Desain Responsif**: Tampilan optimal di perangkat mobile maupun desktop menggunakan Tailwind CSS.
- **Optimasi SEO & Performa**: Animasi halus dengan Framer Motion dan pemuatan aset yang dioptimalkan.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18+, Vite, Tailwind CSS, Lucide React (Icons), Motion (Animations).
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL (via Neon.tech).
- **Hosting Gambar**: ImageKit.io.
- **Deployment**: Vercel.

## 📋 Persyaratan Sistem

- **Node.js** (versi 18 atau terbaru)
- **Akun Neon.tech** (untuk database PostgreSQL)
- **Akun ImageKit.io** (untuk penyimpanan gambar)

## ⚙️ Konfigurasi Environment (Lingkungan)

Buat file `.env` di direktori root dan tambahkan variabel berikut:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=your_postgresql_connection_string
# Atau gunakan API Key jika ingin fallback otomatis:
NEON_API_URL=your_neon_project_url
NEON_API_KEY=your_neon_api_key

# ImageKit (Image Hosting)
VITE_IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id/
```

## 🛠️ Instalasi Lokal

1. **Clone repository**:
   ```bash
   git clone https://github.com/username/catalogweb-umkm.git
   cd catalogweb-umkm
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server aplikasi (Development)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

## 🚢 Panduan Deployment (Vercel)

Aplikasi ini siap di-deploy ke Vercel:

1. Hubungkan repository GitHub Anda ke Vercel.
2. Tambahkan semua Environment Variables di atas pada panel pengaturan Vercel.
3. Vercel akan secara otomatis mendeteksi konfigurasi `vercel.json` dan melakukan build.

## 📄 First Page Template

Proyek ini dibangun oleh First Page Template.
IG: firstpage.template
YT: First Page Template

---
Dikembangkan dengan ❤️ untuk kemajuan UMKM Indonesia.
