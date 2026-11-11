import React from 'react';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  ArrowRight,
  Info,
  Download,
  Building,
  CreditCard
} from 'lucide-react';
import { PerumahanConfig } from '../types';

interface QrisPageViewProps {
  config: PerumahanConfig;
  onOpenQrisModal: () => void;
}

export const QrisPageView: React.FC<QrisPageViewProps> = ({ config, onOpenQrisModal }) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-emerald-800">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/60 text-emerald-200 text-xs font-semibold">
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>Satu QRIS untuk Semua Aplikasi Pembayaran</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pembayaran Iuran Kas Medina Lebih Cepat & Otomatis
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Warga Perumahan Medina Residence Bantargedang dapat membayar iuran sampah kapan saja tanpa perlu mencari uang pas atau konfirmasi manual yang lama. Cukup scan kode QRIS resmi kas paguyuban, dan pembayaran Anda akan langsung terdata otomatis di sistem secara real-time.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenQrisModal}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-stone-950" />
                <span>Bayar Iuran Sekarang via QRIS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* QRIS Card Preview */}
          <div className="shrink-0 bg-white p-4 rounded-2xl shadow-xl border border-stone-200 text-stone-900 max-w-xs text-center">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="font-extrabold text-xs text-stone-800">QRIS STANDAR NASIONAL</span>
              <span className="font-bold text-[10px] text-rose-600 px-1.5 py-0.5 bg-rose-50 rounded">GPN</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-stone-200 shadow-inner p-1 bg-stone-50">
              <img
                src="/public/assets/aistudio/WhatsApp_Image_2026-11-11_at_11.57.56_1f815094.jpeg"
                alt="QRIS Medina"
                className="w-full h-auto object-contain rounded-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/qris-medina.jpeg';
                }}
              />
            </div>
            <div className="mt-3 pt-2 border-t border-stone-100 text-[11px]">
              <div className="font-bold text-stone-800">{config.qrisMerchant}</div>
              <div className="font-mono text-stone-500 text-[10px]">NMID: {config.qrisNmid}</div>
              <div className="text-stone-400 text-[9px] mt-0.5">Kode Pos: A01</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Step Tutorial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
            1
          </div>
          <h4 className="font-bold text-sm text-stone-900">Pilih Unit & Bulan</h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            Klik tombol Bayar QRIS lalu pilih Blok & Nomor Rumah Anda. Pilih bulan iuran yang akan dibayar (bisa 1 bulan atau sekaligus setahun).
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
            2
          </div>
          <h4 className="font-bold text-sm text-stone-900">Scan Menggunakan M-Banking / E-Wallet</h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            Buka aplikasi BCA Mobile, Livin Mandiri, BRImo, BSI, GoPay, OVO, DANA, atau ShopeePay Anda. Arahkan kamera ke kode QRIS di atas dan selesaikan transfer.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
            3
          </div>
          <h4 className="font-bold text-sm text-stone-900">Terdata Otomatis & Cetak Kwitansi</h4>
          <p className="text-xs text-stone-500 leading-relaxed">
            Sistem secara otomatis menandai baris rumah Anda berstatus LUNAS di tabel transparansi kas dan menerbitkan kwitansi digital.
          </p>
        </div>
      </div>

      {/* Alternative Payment Info */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm">
        <h3 className="font-bold text-base text-stone-900 mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-700" />
          <span>Informasi Rekening Kas & Kontak Bendahara Paguyuban</span>
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Selain menggunakan QRIS, warga juga dapat melakukan transfer antar bank atau setoran langsung kepada pengurus.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-stone-400 block mb-1">Rekening Kas Paguyuban:</span>
            <span className="text-sm font-bold font-mono text-stone-800 block">
              {config.rekeningKas}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">
              Sertakan berita transfer: "Iuran Sampah [Blok No]"
            </span>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-stone-400 block mb-1">Bendahara Paguyuban:</span>
            <span className="text-sm font-bold text-stone-800 block">
              {config.bendahara}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">
              WhatsApp / Telp: {config.kontakBendahara}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
