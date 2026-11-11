import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  Building,
  QrCode
} from 'lucide-react';
import { PerumahanConfig, OccupantsMap, PaymentsMap, Transaction } from '../types';

interface LaporanWhatsAppProps {
  config: PerumahanConfig;
  payments: PaymentsMap;
  occupants: OccupantsMap;
  transactions: Transaction[];
}

export const LaporanWhatsApp: React.FC<LaporanWhatsAppProps> = ({
  config,
  payments,
  occupants,
  transactions,
}) => {
  const [copied, setCopied] = useState(false);

  const blokList = config.blokList;
  const totalRumah = (config.totalRumahPerBlok || 40) * blokList.length;
  const tarif = config.iuranPerBulan || 20000;

  // Calculate statistics
  let totalPaidSlots = 0;
  const blokStats = blokList.map((b) => {
    let count = 0;
    let fullPaidCount = 0;
    for (let u = 1; u <= (config.totalRumahPerBlok || 40); u++) {
      const arr = (payments[b] && payments[b][u.toString()]) || Array(12).fill(false);
      const c = arr.filter(Boolean).length;
      count += c;
      if (c === 12) fullPaidCount++;
    }
    totalPaidSlots += count;
    const maxSlots = (config.totalRumahPerBlok || 40) * 12;
    const pct = ((count / maxSlots) * 100).toFixed(1);
    return { blok: b, count, maxSlots, pct, fullPaidCount };
  });

  const totalSlots = totalRumah * 12;
  const overallPct = ((totalPaidSlots / totalSlots) * 100).toFixed(1);
  const totalNominalIuran = totalPaidSlots * tarif;

  const totalMasuk = transactions.filter((t) => t.jenis === 'masuk').reduce((a, b) => a + b.jumlah, 0);
  const totalKeluar = transactions.filter((t) => t.jenis === 'keluar').reduce((a, b) => a + b.jumlah, 0);
  const saldoKas = totalMasuk - totalKeluar;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const generateReportText = () => {
    return `*LAPORAN TRANSPARANSI KAS & IURAN SAMPAH*\n` +
      `*${config.namaPerumahan.toUpperCase()}*\n` +
      `_Update per ${todayStr}_\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*1. RINGKASAN KEUANGAN PAGUYUBAN*\n` +
      `• Total Penerimaan Iuran: *Rp ${totalNominalIuran.toLocaleString('id-ID')}*\n` +
      `• Pengeluaran Operasional: *Rp ${totalKeluar.toLocaleString('id-ID')}*\n` +
      `• *Saldo Kas Saat Ini: Rp ${saldoKas.toLocaleString('id-ID')}*\n\n` +
      `*2. KEPATUHAN PEMBAYARAN WARGA*\n` +
      `• Tarif Iuran: Rp ${tarif.toLocaleString('id-ID')} / bulan\n` +
      `• Periode: ${config.periode}\n` +
      `• Slot Terbayar: ${totalPaidSlots} dari ${totalSlots} bulan (${overallPct}%)\n` +
      blokStats.map((s) => `  - Blok ${s.blok}: ${s.pct}% (${s.count} slot lunas, ${s.fullPaidCount} rumah lunas setahun)`).join('\n') + `\n\n` +
      `*3. KEMUDAHAN PEMBAYARAN VIA QRIS OTOMATIS*\n` +
      `Warga kini dapat membayar secara instan & tercatat otomatis melalui Kode QRIS resmi paguyuban:\n` +
      `• *Merchant:* ${config.qrisMerchant}\n` +
      `• *NMID:* ${config.qrisNmid}\n` +
      `• *Bisa dibayar lewat:* BCA Mobile, Mandiri Livin, BRImo, BSI, GoPay, OVO, DANA, ShopeePay\n` +
      `• Rekening Transfer Kas: ${config.rekeningKas}\n\n` +
      `Pantau tabel real-time & bayar langsung pada tautan aplikasi iuran paguyuban.\n\n` +
      `_Salam hangat,_\n` +
      `*${config.bendahara}* (Bendahara Medina Residence)\n` +
      `Kontak WA: ${config.kontakBendahara}`;
  };

  const reportText = generateReportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWaUrl = `https://wa.me/?text=${encodeURIComponent(reportText)}`;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Format Laporan Siap Bagikan ke Grup WhatsApp</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Teks laporan ini dapat langsung disalin atau dikirim ke grup Paguyuban / RT Medina Residence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <a
              href={shareWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka di WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Text Preview Box */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 font-mono text-xs text-stone-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar select-all">
          {reportText}
        </div>
      </div>
    </div>
  );
};
