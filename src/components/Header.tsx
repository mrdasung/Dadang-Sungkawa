import React from 'react';
import {
  ShieldCheck,
  Lock,
  LogOut,
  QrCode,
  Share2,
  RefreshCw,
  Building2,
  PhoneCall,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PerumahanConfig } from '../types';

interface HeaderProps {
  config: PerumahanConfig;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenQrisModal: () => void;
  onOpenShareWa: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalCollected: number;
  totalLunasCount: number;
  totalSlots: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  isAdmin,
  onOpenLogin,
  onLogout,
  onOpenQrisModal,
  onOpenShareWa,
  onRefresh,
  isRefreshing,
  totalCollected,
  totalLunasCount,
  totalSlots,
}) => {
  const percentage = totalSlots > 0 ? ((totalLunasCount / totalSlots) * 100).toFixed(1) : '0';

  return (
    <header className="bg-emerald-900 text-white shadow-lg border-b border-emerald-800">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-800 rounded-xl border border-emerald-700/80 shadow-inner shrink-0 text-emerald-300">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {config.namaPerumahan}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-700/90 text-emerald-100 font-semibold border border-emerald-600/60">
                  {config.periode}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{config.lokasi}</span>
                <span className="hidden sm:inline text-emerald-400">•</span>
                <span>Bendahara: <strong className="text-white font-medium">{config.bendahara}</strong></span>
                <span className="hidden sm:inline text-emerald-400">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-200">
                  <PhoneCall className="w-3 h-3 text-emerald-300" />
                  {config.kontakBendahara}
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Real-time Badge */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Perbarui data secara real-time"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-950 text-xs font-medium text-emerald-300 border border-emerald-700/50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Real-time</span>
            </button>

            {/* Quick WA format */}
            <button
              onClick={onOpenShareWa}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold text-emerald-100 border border-emerald-600/70 shadow-sm transition-colors"
              title="Format Laporan untuk WhatsApp Paguyuban Warga"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Format WA</span>
            </button>

            {/* Main QRIS Button */}
            <button
              onClick={onOpenQrisModal}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-stone-950" />
              <span>Bayar via QRIS</span>
            </button>

            {/* Admin Toggle */}
            {isAdmin ? (
              <div className="inline-flex items-center gap-1.5 bg-emerald-950/90 border border-amber-400/50 rounded-lg px-3 py-1 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-amber-200 font-semibold hidden sm:inline">Pengurus Aktif</span>
                <button
                  onClick={onLogout}
                  title="Keluar dari Mode Pengurus"
                  className="ml-1 p-1 text-stone-300 hover:text-white rounded hover:bg-emerald-800/80 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-800 text-xs font-medium text-emerald-200 border border-emerald-700/60 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Login Pengurus</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Sub-bar */}
        <div className="mt-3 pt-3 border-t border-emerald-800/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-emerald-200">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-100 font-medium">Sistem Pemantauan Online</span>
            </span>
            <span className="text-emerald-500">•</span>
            <span>Tarif: <strong className="text-white">Rp {config.iuranPerBulan.toLocaleString('id-ID')}</strong> / bulan</span>
            <span className="text-emerald-500">•</span>
            <span>Total: <strong className="text-white">160 Rumah</strong> (Blok A, B, C, D)</span>
            <span className="text-emerald-500">•</span>
            <span>Kode QRIS Resmi: <strong className="text-amber-300 font-mono">ID1026635824174</strong></span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-300">Penerimaan Kas:</span>
              <span className="font-bold text-amber-300 text-sm font-mono">
                Rp {totalCollected.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
              <span>Kepatuhan:</span>
              <strong className="text-white font-mono">{percentage}%</strong>
              <span className="text-emerald-400">({totalLunasCount}/{totalSlots} bulan)</span>
            </div>
          </div>
        </div>

        {/* Admin Notification Banner when active */}
        {isAdmin && (
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Mode Pengurus / Bendahara Aktif:</strong> Anda dapat mencentang status iuran, mencatat kas masuk/keluar, mengedit data warga, dan verifikasi QRIS.
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
