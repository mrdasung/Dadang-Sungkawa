import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  X,
  QrCode,
  Edit2,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  CheckSquare,
  Sparkles,
  Phone
} from 'lucide-react';
import { PerumahanConfig, OccupantsMap, PaymentsMap } from '../types';

interface TabelIuranProps {
  config: PerumahanConfig;
  payments: PaymentsMap;
  occupants: OccupantsMap;
  isAdmin: boolean;
  onTogglePayment: (blok: string, unit: string, monthIndex: number, currentValue: boolean) => void;
  onBatchLunasYear: (blok: string, unit: string) => void;
  onOpenQrisForUnit: (unitKey: string) => void;
  onEditOccupant: (unitKey: string) => void;
}

export const TabelIuran: React.FC<TabelIuranProps> = ({
  config,
  payments,
  occupants,
  isAdmin,
  onTogglePayment,
  onBatchLunasYear,
  onOpenQrisForUnit,
  onEditOccupant,
}) => {
  const [selectedBlok, setSelectedBlok] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // Build full list of 160 houses
  const allUnits = useMemo(() => {
    const list: {
      unitKey: string;
      blok: string;
      unitNumber: string;
      occupant: { nama: string; catatan?: string; telepon?: string; statusHunian?: string };
      monthsPaid: boolean[];
      paidCount: number;
      totalNominal: number;
    }[] = [];

    const bloks = selectedBlok === 'all' ? config.blokList : [selectedBlok];

    for (const b of bloks) {
      for (let u = 1; u <= (config.totalRumahPerBlok || 40); u++) {
        const uStr = u.toString();
        const key = `${b}${uStr}`;
        const occ = occupants[key] || { nama: '', catatan: '', statusHunian: 'belum_ditempati' };
        const months = (payments[b] && payments[b][uStr]) || Array(12).fill(false);
        const count = months.filter(Boolean).length;
        const total = count * config.iuranPerBulan;

        list.push({
          unitKey: key,
          blok: b,
          unitNumber: uStr,
          occupant: occ,
          monthsPaid: months,
          paidCount: count,
          totalNominal: total,
        });
      }
    }

    return list;
  }, [selectedBlok, config, payments, occupants]);

  // Filtered list
  const filteredUnits = useMemo(() => {
    return allUnits.filter((item) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUnit = item.unitKey.toLowerCase().includes(q) || `blok ${item.blok} no ${item.unitNumber}`.toLowerCase().includes(q);
        const matchName = item.occupant.nama.toLowerCase().includes(q);
        const matchNote = (item.occupant.catatan || '').toLowerCase().includes(q);
        if (!matchUnit && !matchName && !matchNote) return false;
      }

      // Status filter
      if (statusFilter === 'unpaid' && item.paidCount > 0) return false;
      if (statusFilter === 'partial' && (item.paidCount === 0 || item.paidCount === 12)) return false;
      if (statusFilter === 'paid' && item.paidCount !== 12) return false;

      return true;
    });
  }, [allUnits, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Blok Selection Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => setSelectedBlok('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedBlok === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua Blok (160)
          </button>
          {config.blokList.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBlok(b)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedBlok === b
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Blok {b} (40)
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari unit atau nama warga..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold border border-stone-300 rounded-xl bg-stone-50 text-stone-700 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="all">Semua Status ({allUnits.length})</option>
            <option value="unpaid">Belum Bayar (0 bln)</option>
            <option value="partial">Sebagian (1-11 bln)</option>
            <option value="paid">Lunas 1 Tahun (12 bln)</option>
          </select>
        </div>
      </div>

      {/* Mode hint banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-stone-100/80 rounded-xl text-xs text-stone-600">
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Mode Pengurus: Klik kotak bulan untuk mencentang/membatalkan status lunas warga.
            </span>
          ) : (
            <span className="text-stone-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-stone-400"></span>
              Transparansi Publik: Klik tombol "Bayar QRIS" di baris rumah Anda untuk membayar iuran.
            </span>
          )}
        </div>
        <div className="text-[11px] text-stone-500">
          Menampilkan <strong>{filteredUnits.length}</strong> rumah
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/90 text-stone-600 font-bold border-b border-stone-200 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center sticky left-0 bg-stone-50 z-10 border-r border-stone-200">
                  Unit
                </th>
                <th className="py-3 px-3.5 min-w-[190px] border-r border-stone-200">
                  Warga Medina Bantargedang
                </th>
                {config.bulanList.map((mName, idx) => (
                  <th key={mName} className="py-2.5 px-2 text-center min-w-[55px] font-mono text-[10px]">
                    <div>{mName}</div>
                    <div className="text-[9px] font-normal text-stone-400">Ke-{idx + 1}</div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[70px] border-l border-stone-200">
                  Lunas
                </th>
                <th className="py-3 px-3 text-right min-w-[95px]">
                  Nominal
                </th>
                <th className="py-3 px-3 text-center min-w-[110px]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-stone-400 text-xs">
                    Tidak ditemukan data rumah yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((row) => {
                  const isFullyPaid = row.paidCount === 12;

                  return (
                    <tr
                      key={row.unitKey}
                      className={`hover:bg-emerald-50/40 transition-colors ${
                        isFullyPaid ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Unit Number Badge */}
                      <td className="py-2.5 px-2 text-center sticky left-0 bg-white group-hover:bg-emerald-50/40 z-10 border-r border-stone-200">
                        <span className="font-mono font-bold px-2 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs">
                          {row.unitKey}
                        </span>
                      </td>

                      {/* Resident Name & Occupant Info */}
                      <td className="py-2.5 px-3.5 border-r border-stone-200">
                        <div className="flex items-center justify-between gap-1.5">
                          <div>
                            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                              {row.occupant.nama ? (
                                <span>{row.occupant.nama}</span>
                              ) : (
                                <span className="text-stone-400 italic text-[11px]">
                                  (Belum Terdata / Kosong)
                                </span>
                              )}
                            </div>
                            {row.occupant.catatan && (
                              <p className="text-[10px] text-stone-500 italic mt-0.5">
                                {row.occupant.catatan}
                              </p>
                            )}
                          </div>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => onEditOccupant(row.unitKey)}
                              title="Edit data warga"
                              className="p-1 text-stone-400 hover:text-emerald-700 hover:bg-stone-100 rounded transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 12 Months Checkmark Cells */}
                      {row.monthsPaid.map((isPaid, mIdx) => (
                        <td
                          key={mIdx}
                          className="py-1.5 px-1 text-center"
                        >
                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => onTogglePayment(row.blok, row.unitNumber, mIdx, isPaid)}
                            title={
                              isAdmin
                                ? `Klik untuk ${isPaid ? 'batalkan lunas' : 'tandai lunas'} ${config.bulanList[mIdx]}`
                                : `${config.bulanList[mIdx]}: ${isPaid ? 'Lunas' : 'Belum Lunas'}`
                            }
                            className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${
                              isPaid
                                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                : 'bg-stone-100/90 text-stone-300 hover:text-stone-400 border border-stone-200/60'
                            } ${isAdmin ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}`}
                          >
                            {isPaid ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span className="text-[10px] leading-none">-</span>}
                          </button>
                        </td>
                      ))}

                      {/* Paid Count Badge */}
                      <td className="py-2.5 px-2 text-center border-l border-stone-200">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                            isFullyPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.paidCount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {row.paidCount}/12
                        </span>
                      </td>

                      {/* Nominal Collected */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-stone-800 text-xs">
                        Rp {row.totalNominal.toLocaleString('id-ID')}
                      </td>

                      {/* Action Button: QRIS Pay */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenQrisForUnit(row.unitKey)}
                            title={`Bayar QRIS untuk unit ${row.unitKey}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] shadow-xs transition-all cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>Bayar QRIS</span>
                          </button>

                          {isAdmin && !isFullyPaid && (
                            <button
                              type="button"
                              onClick={() => onBatchLunasYear(row.blok, row.unitNumber)}
                              title="Tandai lunas 1 tahun (12 bulan)"
                              className="p-1 rounded bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-700 transition-colors text-[10px]"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Total Terdata: <strong>{filteredUnits.length} Rumah</strong>
            </span>
            <span>•</span>
            <span>
              Lunas 1 Tahun Penuh: <strong>{filteredUnits.filter((u) => u.paidCount === 12).length}</strong>
            </span>
            <span>•</span>
            <span>
              Belum Ada Pembayaran (0 bln): <strong>{filteredUnits.filter((u) => u.paidCount === 0).length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-stone-500">Total Nominal di Tampilan:</span>
            <span className="font-mono font-bold text-sm text-emerald-800">
              Rp {filteredUnits.reduce((acc, curr) => acc + curr.totalNominal, 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
