import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Download,
  Edit2,
  Home,
  CheckCircle,
  XCircle,
  Phone,
  UserCheck,
  UserX,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { OccupantsMap, PerumahanConfig } from '../types';
import { api } from '../services/api';

interface DataWargaProps {
  config: PerumahanConfig;
  occupants: OccupantsMap;
  isAdmin: boolean;
  onRefresh: () => void;
  onOpenQrisForUnit: (unitKey: string) => void;
}

export const DataWarga: React.FC<DataWargaProps> = ({
  config,
  occupants,
  isAdmin,
  onRefresh,
  onOpenQrisForUnit,
}) => {
  const [selectedBlok, setSelectedBlok] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ditempati' | 'belum_ditempati'>('all');

  // Edit modal
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'ditempati' | 'belum_ditempati'>('ditempati');
  const [editFamily, setEditFamily] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Compile 160 houses
  const allHouses = useMemo(() => {
    const list: {
      unitKey: string;
      blok: string;
      unitNumber: string;
      nama: string;
      telepon: string;
      catatan: string;
      statusHunian: 'ditempati' | 'belum_ditempati';
      anggotaKeluarga: number;
    }[] = [];

    const bloks = selectedBlok === 'all' ? config.blokList : [selectedBlok];

    for (const b of bloks) {
      for (let u = 1; u <= (config.totalRumahPerBlok || 40); u++) {
        const uStr = u.toString();
        const key = `${b}${uStr}`;
        const occ = occupants[key];

        const hasName = Boolean(occ?.nama?.trim());
        list.push({
          unitKey: key,
          blok: b,
          unitNumber: uStr,
          nama: occ?.nama || '',
          telepon: occ?.telepon || '',
          catatan: occ?.catatan || '',
          statusHunian: occ?.statusHunian || (hasName ? 'ditempati' : 'belum_ditempati'),
          anggotaKeluarga: occ?.anggotaKeluarga || (hasName ? 3 : 0),
        });
      }
    }

    return list;
  }, [selectedBlok, config, occupants]);

  const filteredHouses = useMemo(() => {
    return allHouses.filter((h) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUnit = h.unitKey.toLowerCase().includes(q) || `blok ${h.blok} no ${h.unitNumber}`.toLowerCase().includes(q);
        const matchName = h.nama.toLowerCase().includes(q);
        const matchNote = h.catatan.toLowerCase().includes(q);
        if (!matchUnit && !matchName && !matchNote) return false;
      }

      if (statusFilter !== 'all' && h.statusHunian !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [allHouses, searchQuery, statusFilter]);

  const totalDitempati = allHouses.filter((h) => h.statusHunian === 'ditempati' || Boolean(h.nama.trim())).length;
  const totalBelum = allHouses.length - totalDitempati;

  const handleOpenEdit = (unitKey: string) => {
    const occ = occupants[unitKey];
    setEditingUnit(unitKey);
    setEditName(occ?.nama || '');
    setEditPhone(occ?.telepon || '');
    setEditNotes(occ?.catatan || '');
    setEditStatus(occ?.statusHunian || (occ?.nama?.trim() ? 'ditempati' : 'belum_ditempati'));
    setEditFamily(occ?.anggotaKeluarga || 0);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    setIsSaving(true);
    try {
      await api.updateOccupant(editingUnit, {
        nama: editName.trim(),
        telepon: editPhone.trim(),
        catatan: editNotes.trim(),
        statusHunian: editStatus,
        anggotaKeluarga: editFamily,
      });
      setEditingUnit(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data warga.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Excel / CSV
  const handleExportCsv = () => {
    const headers = ['Unit Rumah', 'Blok', 'Nomor', 'Nama Warga', 'Status Hunian', 'Anggota Keluarga', 'Nomor Telepon', 'Catatan'];
    const rows = allHouses.map((h) => [
      h.unitKey,
      h.blok,
      h.unitNumber,
      `"${h.nama || '(Belum Terdata)'}"`,
      h.statusHunian === 'ditempati' ? 'Sudah Ditempati' : 'Belum Ditempati',
      h.anggotaKeluarga,
      `"${h.telepon}"`,
      `"${h.catatan}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data_Warga_Medina_Residence_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Eyebrow & Hero Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 rounded-2xl shadow-sm border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-block text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-1">
              DATA WARGA • BANTARGEDANG
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Daftar Rumah & Warga Medina Residence
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-2xl leading-relaxed">
              Pendataan warga Blok A sampai D untuk lingkungan yang lebih rukun, tertib, dan transparan. Sesuai data Bantargedang, rumah yang belum berpenghuni dikosongkan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-xs font-bold text-white border border-emerald-600/70 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>↓ Unduh untuk Excel</span>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-5 pt-4 border-t border-emerald-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-emerald-300 block text-[11px]">Total Rumah Terdata</span>
            <span className="text-lg font-bold font-mono text-white">160 Rumah</span>
          </div>
          <div>
            <span className="text-emerald-300 block text-[11px]">Sudah Ditempati</span>
            <span className="text-lg font-bold font-mono text-emerald-300">{totalDitempati} Rumah</span>
          </div>
          <div>
            <span className="text-emerald-300 block text-[11px]">Belum Ditempati / Kosong</span>
            <span className="text-lg font-bold font-mono text-amber-300">{totalBelum} Rumah</span>
          </div>
          <div>
            <span className="text-emerald-300 block text-[11px]">Pembagian Blok</span>
            <span className="text-lg font-bold font-mono text-white">Blok A, B, C, D</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Blok tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => setSelectedBlok('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedBlok === 'all' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua Blok
          </button>
          {config.blokList.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBlok(b)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedBlok === b ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Blok {b}
            </button>
          ))}
        </div>

        {/* Search & Status select */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, nomor rumah, atau status..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold border border-stone-300 rounded-xl bg-stone-50 text-stone-700"
          >
            <option value="all">Semua Status Hunian</option>
            <option value="ditempati">Sudah Ditempati</option>
            <option value="belum_ditempati">Belum Ditempati</option>
          </select>
        </div>
      </div>

      {/* Grid of Resident Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredHouses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 text-xs bg-white rounded-2xl border border-stone-200">
            Belum ada rumah yang sesuai. Ubah kata kunci pencarian.
          </div>
        ) : (
          filteredHouses.map((house) => {
            const hasName = Boolean(house.nama.trim());

            return (
              <div
                key={house.unitKey}
                className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top line: Unit badge & Status */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg border border-stone-200">
                      Blok {house.unitKey}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        house.statusHunian === 'ditempati'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {house.statusHunian === 'ditempati' ? (
                        <>
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Ditempati</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-2.5 h-2.5" />
                          <span>Belum Ditempati</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="min-h-[44px]">
                    <h4 className="font-bold text-sm text-stone-900 leading-snug">
                      {hasName ? house.nama : <span className="text-stone-400 font-normal italic">(Nama Belum Terdata)</span>}
                    </h4>
                    {house.catatan ? (
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1 italic">
                        {house.catatan}
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Medina Residence Bantargedang
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom line: Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenQrisForUnit(house.unitKey)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Bayar QRIS
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(house.unitKey)}
                      className="inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-emerald-700 font-semibold px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Ubah</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Resident Modal */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Perbarui Data Warga Unit Blok {editingUnit}</h3>
                <p className="text-[11px] text-emerald-200">Perumahan Medina Residence Bantargedang</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUnit(null)}
                className="text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Kepala Keluarga / Warga</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Kosongkan jika rumah belum ditempati..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  *Nama boleh dikosongkan jika rumah belum ditempati.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Status Hunian</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50"
                >
                  <option value="ditempati">Sudah Ditempati</option>
                  <option value="belum_ditempati">Belum Ditempati / Kosong</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Anggota Keluarga</label>
                  <input
                    type="number"
                    value={editFamily}
                    onChange={(e) => setEditFamily(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Catatan Tambahan / Ciri Rumah</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Contoh: Rumah putih abu / Dekat pos satpam..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
