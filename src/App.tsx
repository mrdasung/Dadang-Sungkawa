import React, { useState, useEffect, useCallback } from 'react';
import {
  Table2,
  BarChart3,
  QrCode,
  Wallet,
  Users,
  MessageSquare,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AppData, Transaction, PerumahanConfig, PaymentsMap, OccupantsMap } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { AdminLoginModal } from './components/AdminLoginModal';
import { QrisPaymentModal } from './components/QrisPaymentModal';
import { TabelIuran } from './components/TabelIuran';
import { Rekapitulasi } from './components/Rekapitulasi';
import { BukuKas } from './components/BukuKas';
import { DataWarga } from './components/DataWarga';
import { LaporanWhatsApp } from './components/LaporanWhatsApp';
import { QrisPageView } from './components/QrisPageView';
import { ResetDataModal } from './components/ResetDataModal';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'tabel' | 'rekap' | 'qris' | 'kas' | 'warga' | 'laporan'>('tabel');

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('medina_admin_token'));
  });

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState<boolean>(false);
  const [selectedUnitForQris, setSelectedUnitForQris] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch initial data
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const result = await api.getData();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Fetch error:', err);
      if (!silent) {
        setError(err.message || 'Gagal terhubung ke server sistem.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-polling every 6 seconds for real-time synchronization
    const interval = setInterval(() => {
      fetchData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Auth actions
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('medina_admin_token', token);
    setIsAdmin(true);
    showToast('Berhasil masuk sebagai Pengurus / Bendahara Medina Residence.');
  };

  const handleLogout = () => {
    localStorage.removeItem('medina_admin_token');
    setIsAdmin(false);
    showToast('Keluar dari Mode Pengurus.', 'info');
  };

  // Toggle single payment
  const handleTogglePayment = async (blok: string, unit: string, monthIndex: number, currentValue: boolean) => {
    if (!isAdmin || !data) return;

    const newValue = !currentValue;

    // Optimistic update
    const nextPayments = { ...data.payments };
    if (!nextPayments[blok]) nextPayments[blok] = {};
    const unitArr = [...(nextPayments[blok][unit] || Array(12).fill(false))];
    unitArr[monthIndex] = newValue;
    nextPayments[blok][unit] = unitArr;

    setData({
      ...data,
      payments: nextPayments,
    });

    try {
      await api.togglePayment(blok, unit, monthIndex, newValue);
      showToast(
        `Unit ${blok}${unit} bulan ${data.config.bulanList[monthIndex]} ditandai ${newValue ? 'LUNAS' : 'BELUM LUNAS'}.`
      );
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui status pembayaran', 'error');
      fetchData(true);
    }
  };

  // Batch mark 12 months paid
  const handleBatchLunasYear = async (blok: string, unit: string) => {
    if (!isAdmin || !data) return;

    if (!window.confirm(`Tandai seluruh 12 bulan Lunas untuk Blok ${blok} No. ${unit}?`)) {
      return;
    }

    const updates = Array.from({ length: 12 }, (_, idx) => ({
      blok,
      unit,
      monthIndex: idx,
      value: true,
    }));

    // Optimistic update
    const nextPayments = { ...data.payments };
    if (!nextPayments[blok]) nextPayments[blok] = {};
    nextPayments[blok][unit] = Array(12).fill(true);

    setData({
      ...data,
      payments: nextPayments,
    });

    try {
      await api.batchUpdatePayments(updates);
      showToast(`Blok ${blok} No. ${unit} berhasil ditandai Lunas 1 Tahun!`);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan perubahan massal', 'error');
      fetchData(true);
    }
  };

  const handleOpenQrisForUnit = (unitKey: string) => {
    setSelectedUnitForQris(unitKey);
    setIsQrisModalOpen(true);
  };

  const handlePaymentSuccess = (tx: Transaction) => {
    showToast(`Pembayaran QRIS ${tx.id} berhasil dicatat & terdata otomatis!`, 'success');
    fetchData(true);
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-700 border-t-transparent animate-spin mb-4"></div>
        <p className="font-bold text-stone-800 text-sm">Memuat Sistem Iuran Sampah Medina Residence…</p>
        <p className="text-stone-500 text-xs mt-1">Menghubungkan data real-time</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 bg-rose-100 text-rose-700 rounded-2xl max-w-md border border-rose-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
          <h2 className="font-bold text-base">Koneksi Gagal</h2>
          <p className="text-xs text-stone-600 mt-1">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Calculate high-level summary
  const totalRumahPerBlok = data.config.totalRumahPerBlok || 40;
  const totalRumah = totalRumahPerBlok * data.config.blokList.length;
  const totalSlots = totalRumah * 12;

  let totalLunasCount = 0;
  for (const b of data.config.blokList) {
    for (let u = 1; u <= totalRumahPerBlok; u++) {
      const arr = (data.payments[b] && data.payments[b][u.toString()]) || Array(12).fill(false);
      totalLunasCount += arr.filter(Boolean).length;
    }
  }

  const totalCollected = totalLunasCount * (data.config.iuranPerBulan || 20000);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-200 max-w-sm">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-stone-900 text-white border-stone-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        config={data.config}
        isAdmin={isAdmin}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenQrisModal={() => {
          setSelectedUnitForQris(null);
          setIsQrisModalOpen(true);
        }}
        onOpenShareWa={() => setActiveTab('laporan')}
        onRefresh={() => fetchData(false)}
        isRefreshing={isRefreshing}
        totalCollected={totalCollected}
        totalLunasCount={totalLunasCount}
        totalSlots={totalSlots}
      />

      {/* Navigation Tab Bar */}
      <nav className="bg-white border-b border-stone-200/90 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto custom-scrollbar">
            <div className="flex items-center space-x-1 sm:space-x-2 py-2">
              <button
                type="button"
                onClick={() => setActiveTab('tabel')}
                className={`py-2 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'tabel'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Table2 className="w-4 h-4" />
                <span>Tabel Iuran (160 Rumah)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rekap')}
                className={`py-2 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'rekap'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Rekapitulasi Kepatuhan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('qris')}
                className={`py-2 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'qris'
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                }`}
              >
                <QrCode className="w-4 h-4 text-amber-900" />
                <span>QRIS Pembayaran</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('kas')}
                className={`py-2 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'kas'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Buku Kas Lingkungan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('warga')}
                className={`py-2 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'warga'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Data Warga Bantargedang</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('laporan')}
                className={`py-2 px-3 sm:px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'laporan'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Format WA</span>
              </button>
            </div>

            {/* Admin Reset to Zero Action */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                title="Kosongkan data pembayaran menjadi 0"
                className="py-1 px-2.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden md:inline">Kosongkan Data (0)</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tabel' && (
          <TabelIuran
            config={data.config}
            payments={data.payments}
            occupants={data.occupants}
            isAdmin={isAdmin}
            onTogglePayment={handleTogglePayment}
            onBatchLunasYear={handleBatchLunasYear}
            onOpenQrisForUnit={handleOpenQrisForUnit}
            onEditOccupant={() => setActiveTab('warga')}
          />
        )}

        {activeTab === 'rekap' && (
          <Rekapitulasi
            config={data.config}
            payments={data.payments}
            occupants={data.occupants}
            onOpenQrisForUnit={handleOpenQrisForUnit}
          />
        )}

        {activeTab === 'qris' && (
          <QrisPageView
            config={data.config}
            onOpenQrisModal={() => {
              setSelectedUnitForQris(null);
              setIsQrisModalOpen(true);
            }}
          />
        )}

        {activeTab === 'kas' && (
          <BukuKas
            config={data.config}
            transactions={data.transactions}
            isAdmin={isAdmin}
            onRefresh={() => fetchData(true)}
          />
        )}

        {activeTab === 'warga' && (
          <DataWarga
            config={data.config}
            occupants={data.occupants}
            isAdmin={isAdmin}
            onRefresh={() => fetchData(true)}
            onOpenQrisForUnit={handleOpenQrisForUnit}
          />
        )}

        {activeTab === 'laporan' && (
          <LaporanWhatsApp
            config={data.config}
            payments={data.payments}
            occupants={data.occupants}
            transactions={data.transactions}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-6 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-white font-bold">{data.config.namaPerumahan}</span>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Kelurahan Bantargedang, Kota Tasikmalaya · Transparansi Kas Iuran Sampah Lingkungan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span>NMID QRIS: <strong className="text-stone-300 font-mono">{data.config.qrisNmid}</strong></span>
            <span>•</span>
            <span>Bendahara: <strong className="text-stone-300">{data.config.bendahara}</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Real-time Online</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <QrisPaymentModal
        isOpen={isQrisModalOpen}
        onClose={() => {
          setIsQrisModalOpen(false);
          setSelectedUnitForQris(null);
        }}
        config={data.config}
        occupants={data.occupants}
        payments={data.payments}
        initialUnitKey={selectedUnitForQris}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ResetDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetSuccess={() => {
          showToast('Data pembayaran dan kas berhasil dikosongkan menjadi 0.');
          fetchData(true);
        }}
      />
    </div>
  );
}
