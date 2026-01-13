
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';
import { Product, CSContact, Media, Variation, SiteSettings, Testimonial, AdminCredentials } from '../../types';
import { useStore } from '../../App';

// Access environment variables using process.env as per project configuration
const IK_PUBLIC_KEY = process.env.VITE_IMAGEKIT_PUBLIC_KEY || '';
const IK_URL_ENDPOINT = process.env.VITE_IMAGEKIT_URL_ENDPOINT || '';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'cs' | 'site' | 'testimonials' | 'security'>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCS, setEditingCS] = useState<Partial<CSContact> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [localSettings, setLocalSettings] = useState<SiteSettings | null>(null);
  const [adminCreds, setAdminCreds] = useState<AdminCredentials>({ username: '', password: '' });
  const [isUploading, setIsUploading] = useState(false);
  
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
    if (!IK_PUBLIC_KEY || !IK_URL_ENDPOINT) {
      alert('Error: Kredensial ImageKit belum diatur di Environment Variables.');
      throw new Error('Missing IK Credentials');
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('publicKey', IK_PUBLIC_KEY);
      formData.append('useUniqueFileName', 'true');
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unggahan gagal');
      return result.url;
    } catch (error) {
      alert('Gagal mengunggah gambar ke ImageKit.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadToImageKit(file);
      const media: Media = { type: file.type.startsWith('video') ? 'video' : 'image', url };
      if (isCover) setEditingProduct(prev => ({ ...prev, coverMedia: media, image: url }));
      else setEditingProduct(prev => {
        const gallery = [...(prev?.gallery || [])];
        if (index !== undefined) gallery[index] = media;
        else gallery.push(media);
        return { ...prev, gallery };
      });
    } catch (err) {}
  };

  const handleAddVariation = () => {
    const newVar: Variation = { id: Date.now().toString(), name: '', price: 0, stock: 10 };
    setEditingProduct(prev => ({
      ...prev,
      variations: [...(prev?.variations || []), newVar]
    }));
  };

  const updateVariation = (id: string, field: keyof Variation, value: any) => {
    setEditingProduct(prev => ({
      ...prev,
      variations: prev?.variations?.map(v => v.id === id ? { ...v, [field]: value } : v)
    }));
  };

  const removeVariation = (id: string) => {
    setEditingProduct(prev => ({
      ...prev,
      variations: prev?.variations?.filter(v => v.id !== id)
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const basePrice = editingProduct.variations?.[0]?.price || Number(editingProduct.price) || 0;
    const product: Product = {
      id: editingProduct.id || Date.now().toString(),
      name: editingProduct.name || '',
      description: editingProduct.description || '',
      price: basePrice,
      category: editingProduct.category || 'General',
      image: editingProduct.coverMedia?.url || editingProduct.image || '',
      coverMedia: editingProduct.coverMedia || { type: 'image', url: '' },
      gallery: editingProduct.gallery || [],
      variations: editingProduct.variations || [],
      isFeatured: !!editingProduct.isFeatured,
      createdAt: editingProduct.createdAt || Date.now()
    };
    await dbService.saveProduct(product);
    refreshData();
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveCS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCS) return;
    const contact: CSContact = {
      id: editingCS.id || Date.now().toString(),
      name: editingCS.name || '',
      phoneNumber: editingCS.phoneNumber || '',
      isActive: editingCS.isActive ?? true
    };
    await dbService.saveCSContact(contact);
    refreshData();
    setIsModalOpen(false);
    setEditingCS(null);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    const testimonial: Testimonial = {
      id: editingTestimonial.id || Date.now().toString(),
      imageUrl: editingTestimonial.imageUrl || '',
      customerName: editingTestimonial.customerName,
      isActive: editingTestimonial.isActive ?? true
    };
    await dbService.saveTestimonial(testimonial);
    refreshData();
    setIsModalOpen(false);
    setEditingTestimonial(null);
  };

  return (
    <div className="px-4 md:px-10 lg:px-40 py-10 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Admin Panel</h1>
            <p className="text-gray-400 mt-1 font-medium uppercase text-xs tracking-widest">Store Management</p>
          </div>
          <div className="flex gap-4">
            {activeTab === 'products' && (
              <button onClick={() => { setEditingProduct({ gallery: [], variations: [], isFeatured: false }); setIsModalOpen(true); }} className="h-12 px-6 bg-primary text-[#111811] rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">add</span> Produk Baru
              </button>
            )}
            <button onClick={handleLogout} className="h-12 px-6 border border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:bg-red-50 hover:text-red-500 transition-all">Logout</button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto no-scrollbar">
          {['products', 'testimonials', 'cs', 'site', 'security'].map(tab => (
            <button key={tab} className={`px-8 py-4 font-black text-sm uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'border-b-4 border-primary text-primary' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => setActiveTab(tab as any)}>
              {tab === 'products' ? 'Produk' : tab === 'testimonials' ? 'Testimoni' : tab === 'cs' ? 'CS' : tab === 'site' ? 'Situs' : 'Keamanan'}
            </button>
          ))}
        </div>

        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white dark:bg-[#1a2e1a] p-5 rounded-3xl flex flex-col md:flex-row items-center gap-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <img src={p.coverMedia?.url || p.image} className="size-24 shrink-0 rounded-2xl object-cover bg-gray-50 dark:bg-black/20" />
                <div className="flex-1">
                  <h4 className="text-xl font-black">{p.name}</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{p.category}</p>
                  <p className="text-primary font-black text-lg mt-1">Rp {p.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl hover:text-primary transition-all"><span className="material-symbols-outlined">edit</span></button>
                  <button onClick={() => { if(confirm('Hapus produk ini?')) dbService.deleteProduct(p.id).then(refreshData) }} className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl hover:text-red-500 transition-all"><span className="material-symbols-outlined">delete</span></button>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'testimonials' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <button onClick={() => { setEditingTestimonial({ isActive: true }); setIsModalOpen(true); }} className="flex flex-col items-center justify-center aspect-[3/4] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary text-gray-400 hover:text-primary transition-all">
              <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
              <p className="text-[10px] font-black uppercase">Tambah</p>
            </button>
            {testimonials.map(t => (
              <div key={t.id} className="relative bg-white dark:bg-[#1a2e1a] rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden group">
                <img src={t.imageUrl} className="w-full aspect-[3/4] object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                   <button onClick={() => { setEditingTestimonial(t); setIsModalOpen(true); }} className="size-12 bg-white text-black rounded-full flex items-center justify-center"><span className="material-symbols-outlined">edit</span></button>
                   <button onClick={() => { if(confirm('Hapus?')) dbService.deleteTestimonial(t.id).then(refreshData) }} className="size-12 bg-red-500 text-white rounded-full flex items-center justify-center"><span className="material-symbols-outlined">delete</span></button>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'cs' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => { setEditingCS({ isActive: true }); setIsModalOpen(true); }} className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl text-gray-400 hover:border-primary hover:text-primary transition-all">
               <span className="material-symbols-outlined text-4xl">person_add</span>
               <p className="font-black mt-2">Tambah CS</p>
             </button>
             {csContacts.map(c => (
               <div key={c.id} className="bg-white dark:bg-[#1a2e1a] p-6 rounded-3xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
                 <div><h4 className="font-black text-lg">{c.name}</h4><p className="text-gray-400">+{c.phoneNumber}</p></div>
                 <div className="flex gap-2">
                    <button onClick={() => { setEditingCS(c); setIsModalOpen(true); }} className="p-3 hover:text-primary"><span className="material-symbols-outlined">edit</span></button>
                    <button onClick={() => { if(confirm('Hapus?')) dbService.deleteCSContact(c.id).then(refreshData) }} className="p-3 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                 </div>
               </div>
             ))}
          </div>
        ) : activeTab === 'security' ? (
          <div className="max-w-md mx-auto bg-white dark:bg-[#1a2e1a] p-10 rounded-[40px] border border-gray-100 dark:border-gray-800">
             <h3 className="text-2xl font-black mb-6 text-center">Update Password</h3>
             <form onSubmit={e => { e.preventDefault(); dbService.saveAdminCredentials(adminCreds).then(() => alert('Tersimpan!')); }} className="flex flex-col gap-6">
                <input required className="h-14 border-2 rounded-2xl px-6 dark:bg-black/20 outline-none focus:border-primary font-bold" value={adminCreds.username} onChange={e => setAdminCreds({...adminCreds, username: e.target.value})} placeholder="Username" />
                <input required type="password" className="h-14 border-2 rounded-2xl px-6 dark:bg-black/20 outline-none focus:border-primary font-bold" value={adminCreds.password} onChange={e => setAdminCreds({...adminCreds, password: e.target.value})} placeholder="Password Baru" />
                <button className="h-16 bg-red-500 text-white rounded-2xl font-black text-lg">Simpan Kredensial</button>
             </form>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white dark:bg-[#1a2e1a] p-10 rounded-[40px] border border-gray-100 dark:border-gray-800">
             <form onSubmit={e => { e.preventDefault(); if(localSettings) dbService.saveSiteSettings(localSettings).then(() => { refreshData(); alert('Berhasil!'); }); }} className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="flex flex-col gap-2"><label className="text-xs font-black text-gray-400">Nama Website</label><input className="h-12 border-2 rounded-xl px-4 dark:bg-black/20 outline-none focus:border-primary font-bold" value={localSettings?.siteName} onChange={e => localSettings && setLocalSettings({...localSettings, siteName: e.target.value})} /></div>
                   <div className="flex flex-col gap-2"><label className="text-xs font-black text-gray-400">Logo URL</label><input className="h-12 border-2 rounded-xl px-4 dark:bg-black/20 outline-none focus:border-primary font-bold" value={localSettings?.logoUrl} onChange={e => localSettings && setLocalSettings({...localSettings, logoUrl: e.target.value})} /></div>
                   <div className="md:col-span-2 flex flex-col gap-2"><label className="text-xs font-black text-gray-400">Hero Image URL</label><input className="h-12 border-2 rounded-xl px-4 dark:bg-black/20 outline-none focus:border-primary font-bold" value={localSettings?.heroImage} onChange={e => localSettings && setLocalSettings({...localSettings, heroImage: e.target.value})} /></div>
                   <div className="md:col-span-2 flex flex-col gap-2"><label className="text-xs font-black text-gray-400">Hero Title</label><textarea className="h-24 border-2 rounded-xl p-4 dark:bg-black/20 outline-none focus:border-primary font-bold resize-none" value={localSettings?.heroTitle} onChange={e => localSettings && setLocalSettings({...localSettings, heroTitle: e.target.value})} /></div>
                </div>
                <button className="h-16 bg-primary text-[#111811] rounded-2xl font-black text-lg">Update Pengaturan Situs</button>
             </form>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-white dark:bg-background-dark rounded-[40px] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
             <div className="flex justify-between items-center mb-10">
               <h2 className="text-4xl font-black tracking-tighter">
                 {activeTab === 'products' ? (editingProduct?.id ? 'Edit Produk' : 'Produk Baru') : 'Formulir'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="p-4 rounded-full bg-gray-50 dark:bg-black/20"><span className="material-symbols-outlined">close</span></button>
             </div>

             {activeTab === 'products' ? (
               <form onSubmit={handleSaveProduct} className="flex flex-col gap-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex flex-col gap-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nama Produk</label><input required className="h-14 border-2 rounded-2xl px-6 dark:bg-black/20 outline-none focus:border-primary font-bold" value={editingProduct?.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} /></div>
                   <div className="flex flex-col gap-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">Kategori</label><input required className="h-14 border-2 rounded-2xl px-6 dark:bg-black/20 outline-none focus:border-primary font-bold" value={editingProduct?.category || ''} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} /></div>
                   <div className="flex flex-col gap-2 md:col-span-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest">Deskripsi</label><textarea required className="h-32 border-2 rounded-2xl p-6 dark:bg-black/20 resize-none outline-none focus:border-primary font-bold" value={editingProduct?.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} /></div>
                   
                   <div className="flex flex-col gap-2 md:col-span-2">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Foto Utama</label>
                     <div className="relative aspect-video rounded-3xl bg-gray-50 dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden group">
                       {editingProduct?.coverMedia?.url || editingProduct?.image ? (
                         <img src={editingProduct.coverMedia?.url || editingProduct.image} className="absolute inset-0 w-full h-full object-contain" />
                       ) : <span className="material-symbols-outlined text-4xl text-gray-200">add_photo_alternate</span>}
                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleMediaUpload(e, true)} disabled={isUploading} />
                       {isUploading && <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white font-black">Uploading...</div>}
                     </div>
                   </div>

                   <div className="flex flex-col gap-4 md:col-span-2">
                     <div className="flex items-center justify-between">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Variasi Produk</label>
                       <button type="button" onClick={handleAddVariation} className="text-primary font-black text-xs uppercase flex items-center gap-1 hover:underline">
                         <span className="material-symbols-outlined text-sm">add</span> Tambah Variasi
                       </button>
                     </div>
                     <div className="flex flex-col gap-3">
                       {editingProduct?.variations?.map((v, idx) => (
                         <div key={v.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl items-center">
                           <input placeholder="Nama (Contoh: XL)" className="bg-white dark:bg-black/20 border-none rounded-xl h-10 px-4 font-bold text-sm" value={v.name} onChange={e => updateVariation(v.id, 'name', e.target.value)} />
                           <input type="number" placeholder="Harga" className="bg-white dark:bg-black/20 border-none rounded-xl h-10 px-4 font-bold text-sm" value={v.price} onChange={e => updateVariation(v.id, 'price', Number(e.target.value))} />
                           <input type="number" placeholder="Stok" className="bg-white dark:bg-black/20 border-none rounded-xl h-10 px-4 font-bold text-sm" value={v.stock} onChange={e => updateVariation(v.id, 'stock', Number(e.target.value))} />
                           <button type="button" onClick={() => removeVariation(v.id)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase">Hapus</button>
                         </div>
                       ))}
                     </div>
                   </div>
                   
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" checked={editingProduct?.isFeatured} onChange={e => setEditingProduct({...editingProduct, isFeatured: e.target.checked})} className="size-6 rounded-lg text-primary focus:ring-primary border-gray-200 dark:border-gray-800" />
                     <span className="font-black text-sm uppercase tracking-widest">Tampilkan di Halaman Utama</span>
                   </label>
                 </div>
                 <button type="submit" disabled={isUploading} className="h-16 bg-primary text-[#111811] rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-50">Simpan Produk Sekarang</button>
               </form>
             ) : activeTab === 'cs' ? (
               <form onSubmit={handleSaveCS} className="flex flex-col gap-6">
                  <input required placeholder="Nama CS" className="h-14 border-2 rounded-2xl px-6 dark:bg-black/20 outline-none focus:border-primary font-bold" value={editingCS?.name || ''} onChange={e => setEditingCS({ ...editingCS, name: e.target.value })} />
                  <input required placeholder="Nomor WA (62...)" className="h-14 border-2 rounded-2xl px-6 dark:bg-black/20 outline-none focus:border-primary font-bold" value={editingCS?.phoneNumber || ''} onChange={e => setEditingCS({ ...editingCS, phoneNumber: e.target.value })} />
                  <button className="h-16 bg-primary text-[#111811] rounded-2xl font-black text-lg">Simpan Kontak CS</button>
               </form>
             ) : (
               <form onSubmit={handleSaveTestimonial} className="flex flex-col gap-6">
                 <div className="relative aspect-square max-w-sm mx-auto rounded-3xl bg-gray-50 dark:bg-black/20 border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden">
                    {editingTestimonial?.imageUrl ? <img src={editingTestimonial.imageUrl} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => uploadToImageKit(e.target.files![0]).then(url => setEditingTestimonial({...editingTestimonial, imageUrl: url}))} />
                 </div>
                 <input placeholder="Nama Pelanggan" className="h-14 border-2 rounded-2xl px-6 dark:bg-black/20 outline-none focus:border-primary font-bold" value={editingTestimonial?.customerName || ''} onChange={e => setEditingTestimonial({ ...editingTestimonial, customerName: e.target.value })} />
                 <button className="h-16 bg-primary text-[#111811] rounded-2xl font-black text-lg">Simpan Testimoni</button>
               </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
