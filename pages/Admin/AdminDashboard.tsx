
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { Product, CSContact, Media, Variation, SiteSettings, Testimonial, AdminCredentials } from '../../types';
import { useStore, THEME_COLORS, FONT_THEMES } from '../../App';

const getEnv = (key: string): string => {
  // @ts-ignore
  if (import.meta.env && import.meta.env[key]) return import.meta.env[key];
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return '';
};

const IK_PUBLIC_KEY = getEnv('VITE_IMAGEKIT_PUBLIC_KEY');

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'site' | 'cs' | 'testimonials' | 'security'>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCS, setEditingCS] = useState<Partial<CSContact> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [localSettings, setLocalSettings] = useState<SiteSettings | null>(null);
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>({ username: '', password: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const { refreshData, products, csContacts, siteSettings, testimonials } = useStore();

  useEffect(() => {
    const isAuth = localStorage.getItem('lumina_admin_auth');
    if (!isAuth) navigate('/admin/login');
    setLocalSettings(siteSettings);
    dbService.getAdminCredentials().then(setAdminCreds);
  }, [navigate, siteSettings]);

  const handleLogout = () => {
    localStorage.removeItem('lumina_admin_auth');
    navigate('/admin/login');
  };

  const uploadToImageKit = async (file: File): Promise<string> => {
    if (!IK_PUBLIC_KEY) {
      alert("Public Key ImageKit belum dikonfigurasi.");
      throw new Error('Missing Public Key');
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name || `img_${Date.now()}`);
      formData.append('publicKey', IK_PUBLIC_KEY);
      formData.append('useUniqueFileName', 'true');
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal');
      return result.url;
    } catch (error: any) {
      alert(`Gagal upload: ${error.message}\n\nSilakan gunakan URL gambar manual.`);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.variations || editingProduct.variations.length === 0) {
      alert('Minimal harus memiliki 1 variasi harga!');
      return;
    }

    setIsSaving(true);
    try {
      const product: Product = {
        id: editingProduct.id || Date.now().toString(),
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        price: editingProduct.variations?.[0]?.price || 0,
        category: editingProduct.category || 'Umum',
        image: editingProduct.coverMedia?.url || editingProduct.image || '',
        coverMedia: editingProduct.coverMedia || { type: 'image', url: '' },
        gallery: editingProduct.gallery || [],
        variations: editingProduct.variations || [],
        isFeatured: !!editingProduct.isFeatured,
        createdAt: editingProduct.createdAt || Date.now()
      };
      
      await dbService.saveProduct(product);
      alert('Produk berhasil disimpan!');
      refreshData();
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error: any) {
      alert('Gagal menyimpan ke database Neon: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
    <div className="flex items-center gap-3 mb-6 mt-10 border-b-2 border-primary/10 pb-4">
      <span className="material-symbols-outlined text-primary font-black">{icon}</span>
      <h3 className="text-sm font-black uppercase tracking-[0.2em]">{title}</h3>
    </div>
  );

  return (
    <div className="px-4 md:px-10 lg:px-40 py-10 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary text-black rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl font-black">storefront</span>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">Pengaturan Toko</h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Control Panel v2.2</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowGuide(!showGuide)} className="h-12 px-6 bg-primary/10 text-primary border border-primary/20 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-primary/20 transition-all">
              <span className="material-symbols-outlined text-lg font-black">help_center</span> PANDUAN GAMBAR
            </button>
            <button onClick={handleLogout} className="h-12 px-6 border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all">LOGOUT</button>
          </div>
        </div>

        {showGuide && (
          <div className="mb-10 bg-white dark:bg-[#1a2e1a] border-2 border-primary/20 rounded-[32px] p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-6 text-sm">
               <div className="size-12 rounded-2xl bg-primary text-black flex items-center justify-center shrink-0"><span className="material-symbols-outlined font-black">lightbulb</span></div>
               <div>
                  <h4 className="font-black text-lg mb-2">Tips Mengelola Gambar:</h4>
                  <p className="text-gray-500 font-medium mb-4">Gunakan ImageKit untuk performa terbaik. Paste URL langsung jika Anda sudah memiliki file host sendiri.</p>
               </div>
            </div>
          </div>
        )}

        <div className="flex border-b border-gray-100 dark:border-gray-800 mb-8 overflow-x-auto no-scrollbar gap-2">
          {[
            { id: 'products', label: 'Produk' },
            { id: 'site', label: 'Tampilan' },
            { id: 'cs', label: 'Admin WA' },
            { id: 'testimonials', label: 'Testimoni' },
            { id: 'security', label: 'Akses' }
          ].map(tab => (
            <button key={tab.id} className={`px-8 py-4 font-black text-xs uppercase tracking-[0.1em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => setActiveTab(tab.id as any)}>
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>}
            </button>
          ))}
        </div>

        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => { setEditingProduct({ gallery: [], variations: [], isFeatured: false }); setIsModalOpen(true); }} className="group p-10 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[40px] flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all">
               <span className="material-symbols-outlined text-5xl text-gray-300 group-hover:text-primary transition-colors mb-2 font-black">add_circle</span>
               <p className="font-black uppercase text-xs tracking-widest text-gray-400 group-hover:text-primary">Produk Baru</p>
            </button>
            {products.map(p => (
              <div key={p.id} className="bg-white dark:bg-[#1a2e1a] p-6 rounded-[32px] flex items-center gap-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                <div className="size-20 shrink-0 rounded-2xl overflow-hidden bg-gray-50 dark:bg-black/40">
                  <img src={p.coverMedia?.url || p.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black">{p.name}</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{p.category}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="size-12 bg-gray-50 dark:bg-black/20 rounded-xl hover:text-primary flex items-center justify-center"><span className="material-symbols-outlined font-black">edit</span></button>
                  <button onClick={() => { if(confirm('Hapus produk?')) dbService.deleteProduct(p.id).then(refreshData) }} className="size-12 bg-gray-50 dark:bg-black/20 rounded-xl hover:text-red-500 flex items-center justify-center"><span className="material-symbols-outlined font-black">delete</span></button>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'site' ? (
          <div className="bg-white dark:bg-[#1a2e1a] p-6 md:p-12 rounded-[40px] border border-gray-100 dark:border-gray-800 max-w-5xl mx-auto shadow-sm">
             <form onSubmit={async (e) => { 
                e.preventDefault(); 
                if(!localSettings) return;
                setIsSaving(true);
                try {
                  await dbService.saveSiteSettings(localSettings);
                  alert('Pengaturan tampilan berhasil disimpan!');
                  refreshData();
                } catch(err: any) {
                  alert('Gagal simpan: ' + err.message);
                } finally {
                  setIsSaving(false);
                }
             }} className="flex flex-col gap-4">
                
                <SectionHeader title="Branding & Favicon" icon="branding_watermark" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                   <div className="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Logo Website</label>
                      <div className="flex items-center gap-4">
                         <div className="size-20 shrink-0 bg-white dark:bg-black/40 rounded-2xl overflow-hidden border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center relative">
                            {localSettings?.logoUrl ? <img src={localSettings.logoUrl} className="w-full h-full object-contain" /> : <span className="material-symbols-outlined text-gray-300 font-black">image</span>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if(file && localSettings) { try { const url = await uploadToImageKit(file); setLocalSettings({...localSettings, logoUrl: url}); } catch(e) {} }
                            }} />
                         </div>
                         <input className="flex-1 h-12 border-2 rounded-xl px-4 font-black text-xs bg-white dark:bg-black/40 outline-none focus:border-primary" placeholder="URL Logo..." value={localSettings?.logoUrl || ''} onChange={e => localSettings && setLocalSettings({...localSettings, logoUrl: e.target.value})} />
                      </div>
                   </div>

                   <div className="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Favicon (Ikon Browser)</label>
                      <div className="flex items-center gap-4">
                         <div className="size-20 shrink-0 bg-white dark:bg-black/40 rounded-2xl overflow-hidden border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center relative">
                            {localSettings?.faviconUrl ? <img src={localSettings.faviconUrl} className="size-10 object-contain" /> : <span className="material-symbols-outlined text-gray-300 text-3xl font-black">token</span>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if(file && localSettings) { try { const url = await uploadToImageKit(file); setLocalSettings({...localSettings, faviconUrl: url}); } catch(e) {} }
                            }} />
                         </div>
                         <input className="flex-1 h-12 border-2 rounded-xl px-4 font-black text-xs bg-white dark:bg-black/40 outline-none focus:border-primary" placeholder="URL Favicon (.ico, .png, .svg)..." value={localSettings?.faviconUrl || ''} onChange={e => localSettings && setLocalSettings({...localSettings, faviconUrl: e.target.value})} />
                      </div>
                   </div>
                </div>

                <SectionHeader title="Tema & Tipografi" icon="palette" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Pilih Tema Warna</label>
                     <select 
                        className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black cursor-pointer"
                        value={localSettings?.themeColor || 'Green'}
                        onChange={e => localSettings && setLocalSettings({...localSettings, themeColor: e.target.value})}
                     >
                       {Object.keys(THEME_COLORS).map(theme => (
                         <option key={theme} value={theme}>{theme}</option>
                       ))}
                     </select>
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Pilih Tema Font</label>
                     <select 
                        className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black cursor-pointer"
                        value={localSettings?.themeFont || 'Default'}
                        onChange={e => localSettings && setLocalSettings({...localSettings, themeFont: e.target.value})}
                     >
                       {Object.keys(FONT_THEMES).map(font => (
                         <option key={font} value={font}>{font}</option>
                       ))}
                     </select>
                   </div>
                </div>

                <SectionHeader title="Umum & Hero" icon="home" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nama Toko</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.siteName} onChange={e => localSettings && setLocalSettings({...localSettings, siteName: e.target.value})} /></div>
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Headline Hero (Judul Besar)</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.heroTitle} onChange={e => localSettings && setLocalSettings({...localSettings, heroTitle: e.target.value})} /></div>
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Subtitle Hero</label><textarea className="h-24 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black resize-none" value={localSettings?.heroSubtitle} onChange={e => localSettings && setLocalSettings({...localSettings, heroSubtitle: e.target.value})} /></div>
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">URL Gambar Hero</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.heroImage} onChange={e => localSettings && setLocalSettings({...localSettings, heroImage: e.target.value})} /></div>
                </div>

                <SectionHeader title="About Us Page" icon="info" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Header Title</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.aboutHeaderTitle} onChange={e => localSettings && setLocalSettings({...localSettings, aboutHeaderTitle: e.target.value})} /></div>
                   <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Header Description</label><textarea className="h-24 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black resize-none" value={localSettings?.aboutHeaderDesc} onChange={e => localSettings && setLocalSettings({...localSettings, aboutHeaderDesc: e.target.value})} /></div>
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Section Content Title</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.aboutSectionTitle} onChange={e => localSettings && setLocalSettings({...localSettings, aboutSectionTitle: e.target.value})} /></div>
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">URL Gambar Section</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.aboutSectionImage} onChange={e => localSettings && setLocalSettings({...localSettings, aboutSectionImage: e.target.value})} /></div>
                   <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Section Content Description</label><textarea className="h-32 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black resize-none" value={localSettings?.aboutSectionDesc} onChange={e => localSettings && setLocalSettings({...localSettings, aboutSectionDesc: e.target.value})} /></div>
                </div>

                <SectionHeader title="Contact & Social Media" icon="contact_support" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Email</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.contactEmail} onChange={e => localSettings && setLocalSettings({...localSettings, contactEmail: e.target.value})} /></div>
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Telepon/WA Utama</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.contactPhone} onChange={e => localSettings && setLocalSettings({...localSettings, contactPhone: e.target.value})} /></div>
                   <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Alamat Lengkap</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.contactAddress} onChange={e => localSettings && setLocalSettings({...localSettings, contactAddress: e.target.value})} /></div>
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Instagram URL</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.instagramUrl} onChange={e => localSettings && setLocalSettings({...localSettings, instagramUrl: e.target.value})} /></div>
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">TikTok URL</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.tiktokUrl} onChange={e => localSettings && setLocalSettings({...localSettings, tiktokUrl: e.target.value})} /></div>
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Facebook URL</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.facebookUrl} onChange={e => localSettings && setLocalSettings({...localSettings, facebookUrl: e.target.value})} /></div>
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">YouTube URL</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.youtubeUrl} onChange={e => localSettings && setLocalSettings({...localSettings, youtubeUrl: e.target.value})} /></div>
                </div>

                <SectionHeader title="Footer" icon="branding_watermark" />
                <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Deskripsi Footer</label><textarea className="h-28 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black resize-none" value={localSettings?.footerDescription} onChange={e => localSettings && setLocalSettings({...localSettings, footerDescription: e.target.value})} /></div>

                <button disabled={isSaving} className="h-16 bg-primary text-[#111811] rounded-2xl font-black text-lg shadow-xl shadow-primary/20 mt-10 hover:scale-[1.01] transition-transform disabled:opacity-50">
                   {isSaving ? 'Menyimpan...' : 'SIMPAN SELURUH KONFIGURASI SITUS'}
                </button>
             </form>
          </div>
        ) : activeTab === 'cs' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => { setEditingCS({ isActive: true }); setIsModalOpen(true); }} className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] text-gray-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-4">
               <span className="material-symbols-outlined font-black">add_moderator</span>
               <p className="font-black text-xs uppercase tracking-widest">Tambah Nomor CS Baru</p>
             </button>
             {csContacts.map(c => (
               <div key={c.id} className="bg-white dark:bg-[#1a2e1a] p-6 rounded-[32px] flex items-center justify-between border border-gray-100 dark:border-gray-800 shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">WA</div>
                    <div>
                      <h4 className="font-black text-lg">{c.name}</h4>
                      <p className="text-gray-400 font-bold">+{c.phoneNumber}</p>
                    </div>
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => { setEditingCS(c); setIsModalOpen(true); }} className="size-10 flex items-center justify-center hover:text-primary transition-colors"><span className="material-symbols-outlined font-black">edit</span></button>
                    <button onClick={() => { if(confirm('Hapus kontak?')) dbService.deleteCSContact(c.id).then(refreshData) }} className="size-10 flex items-center justify-center hover:text-red-500 transition-colors"><span className="material-symbols-outlined font-black">delete</span></button>
                 </div>
               </div>
             ))}
          </div>
        ) : activeTab === 'testimonials' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <button onClick={() => { setEditingTestimonial({ isActive: true }); setIsModalOpen(true); }} className="flex flex-col items-center justify-center aspect-[3/4] rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary text-gray-400 hover:text-primary transition-all">
              <span className="material-symbols-outlined text-4xl mb-2 font-black">add_a_photo</span>
              <p className="text-[10px] font-black uppercase">Tambah Review</p>
            </button>
            {testimonials.map(t => (
              <div key={t.id} className="relative aspect-[3/4] rounded-[32px] border border-gray-100 dark:border-gray-800 overflow-hidden group shadow-sm">
                <img src={t.imageUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm p-4 text-center">
                   <p className="text-white text-[10px] font-black uppercase tracking-widest">{t.customerName}</p>
                   <div className="flex gap-4">
                      <button onClick={() => { setEditingTestimonial(t); setIsModalOpen(true); }} className="size-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg"><span className="material-symbols-outlined font-black">edit</span></button>
                      <button onClick={() => { if(confirm('Hapus testimoni?')) dbService.deleteTestimonial(t.id).then(refreshData) }} className="size-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><span className="material-symbols-outlined font-black">delete</span></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white dark:bg-[#1a2e1a] p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-2xl text-center">
             <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6"><span className="material-symbols-outlined text-4xl font-black">admin_panel_settings</span></div>
             <h3 className="text-2xl font-black mb-6">Akses Admin</h3>
             <form onSubmit={async (e) => { 
                e.preventDefault(); 
                setIsSaving(true);
                try {
                  await dbService.saveAdminCredentials(adminCreds);
                  alert('Kredensial admin diperbarui!');
                } catch(err: any) {
                  alert('Gagal: ' + err.message);
                } finally {
                  setIsSaving(false);
                }
             }} className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Username</label><input required className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={adminCreds.username} onChange={e => setAdminCreds({...adminCreds, username: e.target.value})} /></div>
                <div className="flex flex-col gap-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Password</label><input required type="password" className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={adminCreds.password} onChange={e => setAdminCreds({...adminCreds, password: e.target.value})} /></div>
                <button disabled={isSaving} className="h-16 bg-primary text-[#111811] rounded-2xl font-black mt-4 shadow-xl shadow-primary/20 disabled:opacity-50">
                   {isSaving ? 'Memproses...' : 'SIMPAN AKSES'}
                </button>
             </form>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-white dark:bg-background-dark rounded-[40px] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-4xl font-black tracking-tighter">
                 {activeTab === 'products' ? (editingProduct?.id ? 'Edit Produk' : 'Produk Baru') : 'Input Data'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="size-12 flex items-center justify-center rounded-full bg-gray-50 dark:bg-black/20 transition-colors hover:bg-red-500 hover:text-white"><span className="material-symbols-outlined font-black">close</span></button>
             </div>

             {activeTab === 'products' ? (
               <form onSubmit={handleSaveProduct} className="flex flex-col gap-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nama Barang</label><input required className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={editingProduct?.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} /></div>
                   <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Kategori</label><input required className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={editingProduct?.category || ''} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} /></div>
                   <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Deskripsi Produk</label><textarea required className="h-32 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black resize-none" value={editingProduct?.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} /></div>
                   
                   <div className="flex flex-col gap-4 border-2 border-gray-100 dark:border-gray-800 p-8 rounded-[32px] bg-gray-50/50 dark:bg-black/10 md:col-span-2">
                     <h4 className="font-black text-xs uppercase tracking-widest text-primary">Foto Sampul Utama</h4>
                     <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative size-48 shrink-0 rounded-[32px] bg-white dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden group">
                           {editingProduct?.coverMedia?.url || editingProduct?.image ? <img src={editingProduct.coverMedia?.url || editingProduct.image} className="absolute inset-0 w-full h-full object-contain" /> : <span className="material-symbols-outlined text-4xl text-gray-300 font-black">image</span>}
                           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if(file) { try { const url = await uploadToImageKit(file); setEditingProduct(prev => ({ ...prev, coverMedia: { type: 'image', url }, image: url })); } catch(e) {} }
                           }} disabled={isUploading} />
                           {isUploading && <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center text-white font-black text-xs">MENGUNGGAH...</div>}
                        </div>
                        <div className="flex-1 w-full space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">URL Gambar Manual</label>
                           <input className="w-full h-12 border-2 rounded-xl px-4 font-black text-sm bg-white dark:bg-black/40 outline-none focus:border-primary" placeholder="Paste Direct Link Gambar..." value={editingProduct?.coverMedia?.url || editingProduct?.image || ''} onChange={e => setEditingProduct({ ...editingProduct, coverMedia: { type: 'image', url: e.target.value }, image: e.target.value })} />
                        </div>
                     </div>
                   </div>

                   <div className="md:col-span-2 space-y-4">
                     <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-widest text-primary">Galeri Media Tambahan ({editingProduct?.gallery?.length || 0}/9)</h4>
                        {(editingProduct?.gallery?.length || 0) < 9 && (
                          <button type="button" onClick={() => setEditingProduct(p => ({...p, gallery: [...(p?.gallery || []), { type: 'image', url: '' }]}))} className="text-primary font-black text-[10px] uppercase flex items-center gap-1 hover:underline tracking-widest">
                            <span className="material-symbols-outlined text-base font-black">add_box</span> Tambah Media
                          </button>
                        )}
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                        {editingProduct?.gallery?.map((item, idx) => (
                           <div key={idx} className="flex flex-col md:flex-row gap-4 p-6 bg-gray-50 dark:bg-black/20 rounded-[24px] border border-gray-100 dark:border-gray-800 relative items-center">
                              <div className="relative size-20 shrink-0 bg-white dark:bg-black/40 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center">
                                 {item.url ? <img src={item.url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-gray-300 font-black">image</span>}
                                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                                   const file = e.target.files?.[0];
                                   if(file) { try { const url = await uploadToImageKit(file); setEditingProduct(p => { const g = [...(p?.gallery || [])]; g[idx] = { ...g[idx], url }; return { ...p, gallery: g }; }); } catch(e) {} }
                                 }} />
                              </div>
                              <div className="flex-1 w-full">
                                <input className="w-full h-12 border-2 rounded-xl px-4 font-black text-xs bg-white dark:bg-black/40 outline-none focus:border-primary" placeholder="URL Media Tambahan..." value={item.url} onChange={e => setEditingProduct(p => { const g = [...(p?.gallery || [])]; g[idx] = { ...g[idx], url: e.target.value }; return { ...p, gallery: g }; })} />
                              </div>
                              <button type="button" onClick={() => setEditingProduct(p => ({...p, gallery: p?.gallery?.filter((_, i) => i !== idx)}))} className="text-red-500 font-black text-[10px] uppercase hover:underline">Hapus</button>
                           </div>
                        ))}
                     </div>
                   </div>

                   <div className="md:col-span-2 space-y-4">
                     <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Varian & Stok</label>
                       <button type="button" onClick={() => setEditingProduct(p => ({...p, variations: [...(p?.variations || []), { id: Date.now().toString(), name: '', price: 0, stock: 10 }]}))} className="text-primary font-black text-[10px] uppercase flex items-center gap-1 hover:underline tracking-widest">
                         <span className="material-symbols-outlined text-base font-black">add_circle</span> Tambah Varian
                       </button>
                     </div>
                     <div className="space-y-3">
                       {editingProduct?.variations?.map((v) => (
                         <div key={v.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl items-center border border-gray-100 dark:border-gray-800">
                           <input required placeholder="Label Varian" className="bg-white dark:bg-black/20 border-none rounded-xl h-12 px-4 font-black text-sm" value={v.name} onChange={e => setEditingProduct(p => ({...p, variations: p?.variations?.map(it => it.id === v.id ? {...it, name: e.target.value} : it)}))} />
                           <input required type="number" placeholder="Harga" className="bg-white dark:bg-black/20 border-none rounded-xl h-12 px-4 font-black text-sm" value={v.price} onChange={e => setEditingProduct(p => ({...p, variations: p?.variations?.map(it => it.id === v.id ? {...it, price: Number(e.target.value)} : it)}))} />
                           <input required type="number" placeholder="Stok" className="bg-white dark:bg-black/20 border-none rounded-xl h-12 px-4 font-black text-sm" value={v.stock} onChange={e => setEditingProduct(p => ({...p, variations: p?.variations?.map(it => it.id === v.id ? {...it, stock: Number(e.target.value)} : it)}))} />
                           <button type="button" onClick={() => setEditingProduct(p => ({...p, variations: p?.variations?.filter(it => it.id !== v.id)}))} className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase">Hapus</button>
                         </div>
                       ))}
                     </div>
                   </div>
                   
                   <label className="flex items-center gap-3 cursor-pointer mt-2 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 w-fit">
                     <input type="checkbox" checked={editingProduct?.isFeatured} onChange={e => setEditingProduct({...editingProduct, isFeatured: e.target.checked})} className="size-6 rounded-lg text-primary focus:ring-primary border-gray-200 dark:border-gray-800" />
                     <span className="font-black text-[10px] uppercase tracking-widest">Pin di Beranda</span>
                   </label>
                 </div>
                 <button type="submit" disabled={isUploading || isSaving} className="h-16 bg-primary text-[#111811] rounded-[24px] font-black text-xl shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-50 mt-4">
                   {isSaving ? 'Menyimpan...' : 'SIMPAN DATA PRODUK'}
                 </button>
               </form>
             ) : activeTab === 'cs' ? (
               <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  if(!editingCS) return;
                  setIsSaving(true);
                  try {
                    await dbService.saveCSContact(editingCS as CSContact);
                    alert('Kontak CS berhasil disimpan!');
                    refreshData();
                    setIsModalOpen(false);
                  } catch(err: any) {
                    alert('Gagal simpan: ' + err.message);
                  } finally {
                    setIsSaving(false);
                  }
               }} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Nama Admin CS</label><input required placeholder="Contoh: Admin Siska" className="h-16 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 focus:border-primary outline-none font-black text-lg" value={editingCS?.name || ''} onChange={e => setEditingCS({ ...editingCS, name: e.target.value })} /></div>
                  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">No WA (Awali 62)</label><input required placeholder="628..." className="h-16 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 focus:border-primary outline-none font-black text-lg" value={editingCS?.phoneNumber || ''} onChange={e => setEditingCS({ ...editingCS, phoneNumber: e.target.value })} /></div>
                  <button disabled={isSaving} className="h-16 bg-primary text-[#111811] rounded-2xl font-black text-xl shadow-xl shadow-primary/20 disabled:opacity-50">
                    {isSaving ? 'Menyimpan...' : 'SIMPAN KONTAK'}
                  </button>
               </form>
             ) : (
               <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  if(!editingTestimonial) return;
                  setIsSaving(true);
                  try {
                    await dbService.saveTestimonial(editingTestimonial as Testimonial);
                    alert('Review berhasil disimpan!');
                    refreshData();
                    setIsModalOpen(false);
                  } catch(err: any) {
                    alert('Gagal simpan: ' + err.message);
                  } finally {
                    setIsSaving(false);
                  }
               }} className="flex flex-col gap-8">
                 <div className="flex flex-col md:flex-row gap-8 items-center border-2 border-gray-100 dark:border-gray-800 p-8 rounded-[32px] bg-gray-50/50 dark:bg-black/10">
                    <div className="relative aspect-[3/4] w-40 shrink-0 rounded-[24px] bg-white dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden">
                        {editingTestimonial?.imageUrl ? <img src={editingTestimonial.imageUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-gray-200 font-black">photo_camera</span>}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if(file) { try { const url = await uploadToImageKit(file); setEditingTestimonial({...editingTestimonial, imageUrl: url}); } catch(e) {} }
                        }} />
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">URL Bukti Review Manual</label>
                        <input className="w-full h-14 border-2 rounded-xl px-4 font-black text-sm bg-white dark:bg-black/40 focus:border-primary outline-none" placeholder="https://..." value={editingTestimonial?.imageUrl || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, imageUrl: e.target.value })} />
                    </div>
                 </div>
                 <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Identitas Pelanggan</label><input placeholder="Kak Andi - Surabaya" className="h-16 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 focus:border-primary outline-none font-black" value={editingTestimonial?.customerName || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, customerName: e.target.value })} /></div>
                 <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Review Singkat</label><textarea placeholder="Produknya sangat bagus, pengiriman cepat!" className="h-32 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 focus:border-primary outline-none font-black resize-none" value={editingTestimonial?.description || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, description: e.target.value })} /></div>
                 <button disabled={isSaving} className="h-16 bg-primary text-[#111811] rounded-2xl font-black text-xl shadow-xl shadow-primary/20 disabled:opacity-50">
                    {isSaving ? 'Menyimpan...' : 'SIMPAN REVIEW'}
                 </button>
               </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
