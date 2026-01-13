
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/dbService';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const creds = await dbService.getAdminCredentials();
      
      if (username === creds.username && password === creds.password) {
        localStorage.setItem('lumina_admin_auth', 'true');
        navigate('/admin');
      } else {
        alert('Username atau password salah!');
      }
    } catch (error) {
      alert('Gagal menghubungkan ke database.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1a2e1a] p-10 rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center mb-10">
          <div className="size-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
            <span className="material-symbols-outlined text-4xl">lock_open</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-2 text-center font-medium">Silakan masuk untuk mengelola toko Anda</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Username</label>
            <input 
              type="text" 
              className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-gray-800 focus:border-primary focus:ring-0 outline-none font-bold transition-all"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Password</label>
            <input 
              type="password" 
              className="h-14 border-2 rounded-2xl px-6 bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-gray-800 focus:border-primary focus:ring-0 outline-none font-bold transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="h-16 bg-primary text-[#111811] rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20 disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Autentikasi...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
