import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  Trash2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Tag,
  Filter,
  FileText
} from 'lucide-react';
import { Transaction, PerumahanConfig } from '../types';
import { api } from '../services/api';

interface BukuKasProps {
  config: PerumahanConfig;
  transactions: Transaction[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export const BukuKas: React.FC<BukuKasProps> = ({
  config,
  transactions,
  isAdmin,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [jenis, setJenis] = useState<'masuk' | 'keluar'>('keluar');
  const [kategori, setKategori] = useState('Operasional Truk Sampah');
  const [keterangan, setKeterangan] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [metode, setMetode] = useState('Transfer Kas');

  const totalMasuk = transactions
    .filter((t) => t.jenis === 'masuk')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalKeluar = transactions
    .filter((t) => t.jenis === 'keluar')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const saldoKas = totalMasuk - totalKeluar;

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'masuk') return t.jenis === 'masuk';
    if (filterType === 'keluar') return t.jenis === 'keluar';
    return true;
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(jumlah);
    if (!keterangan.trim() || isNaN(num) || num <= 0) {
      setErrorMessage('Isi keterangan dan nominal jumlah dengan benar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.addTransaction({
        jenis,
        kategori,
        keterangan: keterangan.trim(),
        jumlah: num,
        tanggal,
        metode,
      });
      setIsModalOpen(false);
      setKeterangan('');
      setJumlah('');
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan transaksi kas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Yakin ingin menghapus catatan transaksi ini?')) {
      try {
        await api.deleteTransaction(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus transaksi.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Kas Balance Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Saldo Akhir */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Saldo Kas Bersih</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-800">
            Rp {saldoKas.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Kas Paguyuban & Iuran Sampah Medina Residence
          </p>
        </div>

        {/* Total Pemasukan */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Total Pemasukan</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-700">
            Rp {totalMasuk.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Iuran warga (QRIS & Tunai)
          </p>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Total Pengeluaran</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            Rp {totalKeluar.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Operasional truk sampah & kebersihan
          </p>
        </div>

      </div>

      {/* Transactions List & Controls */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Buku Kas & Riwayat Transaksi Keuangan</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Transparansi pembukuan kas iuran sampah {config.namaPerumahan}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-500'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterType('masuk')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterType === 'masuk' ? 'bg-white text-teal-800 shadow-xs' : 'text-stone-500'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setFilterType('keluar')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterType === 'keluar' ? 'bg-white text-rose-800 shadow-xs' : 'text-stone-500'
                }`}
              >
                Keluar
              </button>
            </div>

            {/* Admin Add Transaction Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Catat Kas</span>
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/90 text-stone-600 font-bold border-b border-stone-200 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-3">Jenis</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-3">Metode</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                {isAdmin && <th className="py-3 px-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-stone-400 text-xs">
                    Belum ada transaksi kas yang dicatat (Data kosong / 0).
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 text-stone-600 whitespace-nowrap font-mono text-[11px]">
                      {tx.tanggal}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.jenis === 'masuk'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.jenis === 'masuk' ? (
                          <>
                            <ArrowDownRight className="w-3 h-3" />
                            <span>Pemasukan</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Pengeluaran</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-800">
                      {tx.kategori}
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      <div>{tx.keterangan}</div>
                      {tx.unitKey && (
                        <span className="text-[10px] text-stone-400">Unit: Blok {tx.unitKey}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {tx.metode === 'QRIS' ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-md text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-amber-600" />
                          QRIS Otomatis
                        </span>
                      ) : (
                        <span className="text-stone-500 text-[11px]">{tx.metode || 'Manual'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-xs whitespace-nowrap">
                      <span className={tx.jenis === 'masuk' ? 'text-teal-700' : 'text-rose-600'}>
                        {tx.jenis === 'masuk' ? '+' : '-'} Rp {tx.jumlah.toLocaleString('id-ID')}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100 transition-colors"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Catat Mutasi Kas Paguyuban</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* Jenis radio */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Jenis Mutasi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setJenis('masuk');
                      setKategori('Iuran Sampah Tunai');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      jenis === 'masuk'
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    + Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJenis('keluar');
                      setKategori('Operasional Truk Sampah');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      jenis === 'keluar'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    - Pengeluaran
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50"
                >
                  {jenis === 'keluar' ? (
                    <>
                      <option value="Operasional Truk Sampah">Operasional Truk Sampah (DLH)</option>
                      <option value="Honor Petugas Angkut Sampah">Honor Petugas Angkut Sampah</option>
                      <option value="Plastik & Tong Sampah">Plastik & Tong Sampah</option>
                      <option value="Kebersihan Saluran & Lingkungan">Kebersihan Saluran & Lingkungan</option>
                      <option value="Lainnya">Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="Iuran Sampah Tunai">Iuran Sampah Tunai</option>
                      <option value="Transfer Bank Langsung">Transfer Bank Langsung</option>
                      <option value="Kas Paguyuban / Donasi">Kas Paguyuban / Donasi</option>
                    </>
                  )}
                </select>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Misal: Pembayaran retribusi truk sampah bulan Nov..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Jumlah */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    placeholder="200000"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
