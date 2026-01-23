
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { imageService } from '../../services/imageService';
import { Product, CSContact, Media, Variation, SiteSettings, Testimonial, AdminCredentials } from '../../types';
import { useStore, THEME_COLORS, FONT_THEMES } from '../../App';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'site' | 'cs' | 'testimonials' | 'security' | 'social_proof'>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCS, setEditingCS] = useState<Partial<CSContact> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [localSettings, setLocalSettings] = useState<SiteSettings | null>(null);
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>({ username: '', password: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  /**
   * UPGRADED: Unified secure upload handler with progress reporting.
   */
  const handleFileUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const response = await imageService.upload(file, (pct) => {
        setUploadProgress(pct);
      });
      return response.url;
    } catch (error: any) {
      alert(`Gagal upload: ${error.message}\n\nPastikan IMAGEKIT_PRIVATE_KEY sudah dikonfigurasi di server.`);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
        originalPrice: editingProduct.originalPrice || undefined,
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
      alert('Gagal menyimpan ke database: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGalleryItem = () => {
    if (!editingProduct) return;
    const gallery = editingProduct.gallery || [];
    if (gallery.length >= 9) {
      alert('Maksimal 9 media tambahan!');
      return;
    }
    setEditingProduct({
      ...editingProduct,
      gallery: [...gallery, { type: 'image', url: '' }]
    });
  };

  const handleRemoveGalleryItem = (index: number) => {
    if (!editingProduct) return;
    const gallery = [...(editingProduct.gallery || [])];
    gallery.splice(index, 1);
    setEditingProduct({ ...editingProduct, gallery });
  };

  const handleUpdateGalleryItem = (index: number, updates: Partial<Media>) => {
    if (!editingProduct) return;
    const gallery = [...(editingProduct.gallery || [])];
    gallery[index] = { ...gallery[index], ...updates };
    setEditingProduct({ ...editingProduct, gallery });
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
    <div className="flex items-center gap-3 mb-6 mt-10 border-b-2 border-primary/10 pb-4">
      <span className="material-symbols-outlined text-primary font-black">{icon}</span>
      <h3 className="text-sm font-black uppercase tracking-[0.2em]">{title}</h3>
    </div>
  );

  return (
    <div className="px-4 md:px-10 lg:px-40 py-10 min-h-screen">
      {/* Global Upload Progress Indicator */}
      {isUploading && (
        <div className="fixed top-0 left-0 right-0 z-[200] h-1.5 bg-gray-100 dark:bg-black/20">
          <div 
            className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(19,236,19,0.5)]" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary text-black rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl font-black">storefront</span>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">Pengaturan Toko</h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Control Panel v2.6</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowGuide(true)} className="h-12 px-6 bg-primary/10 text-primary border border-primary/20 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-primary/20 transition-all">
              <span className="material-symbols-outlined text-lg font-black">help_center</span> PANDUAN GAMBAR/MEDIA
            </button>
            <button onClick={handleLogout} className="h-12 px-6 border-2 border-gray-100 dark:border-gray-800 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all">LOGOUT</button>
          </div>
        </div>

        <div className="flex border-b border-gray-100 dark:border-gray-800 mb-8 overflow-x-auto no-scrollbar gap-2">
          {[
            { id: 'products', label: 'Produk' },
            { id: 'site', label: 'Tampilan' },
            { id: 'social_proof', label: 'Social Proof' },
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
                  {p.coverMedia?.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="material-symbols-outlined text-primary">play_circle</span>
                    </div>
                  ) : (
                    <img src={p.coverMedia?.url || p.image} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black">{p.name}</h4>
                    {p.isFeatured && <span className="bg-primary text-black text-[8px] font-black px-2 py-0.5 rounded-full">FEATURED</span>}
                  </div>
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
                e.preventDefault(); if(!localSettings) return; setIsSaving(true);
                try { await dbService.saveSiteSettings(localSettings); alert('Berhasil disimpan!'); refreshData(); } catch(err: any) { alert('Gagal: ' + err.message); } finally { setIsSaving(false); }
             }} className="flex flex-col gap-4">
                <SectionHeader title="Branding & Favicon" icon="branding_watermark" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                   <div className="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Logo Website</label>
                      <div className="flex items-center gap-4">
                         <div className="size-20 shrink-0 bg-white dark:bg-black/40 rounded-2xl overflow-hidden border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center relative">
                            {localSettings?.logoUrl ? <img src={localSettings.logoUrl} className="w-full h-full object-contain" /> : <span className="material-symbols-outlined text-gray-300 font-black">image</span>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" accept="image/*" disabled={isUploading} onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if(file && localSettings) { try { const url = await handleFileUpload(file); setLocalSettings({...localSettings, logoUrl: url}); } catch(e) {} }
                            }} />
                         </div>
                         <input className="flex-1 h-12 border-2 rounded-xl px-4 font-black text-xs bg-white dark:bg-black/40 outline-none focus:border-primary" placeholder="URL Logo..." value={localSettings?.logoUrl || ''} onChange={e => localSettings && setLocalSettings({...localSettings, logoUrl: e.target.value})} />
                      </div>
                   </div>
                   <div className="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Favicon</label>
                      <div className="flex items-center gap-4">
                         <div className="size-20 shrink-0 bg-white dark:bg-black/40 rounded-2xl overflow-hidden border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center relative">
                            {localSettings?.faviconUrl ? <img src={localSettings.faviconUrl} className="size-10 object-contain" /> : <span className="material-symbols-outlined text-gray-300 text-3xl font-black">token</span>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" accept="image/x-icon,image/png,image/svg+xml" disabled={isUploading} onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if(file && localSettings) { try { const url = await handleFileUpload(file); setLocalSettings({...localSettings, faviconUrl: url}); } catch(e) {} }
                            }} />
                         </div>
                         <input className="flex-1 h-12 border-2 rounded-xl px-4 font-black text-xs bg-white dark:bg-black/40 outline-none focus:border-primary" placeholder="URL Favicon..." value={localSettings?.faviconUrl || ''} onChange={e => localSettings && setLocalSettings({...localSettings, faviconUrl: e.target.value})} />
                      </div>
                   </div>
                </div>

                <SectionHeader title="Tema & Tipografi" icon="palette" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Warna Utama</label>
                     <select className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.themeColor || 'Green'} onChange={e => localSettings && setLocalSettings({...localSettings, themeColor: e.target.value})}>
                       {Object.keys(THEME_COLORS).map(theme => <option key={theme} value={theme}>{theme}</option>)}
                     </select>
                   </div>
                   <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Gaya Font</label>
                     <select className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black" value={localSettings?.themeFont || 'Default'} onChange={e => localSettings && setLocalSettings({...localSettings, themeFont: e.target.value})}>
                       {Object.keys(FONT_THEMES).map(font => <option key={font} value={font}>{font}</option>)}
                     </select>
                   </div>
                </div>

                <SectionHeader title="Promotions & Countdown" icon="campaign" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 p-8 bg-primary/5 rounded-[32px] border border-primary/10">
                   <div className="flex flex-col gap-2 md:col-span-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Label Promo</label>
                     <input className="h-14 border-2 rounded-2xl px-6 bg-white dark:bg-black/40 outline-none focus:border-primary font-black" placeholder="Contoh: LIMITED TIME OFFER" value={localSettings?.promoLabel || ''} onChange={e => localSettings && setLocalSettings({...localSettings, promoLabel: e.target.value})} />
                   </div>
                   <div className="flex flex-col gap-2 md:col-span-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Judul Promo (Hapus untuk menyembunyikan)</label>
                     <input className="h-14 border-2 rounded-2xl px-6 bg-white dark:bg-black/40 outline-none focus:border-primary font-black" placeholder="Flash Sale: 30% Off Everything!" value={localSettings?.promoTitle || ''} onChange={e => localSettings && setLocalSettings({...localSettings, promoTitle: e.target.value})} />
                   </div>
                   <div className="flex flex-col gap-2 md:col-span-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Deskripsi Promo</label>
                     <textarea className="h-24 border-2 rounded-2xl p-6 bg-white dark:bg-black/40 outline-none focus:border-primary font-black resize-none" value={localSettings?.promoSubtitle || ''} onChange={e => localSettings && setLocalSettings({...localSettings, promoSubtitle: e.target.value})} />
                   </div>
                   <div className="flex flex-col gap-2 md:col-span-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Waktu Berakhir</label>
                     <input type="datetime-local" className="h-14 border-2 rounded-2xl px-6 bg-white dark:bg-black/40 outline-none focus:border-primary font-black" value={localSettings?.promoEndAt ? new Date(localSettings.promoEndAt).toISOString().slice(0, 16) : ''} onChange={e => localSettings && setLocalSettings({...localSettings, promoEndAt: new Date(e.target.value).getTime()})} />
                   </div>
                </div>

                <SectionHeader title="Umum & Hero" icon="home" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nama Toko</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" value={localSettings?.siteName} onChange={e => localSettings && setLocalSettings({...localSettings, siteName: e.target.value})} /></div>
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Hero Title</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" value={localSettings?.heroTitle} onChange={e => localSettings && setLocalSettings({...localSettings, heroTitle: e.target.value})} /></div>
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Hero Subtitle</label><textarea className="h-24 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none font-black resize-none" value={localSettings?.heroSubtitle} onChange={e => localSettings && setLocalSettings({...localSettings, heroSubtitle: e.target.value})} /></div>
                  <div className="flex flex-col gap-4 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Hero Image</label>
                    <div className="flex items-center gap-6">
                       <div className="size-24 shrink-0 bg-white dark:bg-black/40 rounded-3xl overflow-hidden border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center relative shadow-sm">
                          {localSettings?.heroImage ? <img src={localSettings.heroImage} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-gray-300 font-black">image</span>}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" accept="image/*" disabled={isUploading} onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if(file && localSettings) { try { const url = await handleFileUpload(file); setLocalSettings({...localSettings, heroImage: url}); } catch(e) {} }
                          }} />
                       </div>
                       <input className="flex-1 h-12 border-2 rounded-xl px-4 font-black text-xs bg-white dark:bg-black/40 outline-none focus:border-primary" placeholder="URL Hero Image..." value={localSettings?.heroImage || ''} onChange={e => localSettings && setLocalSettings({...localSettings, heroImage: e.target.value})} />
                    </div>
                  </div>
                </div>

                <SectionHeader title="Footer & Deskripsi" icon="vertical_align_bottom" />
                <div className="grid grid-cols-1 gap-6 mb-10">
                  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Deskripsi Footer (Muncul di bagian bawah toko)</label><textarea className="h-32 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none font-black resize-none" value={localSettings?.footerDescription} onChange={e => localSettings && setLocalSettings({...localSettings, footerDescription: e.target.value})} /></div>
                </div>

                <SectionHeader title="Konten Halaman About Us" icon="info" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-gray-50 dark:bg-black/10 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Judul Header (Banner)</label><input className="h-14 border-2 rounded-2xl px-6 bg-white dark:bg-black/40 outline-none font-black" value={localSettings?.aboutHeaderTitle} onChange={e => localSettings && setLocalSettings({...localSettings, aboutHeaderTitle: e.target.value})} /></div>
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Deskripsi Header</label><textarea className="h-24 border-2 rounded-2xl p-6 bg-white dark:bg-black/40 outline-none font-black resize-none" value={localSettings?.aboutHeaderDesc} onChange={e => localSettings && setLocalSettings({...localSettings, aboutHeaderDesc: e.target.value})} /></div>
                  
                  <div className="flex flex-col gap-2 md:col-span-2 mt-4"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Judul Section Utama</label><input className="h-14 border-2 rounded-2xl px-6 bg-white dark:bg-black/40 outline-none font-black" value={localSettings?.aboutSectionTitle} onChange={e => localSettings && setLocalSettings({...localSettings, aboutSectionTitle: e.target.value})} /></div>
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Deskripsi Section Utama</label><textarea className="h-48 border-2 rounded-2xl p-6 bg-white dark:bg-black/40 outline-none font-black resize-none" value={localSettings?.aboutSectionDesc} onChange={e => localSettings && setLocalSettings({...localSettings, aboutSectionDesc: e.target.value})} /></div>
                  
                  <div className="flex flex-col gap-4 md:col-span-2 mt-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Gambar Section About Us</label>
                      <div className="flex items-center gap-6">
                         <div className="size-24 shrink-0 bg-white dark:bg-black/40 rounded-3xl overflow-hidden border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center relative shadow-sm">
                            {localSettings?.aboutSectionImage ? <img src={localSettings.aboutSectionImage} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-gray-300 font-black">image</span>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" accept="image/*" disabled={isUploading} onChange={async (e) => {
                               const file = e.target.files?.[0];
                               if(file && localSettings) { try { const url = await handleFileUpload(file); setLocalSettings({...localSettings, aboutSectionImage: url}); } catch(e) {} }
                            }} />
                         </div>
                         <input className="flex-1 h-12 border-2 rounded-xl px-4 font-black text-xs bg-white dark:bg-black/40 outline-none focus:border-primary" placeholder="URL Gambar..." value={localSettings?.aboutSectionImage || ''} onChange={e => localSettings && setLocalSettings({...localSettings, aboutSectionImage: e.target.value})} />
                      </div>
                   </div>
                </div>

                <SectionHeader title="Kontak & Media Sosial" icon="contacts" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Email Bisnis</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" value={localSettings?.contactEmail} onChange={e => localSettings && setLocalSettings({...localSettings, contactEmail: e.target.value})} /></div>
                  <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">WhatsApp Bisnis (62...)</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" value={localSettings?.contactPhone} onChange={e => localSettings && setLocalSettings({...localSettings, contactPhone: e.target.value})} /></div>
                  <div className="flex flex-col gap-2 md:col-span-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Alamat Fisik / Kota</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" value={localSettings?.contactAddress} onChange={e => localSettings && setLocalSettings({...localSettings, contactAddress: e.target.value})} /></div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">URL Instagram</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="https://instagram.com/..." value={localSettings?.instagramUrl} onChange={e => localSettings && setLocalSettings({...localSettings, instagramUrl: e.target.value})} /></div>
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">URL TikTok</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="https://tiktok.com/@..." value={localSettings?.tiktokUrl} onChange={e => localSettings && setLocalSettings({...localSettings, tiktokUrl: e.target.value})} /></div>
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">URL Facebook</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="https://facebook.com/..." value={localSettings?.facebookUrl} onChange={e => localSettings && setLocalSettings({...localSettings, facebookUrl: e.target.value})} /></div>
                    <div className="flex flex-col gap-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">URL YouTube</label><input className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="https://youtube.com/..." value={localSettings?.youtubeUrl} onChange={e => localSettings && setLocalSettings({...localSettings, youtubeUrl: e.target.value})} /></div>
                  </div>
                </div>

                <button disabled={isSaving} className="h-16 bg-primary text-black rounded-2xl font-black text-lg shadow-xl shadow-primary/20 mt-10 hover:scale-[1.01] transition-transform">
                   {isSaving ? 'Menyimpan...' : 'SIMPAN SEMUA PENGATURAN'}
                </button>
             </form>
          </div>
        ) : activeTab === 'social_proof' ? (
          <div className="bg-white dark:bg-[#1a2e1a] p-6 md:p-12 rounded-[40px] border border-gray-100 dark:border-gray-800 max-w-5xl mx-auto shadow-sm">
            <form onSubmit={async (e) => { 
                e.preventDefault(); if(!localSettings) return; setIsSaving(true);
                try { await dbService.saveSiteSettings(localSettings); alert('Berhasil disimpan!'); refreshData(); } catch(err: any) { alert('Gagal: ' + err.message); } finally { setIsSaving(false); }
             }} className="flex flex-col gap-8">
                <div className="flex items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/10">
                   <div>
                      <h3 className="font-black text-lg">Aktifkan Social Proof</h3>
                      <p className="text-gray-400 text-xs font-medium">Munculkan notifikasi pembelian palsu/nyata untuk meningkatkan kepercayaan.</p>
                   </div>
                   <div className="relative inline-flex items-center cursor-pointer" onClick={() => localSettings && setLocalSettings({...localSettings, isSocialProofEnabled: !localSettings.isSocialProofEnabled})}>
                      <div className={`w-14 h-8 rounded-full transition-colors ${localSettings?.isSocialProofEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-800'}`}></div>
                      <div className={`absolute left-1 top-1 size-6 bg-white rounded-full transition-transform ${localSettings?.isSocialProofEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex flex-col gap-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Daftar Nama Customer (Satu per baris)</label>
                      <textarea 
                        className="h-64 border-2 rounded-[32px] p-6 bg-gray-50 dark:bg-black/20 outline-none focus:border-primary font-black resize-none"
                        placeholder="Budi&#10;Siti&#10;Andi..."
                        value={localSettings?.socialProofNames || ''}
                        onChange={e => localSettings && setLocalSettings({...localSettings, socialProofNames: e.target.value})}
                      />
                   </div>
                   <div className="flex flex-col gap-4">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Produk Yang Ditampilkan</label>
                      <div className="h-64 border-2 rounded-[32px] p-6 bg-gray-50 dark:bg-black/20 overflow-y-auto no-scrollbar flex flex-col gap-3">
                         {products.map(p => (
                            <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                               <input 
                                 type="checkbox"
                                 className="size-5 rounded-lg text-primary focus:ring-primary border-gray-300 dark:border-gray-800"
                                 checked={localSettings?.socialProofProductIds?.includes(p.id)}
                                 onChange={e => {
                                    if(!localSettings) return;
                                    const current = localSettings.socialProofProductIds || [];
                                    const next = e.target.checked ? [...current, p.id] : current.filter(id => id !== p.id);
                                    setLocalSettings({...localSettings, socialProofProductIds: next});
                                 }}
                               />
                               <span className="text-sm font-black text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">{p.name}</span>
                            </label>
                         ))}
                         {products.length === 0 && <p className="text-gray-400 text-xs italic text-center py-10">Belum ada produk</p>}
                      </div>
                   </div>
                </div>

                <button disabled={isSaving} className="h-16 bg-primary text-black rounded-2xl font-black text-lg shadow-xl shadow-primary/20 mt-4 hover:scale-[1.01] transition-transform">
                   {isSaving ? 'Menyimpan...' : 'SIMPAN PENGATURAN SOCIAL PROOF'}
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
             <h3 className="text-2xl font-black mb-6">Keamanan Akun</h3>
             <form onSubmit={async (e) => { 
                e.preventDefault(); setIsSaving(true);
                try { await dbService.saveAdminCredentials(adminCreds); alert('Berhasil diperbarui!'); } catch(err: any) { alert('Gagal: ' + err.message); } finally { setIsSaving(false); }
             }} className="flex flex-col gap-4 text-left">
                <input required className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="Username Baru" value={adminCreds.username} onChange={e => setAdminCreds({...adminCreds, username: e.target.value})} />
                <input required type="password" className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="Password Baru" value={adminCreds.password} onChange={e => setAdminCreds({...adminCreds, password: e.target.value})} />
                <button disabled={isSaving} className="h-16 bg-primary text-black rounded-2xl font-black mt-4">
                   {isSaving ? 'Memproses...' : 'SIMPAN AKSES'}
                </button>
             </form>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-white dark:bg-background-dark rounded-[40px] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-3xl font-black tracking-tight">{activeTab === 'products' ? 'Data Produk' : 'Input Data'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="size-12 flex items-center justify-center rounded-full bg-gray-50 dark:bg-black/20 hover:bg-red-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
             </div>

             {activeTab === 'products' ? (
               <form onSubmit={handleSaveProduct} className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input required className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="Nama Barang" value={editingProduct?.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                    <input required className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="Kategori" value={editingProduct?.category || ''} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} />
                    <textarea required className="h-32 md:col-span-2 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none font-black resize-none" placeholder="Deskripsi" value={editingProduct?.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Harga Utama (Coret jika ada promo)</label>
                       <input type="number" className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" placeholder="Harga Coret (Original Price)" value={editingProduct?.originalPrice || ''} onChange={e => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) || undefined })} />
                    </div>

                    {/* FEATURED TOGGLE */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Tampilkan di Beranda</label>
                      <div className="flex items-center gap-3 h-14 bg-primary/5 border border-primary/10 rounded-2xl px-6">
                        <input 
                          type="checkbox" 
                          id="isFeatured" 
                          className="size-6 rounded-lg text-primary focus:ring-primary border-gray-300 dark:border-gray-800"
                          checked={!!editingProduct?.isFeatured}
                          onChange={e => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                        />
                        <label htmlFor="isFeatured" className="text-xs font-black uppercase tracking-widest cursor-pointer select-none">
                          Featured Selection
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* MEDIA UTAMA SECTION */}
                  <div className="p-8 bg-primary/5 border border-primary/10 rounded-[32px] space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-widest text-primary">Media Utama (Sampul)</h4>
                        <div className="flex gap-2">
                           <button type="button" onClick={() => setEditingProduct(p => ({...p, coverMedia: { type: 'image', url: p.coverMedia?.url || '' }}))} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${editingProduct?.coverMedia?.type !== 'video' ? 'bg-primary text-black' : 'bg-gray-200 dark:bg-gray-800'}`}>Image</button>
                           <button type="button" onClick={() => setEditingProduct(p => ({...p, coverMedia: { type: 'video', url: p.coverMedia?.url || '' }}))} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${editingProduct?.coverMedia?.type === 'video' ? 'bg-primary text-black' : 'bg-gray-200 dark:bg-gray-800'}`}>Video</button>
                        </div>
                     </div>
                     <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative size-40 shrink-0 rounded-[32px] bg-white dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden">
                           {editingProduct?.coverMedia?.url ? (
                             editingProduct.coverMedia.type === 'video' ? <span className="material-symbols-outlined text-4xl text-primary">videocam</span> : <img src={editingProduct.coverMedia.url} className="absolute inset-0 w-full h-full object-contain" />
                           ) : <span className="material-symbols-outlined text-gray-300 font-black">media_output_lib</span>}
                           <input type="file" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" accept="image/*,video/*" disabled={isUploading} onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if(file) { 
                               try { 
                                 const type = file.type.startsWith('video/') ? 'video' : 'image';
                                 const url = await handleFileUpload(file); 
                                 setEditingProduct(p => ({ ...p, coverMedia: { type, url }, image: url })); 
                               } catch(e) {} 
                             }
                           }} />
                        </div>
                        <input className="flex-1 h-14 border-2 rounded-2xl px-6 bg-white dark:bg-black/40 outline-none font-black" placeholder="Atau paste URL media manual..." value={editingProduct?.coverMedia?.url || ''} onChange={e => setEditingProduct({ ...editingProduct, coverMedia: { type: editingProduct?.coverMedia?.type || 'image', url: e.target.value }, image: e.target.value })} />
                     </div>
                  </div>

                  {/* GALLERY SECTION */}
                  <div className="p-8 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800 rounded-[32px] space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Galeri Media Tambahan (Maks 9)</h4>
                        <button type="button" onClick={handleAddGalleryItem} className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline">+ Tambah Media</button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {editingProduct?.gallery?.map((m, idx) => (
                           <div key={idx} className="bg-white dark:bg-black/20 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                 <div className="flex gap-2">
                                    <button type="button" onClick={() => handleUpdateGalleryItem(idx, { type: 'image' })} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${m.type !== 'video' ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-gray-800'}`}>Image</button>
                                    <button type="button" onClick={() => handleUpdateGalleryItem(idx, { type: 'video' })} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${m.type === 'video' ? 'bg-primary text-black' : 'bg-gray-100 dark:bg-gray-800'}`}>Video</button>
                                 </div>
                                 <button type="button" onClick={() => handleRemoveGalleryItem(idx)} className="text-red-500 font-black text-[8px] uppercase tracking-widest hover:underline">Hapus</button>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="relative size-16 shrink-0 rounded-xl bg-gray-50 dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden">
                                    {m.url ? (
                                       m.type === 'video' ? <span className="material-symbols-outlined text-primary">play_circle</span> : <img src={m.url} className="w-full h-full object-cover" />
                                    ) : <span className="material-symbols-outlined text-gray-300">image</span>}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" accept="image/*,video/*" disabled={isUploading} onChange={async (e) => {
                                       const file = e.target.files?.[0];
                                       if(file) { 
                                          try { 
                                             const type = file.type.startsWith('video/') ? 'video' : 'image';
                                             const url = await handleFileUpload(file); 
                                             handleUpdateGalleryItem(idx, { type, url });
                                          } catch(e) {} 
                                       }
                                    }} />
                                 </div>
                                 <input className="flex-1 h-10 border-2 rounded-xl px-4 bg-white dark:bg-black/40 outline-none font-bold text-[10px]" placeholder="URL media..." value={m.url} onChange={e => handleUpdateGalleryItem(idx, { url: e.target.value })} />
                              </div>
                           </div>
                        ))}
                        {(!editingProduct?.gallery || editingProduct.gallery.length === 0) && (
                           <div className="md:col-span-2 py-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-center text-gray-400 font-bold text-xs uppercase tracking-widest italic">
                              Belum ada media galeri
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Varian Harga & Stok</label>
                        <button type="button" onClick={() => setEditingProduct(p => ({...p, variations: [...(p?.variations || []), { id: Date.now().toString(), name: '', price: 0, stock: 10 }]}))} className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline">+ Tambah Varian</button>
                     </div>
                     <div className="space-y-3">
                       {editingProduct?.variations?.map((v) => (
                         <div key={v.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl items-center">
                           <input required placeholder="Nama Varian" className="bg-white dark:bg-black/20 rounded-xl h-12 px-4 font-black text-sm" value={v.name} onChange={e => setEditingProduct(p => ({...p, variations: p?.variations?.map(it => it.id === v.id ? {...it, name: e.target.value} : it)}))} />
                           <input required type="number" placeholder="Harga Jual" className="bg-white dark:bg-black/20 rounded-xl h-12 px-4 font-black text-sm" value={v.price} onChange={e => setEditingProduct(p => ({...p, variations: p?.variations?.map(it => it.id === v.id ? {...it, price: Number(e.target.value)} : it)}))} />
                           <input type="number" placeholder="Harga Coret" className="bg-white dark:bg-black/20 rounded-xl h-12 px-4 font-black text-sm" value={v.originalPrice || ''} onChange={e => setEditingProduct(p => ({...p, variations: p?.variations?.map(it => it.id === v.id ? {...it, originalPrice: Number(e.target.value) || undefined} : it)}))} />
                           <input required type="number" placeholder="Stok" className="bg-white dark:bg-black/20 rounded-xl h-12 px-4 font-black text-sm" value={v.stock} onChange={e => setEditingProduct(p => ({...p, variations: p?.variations?.map(it => it.id === v.id ? {...it, stock: Number(e.target.value)} : it)}))} />
                           <button type="button" onClick={() => setEditingProduct(p => ({...p, variations: p?.variations?.filter(it => it.id !== v.id)}))} className="text-red-500 font-black text-[10px] uppercase">Hapus</button>
                         </div>
                       ))}
                     </div>
                  </div>

                  <button type="submit" disabled={isSaving} className="h-16 bg-primary text-black rounded-2xl font-black text-xl shadow-xl shadow-primary/20">
                    {isSaving ? 'Menyimpan...' : 'SIMPAN PRODUK'}
                  </button>
               </form>
             ) : activeTab === 'cs' ? (
               <form onSubmit={async (e) => { 
                  e.preventDefault(); if(!editingCS) return; setIsSaving(true);
                  try { await dbService.saveCSContact(editingCS as CSContact); refreshData(); setIsModalOpen(false); } catch(err: any) { alert('Gagal: ' + err.message); } finally { setIsSaving(false); }
               }} className="flex flex-col gap-6">
                  <input required placeholder="Nama Admin" className="h-16 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black text-lg" value={editingCS?.name || ''} onChange={e => setEditingCS({ ...editingCS, name: e.target.value })} />
                  <input required placeholder="No WhatsApp (628...)" className="h-16 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black text-lg" value={editingCS?.phoneNumber || ''} onChange={e => setEditingCS({ ...editingCS, phoneNumber: e.target.value })} />
                  <button disabled={isSaving} className="h-16 bg-primary text-black rounded-2xl font-black text-xl shadow-xl shadow-primary/20">
                    {isSaving ? 'Menyimpan...' : 'SIMPAN KONTAK'}
                  </button>
               </form>
             ) : (
               <form onSubmit={async (e) => { 
                  e.preventDefault(); if(!editingTestimonial) return; setIsSaving(true);
                  try { await dbService.saveTestimonial(editingTestimonial as Testimonial); refreshData(); setIsModalOpen(false); } catch(err: any) { alert('Gagal: ' + err.message); } finally { setIsSaving(false); }
               }} className="flex flex-col gap-6">
                 <div className="flex flex-col md:flex-row gap-6 items-center border-2 p-6 rounded-[32px] bg-gray-50 dark:bg-black/10">
                    <div className="relative aspect-[3/4] w-32 shrink-0 rounded-2xl bg-white dark:bg-black/20 border-2 border-dashed flex items-center justify-center overflow-hidden">
                        {editingTestimonial?.imageUrl ? <img src={editingTestimonial.imageUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-gray-200">photo_camera</span>}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" accept="image/*" disabled={isUploading} onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if(file) { try { const url = await handleFileUpload(file); setEditingTestimonial({...editingTestimonial, imageUrl: url}); } catch(e) {} }
                        }} />
                    </div>
                    <input className="flex-1 h-14 border-2 rounded-xl px-4 font-black text-sm" placeholder="Atau paste URL foto manual..." value={editingTestimonial?.imageUrl || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, imageUrl: e.target.value })} />
                 </div>
                 <input placeholder="Nama Pelanggan" className="h-16 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 outline-none font-black" value={editingTestimonial?.customerName || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, customerName: e.target.value })} />
                 <textarea placeholder="Isi Review" className="h-32 border-2 rounded-2xl p-6 bg-gray-50 dark:bg-black/20 outline-none font-black resize-none" value={editingTestimonial?.description || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, description: e.target.value })} />
                 <button disabled={isSaving} className="h-16 bg-primary text-black rounded-2xl font-black text-xl shadow-xl shadow-primary/20">
                    {isSaving ? 'Menyimpan...' : 'SIMPAN TESTIMONI'}
                 </button>
               </form>
             )}
          </div>
        </div>
      )}

      {/* IMAGE GUIDE MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowGuide(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-background-dark rounded-[40px] p-10 shadow-2xl overflow-y-auto max-h-[85vh] no-scrollbar">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-primary font-black">help_center</span>
                   <h2 className="text-2xl font-black tracking-tight">Panduan Ukuran & Upload Media</h2>
                </div>
                <button onClick={() => setShowGuide(false)} className="size-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-black/20 hover:bg-red-500 hover:text-white transition-colors">
                   <span className="material-symbols-outlined text-sm">close</span>
                </button>
             </div>
             
             <div className="space-y-8 text-sm">
                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                   <h4 className="font-black text-primary uppercase text-[10px] tracking-widest mb-3">Foto Produk Utama</h4>
                   <p className="font-medium text-gray-500 dark:text-gray-400 mb-2">Rekomendasi rasio Portrait (4:5).</p>
                   <p className="text-xs text-gray-400">Gunakan ukuran minimal 800 x 1000 px agar terlihat tajam di semua perangkat. Pastikan latar belakang bersih.</p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                   <h4 className="font-black text-primary uppercase text-[10px] tracking-widest mb-3">Hero / Banner Beranda</h4>
                   <p className="font-medium text-gray-500 dark:text-gray-400 mb-2">Rekomendasi rasio Landscape (16:9).</p>
                   <p className="text-xs text-gray-400">Gunakan ukuran minimal 1280 x 720 px. Pastikan bagian tengah gambar tidak terlalu ramai karena akan tertutup teks judul.</p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                   <h4 className="font-black text-primary uppercase text-[10px] tracking-widest mb-3">Foto Testimoni</h4>
                   <p className="font-medium text-gray-500 dark:text-gray-400 mb-2">Rekomendasi rasio Portrait (4:5).</p>
                   <p className="text-xs text-gray-400">Gunakan foto asli dari pelanggan. Ukuran 800 x 1000 px sudah sangat cukup.</p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                   <h4 className="font-black text-primary uppercase text-[10px] tracking-widest mb-3">Logo Website</h4>
                   <p className="font-medium text-gray-500 dark:text-gray-400 mb-2">Rekomendasi file PNG Transparan atau SVG.</p>
                   <p className="text-xs text-gray-400">Gunakan logo dengan latar belakang kosong agar menyatu dengan header transparan. Gunakan ukuran 250 x 100px hingga 400 x 100 px untuk format horizontal, atau sekitar 200 x 200 px untuk format persegi</p>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-gray-800">
                   <h4 className="font-black text-primary uppercase text-[10px] tracking-widest mb-3">Cara Upload Gambar</h4>
                   <p className="font-medium text-gray-500 dark:text-gray-400 mb-2">Unggah media menggunakan mekanisme aman (HMAC Signed Upload).</p>
                   <p className="text-xs text-gray-400">Sistem sekarang menggunakan autentikasi server-side untuk menjamin keamanan upload. Anda dapat melihat progres upload di bagian atas layar saat proses berlangsung.</p>
                </div>
             </div>

             <button onClick={() => setShowGuide(false)} className="w-full h-14 bg-primary text-black rounded-2xl font-black mt-8 hover:brightness-110 transition-all">
                MENGERTI, TERIMA KASIH
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
