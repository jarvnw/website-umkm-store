
import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="px-4 md:px-10 lg:px-40 py-24 flex justify-center bg-background-light dark:bg-background-dark min-h-screen">
      <div className="max-w-[800px] w-full prose dark:prose-invert">
        <h1 className="text-4xl font-black mb-8 tracking-tighter">Kebijakan Privasi</h1>
        <div className="space-y-6 text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
          <p>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
          
          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p>Kami mengumpulkan informasi yang Anda berikan secara sukarela saat melakukan pemesanan melalui mekanisme WhatsApp Order kami. Informasi ini mencakup Nama Lengkap, Alamat Pengiriman, dan Nomor Telepon.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">2. Penggunaan Informasi</h2>
            <p>Informasi yang kami kumpulkan hanya digunakan untuk:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Memproses dan mengirimkan pesanan Anda.</li>
              <li>Menghubungi Anda melalui WhatsApp untuk konfirmasi pesanan atau kendala pengiriman.</li>
              <li>Meningkatkan layanan pelanggan kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">3. Perlindungan Data</h2>
            <p>Kami berkomitmen untuk menjaga keamanan informasi pribadi Anda. Kami tidak menjual, memperdagangkan, atau memberikan informasi pribadi Anda kepada pihak ketiga tanpa izin Anda, kecuali diperlukan untuk proses pengiriman logistik.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">4. Cookie</h2>
            <p>Website kami menggunakan penyimpanan lokal (local storage) browser Anda untuk menyimpan data keranjang belanja sehingga Anda dapat melanjutkan belanja dengan nyaman di lain waktu.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">5. Persetujuan</h2>
            <p>Dengan menggunakan website kami, Anda dengan ini menyetujui Kebijakan Privasi kami dan menyetujui syarat-syaratnya.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const TermsOfService: React.FC = () => {
  return (
    <div className="px-4 md:px-10 lg:px-40 py-24 flex justify-center bg-background-light dark:bg-background-dark min-h-screen">
      <div className="max-w-[800px] w-full prose dark:prose-invert">
        <h1 className="text-4xl font-black mb-8 tracking-tighter">Syarat dan Ketentuan</h1>
        <div className="space-y-6 text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
          <p>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">1. Ketentuan Umum</h2>
            <p>LuminaGoods menyediakan platform katalog online untuk produk UMKM. Dengan mengakses website ini, Anda dianggap telah memahami dan menyetujui syarat dan ketentuan yang berlaku.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">2. Mekanisme Pemesanan</h2>
            <p>Pemesanan dilakukan melalui sistem "WhatsApp Order". Setelah menekan tombol checkout, Anda akan diarahkan ke aplikasi WhatsApp untuk berkomunikasi langsung dengan admin kami. Transaksi dianggap sah setelah admin melakukan konfirmasi ketersediaan stok dan pembayaran.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">3. Harga dan Pembayaran</h2>
            <p>Harga yang tertera adalah harga produk. Biaya pengiriman akan dihitung secara manual oleh admin kami berdasarkan lokasi pengiriman Anda selama proses konfirmasi di WhatsApp. Pembayaran dilakukan melalui metode yang disepakati di dalam chat WhatsApp.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">4. Kebijakan Pengembalian</h2>
            <p>Kami menerima keluhan atas produk yang cacat atau salah kirim dalam waktu maksimal 2x24 jam setelah barang diterima, disertai dengan video unboxing yang lengkap.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#111811] dark:text-white mb-4">5. Perubahan Ketentuan</h2>
            <p>Kami berhak untuk memperbarui syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
