import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Users,
  Send,
  Building,
  DollarSign
} from 'lucide-react';
import { PerumahanConfig, OccupantsMap, PaymentsMap } from '../types';

interface RekapitulasiProps {
  config: PerumahanConfig;
  payments: PaymentsMap;
  occupants: OccupantsMap;
  onOpenQrisForUnit: (unitKey: string) => void;
}

export const Rekapitulasi: React.FC<RekapitulasiProps> = ({
  config,
  payments,
  occupants,
  onOpenQrisForUnit,
}) => {
  const blokList = config.blokList;
  const totalRumahPerBlok = config.totalRumahPerBlok || 40;
  const tarif = config.iuranPerBulan || 20000;

  // Block analytics
  const blokStats = blokList.map((blok) => {
    let paidMonths = 0;
    let fullPaidCount = 0;
    let zeroPaidCount = 0;
    let partialCount = 0;

    for (let u = 1; u <= totalRumahPerBlok; u++) {
      const uStr = u.toString();
      const arr = (payments[blok] && payments[blok][uStr]) || Array(12).fill(false);
      const count = arr.filter(Boolean).length;
      paidMonths += count;

      if (count === 12) fullPaidCount++;
      else if (count === 0) zeroPaidCount++;
      else partialCount++;
    }

    const totalSlots = totalRumahPerBlok * 12;
    const percentage = ((paidMonths / totalSlots) * 100).toFixed(1);
    const nominalCollected = paidMonths * tarif;
    const nominalTarget = totalSlots * tarif;

    return {
      blok,
      paidMonths,
      totalSlots,
      fullPaidCount,
      zeroPaidCount,
      partialCount,
      percentage,
      nominalCollected,
      nominalTarget,
    };
  });

  // Overall totals
  const totalCollectedAll = blokStats.reduce((acc, curr) => acc + curr.nominalCollected, 0);
  const totalTargetAll = blokStats.reduce((acc, curr) => acc + curr.nominalTarget, 0);
  const totalPaidMonthsAll = blokStats.reduce((acc, curr) => acc + curr.paidMonths, 0);
  const totalSlotsAll = blokStats.reduce((acc, curr) => acc + curr.totalSlots, 0);
  const totalPercentageAll = totalSlotsAll > 0 ? ((totalPaidMonthsAll / totalSlotsAll) * 100).toFixed(1) : '0';

  // Monthly breakdown
  const monthlyStats = config.bulanList.map((monthName, mIdx) => {
    let paidInMonth = 0;
    for (const b of blokList) {
      for (let u = 1; u <= totalRumahPerBlok; u++) {
        if (payments[b] && payments[b][u.toString()] && payments[b][u.toString()][mIdx]) {
          paidInMonth++;
        }
      }
    }
    const nominal = paidInMonth * tarif;
    const totalHomes = blokList.length * totalRumahPerBlok;
    const pct = ((paidInMonth / totalHomes) * 100).toFixed(0);

    return {
      monthName,
      paidInMonth,
      totalHomes,
      nominal,
      pct,
    };
  });

  // Unpaid units list
  const unpaidUnits: { unitKey: string; occupantName: string; unpaidCount: number; tunggakanNominal: number }[] = [];
  for (const b of blokList) {
    for (let u = 1; u <= totalRumahPerBlok; u++) {
      const uStr = u.toString();
      const key = `${b}${uStr}`;
      const occ = occupants[key];
      const arr = (payments[b] && payments[b][uStr]) || Array(12).fill(false);
      const paidCount = arr.filter(Boolean).length;
      const unpaidCount = 12 - paidCount;

      if (unpaidCount > 0) {
        unpaidUnits.push({
          unitKey: key,
          occupantName: occ?.nama || `Warga Blok ${key}`,
          unpaidCount,
          tunggakanNominal: unpaidCount * tarif,
        });
      }
    }
  }

  // Sort unpaid units by highest arrears
  unpaidUnits.sort((a, b) => b.unpaidCount - a.unpaidCount);

  const getWaReminderLink = (unitKey: string, occupantName: string, unpaidCount: number) => {
    const text = `Halo Bapak/Ibu ${occupantName} (Warga Medina Residence Blok ${unitKey}),\n` +
      `Mengingatkan terkait iuran sampah lingkungan paguyuban Medina Residence Bantargedang.\n` +
      `Saat ini terdapat tunggakan ${unpaidCount} bulan (Rp ${(unpaidCount * tarif).toLocaleString('id-ID')}).\n` +
      `Pembayaran kini sangat mudah via QRIS Kas Warga Medina (NMID: ID1026635824174).\n` +
      `Terima kasih atas partisipasi menjaga kebersihan lingkungan bersama.`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Total Iuran Terkumpul</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            Rp {totalCollectedAll.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Dari target 1 tahun: Rp {totalTargetAll.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Tingkat Kepatuhan Paguyuban</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-900">
            {totalPercentageAll}%
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-sky-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(2, Number(totalPercentageAll))}%` }}
            ></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Slot Terbayar</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900">
            {totalPaidMonthsAll} <span className="text-sm font-normal text-stone-400">/ {totalSlotsAll} bln</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Total 160 rumah × 12 bulan
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Warga Terdata</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-900">
            160 <span className="text-sm font-normal text-stone-400">Rumah</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Blok A, B, C, D (40 rumah per blok)
          </p>
        </div>

      </div>

      {/* Block Progress Breakdown */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm">
        <h3 className="font-bold text-base text-stone-900 mb-4 flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-700" />
          <span>Rekapitulasi Pembayaran per Blok Perumahan</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {blokStats.map((item) => (
            <div
              key={item.blok}
              className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-stone-800">Blok {item.blok}</span>
                <span className="font-mono text-xs font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded-md">
                  {item.percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-200 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, Number(item.percentage))}%` }}
                ></div>
              </div>

              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span className="text-stone-400">Terkumpul:</span>
                  <span className="font-mono font-semibold text-stone-800">
                    Rp {item.nominalCollected.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Bulan Lunas:</span>
                  <span className="font-mono text-stone-700">
                    {item.paidMonths} / {item.totalSlots}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-400">Lunas 12 Bln:</span>
                  <span className="font-semibold text-emerald-700">{item.fullPaidCount} rumah</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-400">Belum Bayar:</span>
                  <span className="font-semibold text-rose-600">{item.zeroPaidCount} rumah</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Collection Grid */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm">
        <h3 className="font-bold text-base text-stone-900 mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-700" />
          <span>Tren Pembayaran Tiap Bulan Periode Nov 2026 – Okt 2027</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {monthlyStats.map((m, idx) => (
            <div
              key={m.monthName}
              className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  {m.monthName}
                </span>
                <div className="text-base font-bold font-mono text-stone-800 mt-1">
                  Rp {m.nominal.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
                <span className="text-stone-400">{m.paidInMonth}/160</span>
                <span className="font-bold text-emerald-700">{m.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrears List with QRIS & WhatsApp Action */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Daftar Unit Belum Lunas & Pengingat Iuran</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Warga dapat langsung membayar melalui QRIS atau pengurus dapat mengirim pesan pengingat WA.
            </p>
          </div>
          <div className="text-xs text-stone-500">
            Total Unit: <strong className="text-stone-800">{unpaidUnits.length}</strong>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100 custom-scrollbar">
          {unpaidUnits.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-700 font-semibold">
              Alhamdulillah, seluruh 160 rumah telah lunas iuran tahun ini!
            </div>
          ) : (
            unpaidUnits.slice(0, 30).map((item) => (
              <div
                key={item.unitKey}
                className="p-3 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-12 text-center py-1 bg-stone-100 rounded-lg font-mono font-bold text-xs text-stone-800">
                    {item.unitKey}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-stone-900">
                      {item.occupantName}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Tunggakan: <strong className="text-rose-600">{item.unpaidCount} bulan</strong> (Rp {item.tunggakanNominal.toLocaleString('id-ID')})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenQrisForUnit(item.unitKey)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Bayar QRIS
                  </button>
                  <a
                    href={getWaReminderLink(item.unitKey, item.occupantName, item.unpaidCount)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Kirim pengingat lewat WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
