import React, { useState, useEffect } from 'react';
import {
  QrCode,
  X,
  CheckCircle2,
  Calendar,
  Home,
  User,
  CreditCard,
  Send,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { PerumahanConfig, OccupantsMap, PaymentsMap, Transaction } from '../types';
import { api } from '../services/api';

interface QrisPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PerumahanConfig;
  occupants: OccupantsMap;
  payments: PaymentsMap;
  initialUnitKey?: string | null;
  onPaymentSuccess: (transaction: Transaction) => void;
}

export const QrisPaymentModal: React.FC<QrisPaymentModalProps> = ({
  isOpen,
  onClose,
  config,
  occupants,
  payments,
  initialUnitKey,
  onPaymentSuccess,
}) => {
  const [selectedBlok, setSelectedBlok] = useState<string>('A');
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<string>('1');
  const [payerName, setPayerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Sync unit when modal opens or initialUnitKey changes
  useEffect(() => {
    if (initialUnitKey && initialUnitKey.length >= 2) {
      const blok = initialUnitKey.charAt(0).toUpperCase();
      const unit = initialUnitKey.substring(1);
      if (['A', 'B', 'C', 'D'].includes(blok)) {
        setSelectedBlok(blok);
        setSelectedUnitNumber(unit);
      }
    }
  }, [initialUnitKey, isOpen]);

  const currentUnitKey = `${selectedBlok}${selectedUnitNumber}`;
  const currentOccupant = occupants[currentUnitKey];
  const currentPayments = (payments[selectedBlok] && payments[selectedBlok][selectedUnitNumber]) || Array(12).fill(false);

  // Sync occupant name
  useEffect(() => {
    if (currentOccupant?.nama) {
      setPayerName(currentOccupant.nama);
    } else {
      setPayerName('');
    }
  }, [currentUnitKey, currentOccupant]);

  // Select first unpaid month by default if none selected
  useEffect(() => {
    const firstUnpaid = currentPayments.findIndex((paid) => !paid);
    if (firstUnpaid !== -1 && selectedMonths.length === 0) {
      setSelectedMonths([firstUnpaid]);
    }
  }, [currentUnitKey, currentPayments]);

  if (!isOpen) return null;

  const toggleMonth = (mIdx: number) => {
    if (currentPayments[mIdx]) return; // already paid
    if (selectedMonths.includes(mIdx)) {
      setSelectedMonths(selectedMonths.filter((m) => m !== mIdx));
    } else {
      setSelectedMonths([...selectedMonths, mIdx].sort((a, b) => a - b));
    }
  };

  const selectQuick = (type: 'current' | '3months' | '6months' | 'all') => {
    const unpaidIndices = currentPayments
      .map((paid, idx) => (!paid ? idx : -1))
      .filter((idx) => idx !== -1);

    if (type === 'current') {
      const first = unpaidIndices[0];
      setSelectedMonths(first !== undefined ? [first] : []);
    } else if (type === '3months') {
      setSelectedMonths(unpaidIndices.slice(0, 3));
    } else if (type === '6months') {
      setSelectedMonths(unpaidIndices.slice(0, 6));
    } else if (type === 'all') {
      setSelectedMonths(unpaidIndices);
    }
  };

  const totalAmount = selectedMonths.length * (config.iuranPerBulan || 20000);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMonths.length === 0) {
      setErrorMessage('Pilih minimal satu bulan iuran yang akan dibayar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await api.payViaQris({
        unitKey: currentUnitKey,
        months: selectedMonths,
        payerName: payerName.trim() || currentOccupant?.nama || `Warga Blok ${selectedBlok} No. ${selectedUnitNumber}`,
        phone: phone.trim(),
        catatan: catatan.trim(),
        senderBank: 'QRIS Kas Warga Medina',
      });

      if (res.success) {
        setReceipt(res.transaction);
        onPaymentSuccess(res.transaction);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewPayment = () => {
    setReceipt(null);
    setSelectedMonths([]);
  };

  // WhatsApp confirmation generator
  const getWaConfirmationLink = (tx: Transaction) => {
    const cleanPhone = config.kontakBendahara.replace(/[^0-9]/g, '');
    const phoneTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const monthNames = (tx.bulanIndices || [])
      .map((m) => config.bulanList[m] || `Bulan ${m + 1}`)
      .join(', ');

    const message = `*KONFIRMASI PEMBAYARAN QRIS KAS WARGA MEDINA RESIDENCE*\n\n` +
      `Halo Pak ${config.bendahara},\n` +
      `Saya telah melakukan pembayaran iuran sampah via QRIS dengan rincian sbb:\n` +
      `• *ID Transaksi:* ${tx.id}\n` +
      `• *Unit:* Blok ${selectedBlok} No. ${selectedUnitNumber}\n` +
      `• *Nama Pembayar:* ${tx.namaWarga || 'Warga'}\n` +
      `• *Periode Bulan:* ${monthNames}\n` +
      `• *Nominal:* Rp ${tx.jumlah.toLocaleString('id-ID')}\n` +
      `• *Waktu:* ${tx.tanggal}\n` +
      `• *NMID:* ${config.qrisNmid}\n\n` +
      `Mohon dicatat dan terima kasih.`;

    return `https://wa.me/${phoneTarget}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-stone-900 rounded-xl shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Pembayaran QRIS Kas Warga</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-600">
                  Otomatis
                </span>
              </h2>
              <p className="text-xs text-emerald-200">Perumahan Medina Residence Bantargedang</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {receipt ? (
          /* DIGITAL RECEIPT VIEW */
          <div className="p-6 sm:p-8 space-y-6 bg-stone-50">
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-50 rounded-full pointer-events-none opacity-50"></div>
              
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold text-base text-stone-900">Pembayaran Berhasil Diverifikasi!</h3>
                    <p className="text-xs text-stone-500">Tercatat otomatis di Kas Warga & Tabel Iuran</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                    {receipt.id}
                  </span>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="py-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block mb-0.5">Unit Rumah</span>
                  <span className="font-bold text-stone-800 text-sm">Blok {currentUnitKey}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">Nama Warga / Pembayar</span>
                  <span className="font-bold text-stone-800 text-sm">{receipt.namaWarga || 'Warga'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">Metode Transaksi</span>
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    QRIS Standar Nasional
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-0.5">Tanggal Pembayaran</span>
                  <span className="font-medium text-stone-700">{receipt.tanggal}</span>
                </div>
                <div className="col-span-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-stone-500 block mb-1">Rincian Bulan Lunas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(receipt.bulanIndices || []).map((mIdx) => (
                      <span
                        key={mIdx}
                        className="px-2 py-0.5 bg-emerald-600 text-white font-medium rounded-md text-[11px] flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {config.bulanList[mIdx] || `Bulan ${mIdx + 1}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Banner */}
              <div className="mt-2 pt-3 border-t border-dashed border-stone-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Total Nominal Dibayar</span>
                <span className="text-xl font-bold font-mono text-emerald-700">
                  Rp {receipt.jumlah.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Actions for receipt */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={getWaConfirmationLink(receipt)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Bukti ke WA Bendahara</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kwitansi</span>
              </button>

              <button
                type="button"
                onClick={handleResetForNewPayment}
                className="w-full sm:w-auto py-2.5 px-4 bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Bayar Unit Lain
              </button>
            </div>
          </div>
        ) : (
          /* PAYMENT FORM & QRIS VIEW */
          <form onSubmit={handleSubmitPayment} className="p-5 sm:p-6 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* LEFT: Selection Form */}
              <div className="space-y-4">
                {/* 1. Unit Selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pilih Unit Rumah Warga</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-0.5">Blok</span>
                      <select
                        value={selectedBlok}
                        onChange={(e) => setSelectedBlok(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50"
                      >
                        {config.blokList.map((b) => (
                          <option key={b} value={b}>
                            Blok {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block mb-0.5">Nomor Rumah (1-40)</span>
                      <select
                        value={selectedUnitNumber}
                        onChange={(e) => setSelectedUnitNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50"
                      >
                        {Array.from({ length: config.totalRumahPerBlok || 40 }, (_, i) => (i + 1).toString()).map((num) => (
                          <option key={num} value={num}>
                            No. {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resident Info Box */}
                  <div className="mt-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 text-[11px]">Nama Warga Terdata:</span>
                      <span className="font-semibold text-stone-800">
                        {currentOccupant?.nama || <span className="text-stone-400 italic font-normal">Belum Terdata / Kosong</span>}
                      </span>
                    </div>
                    {currentOccupant?.catatan && (
                      <p className="text-[11px] text-stone-500 mt-1 italic">
                        Catatan: {currentOccupant.catatan}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Payer Name Input */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Nama Pembayar</span>
                  </label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Nama Anda atau kepala keluarga..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* 3. Month Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Bulan yang Dibayar ({selectedMonths.length})</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Rp {config.iuranPerBulan.toLocaleString('id-ID')} / bln
                    </span>
                  </div>

                  {/* Quick Select Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => selectQuick('current')}
                      className="px-2 py-1 text-[10px] font-semibold bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Bulan Berjalan
                    </button>
                    <button
                      type="button"
                      onClick={() => selectQuick('3months')}
                      className="px-2 py-1 text-[10px] font-semibold bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                    >
                      3 Bulan
                    </button>
                    <button
                      type="button"
                      onClick={() => selectQuick('6months')}
                      className="px-2 py-1 text-[10px] font-semibold bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                    >
                      6 Bulan
                    </button>
                    <button
                      type="button"
                      onClick={() => selectQuick('all')}
                      className="px-2 py-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                    >
                      1 Tahun Lunas
                    </button>
                  </div>

                  {/* 12 Months Grid */}
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 border border-stone-200 rounded-xl custom-scrollbar">
                    {config.bulanList.map((monthName, idx) => {
                      const isPaid = currentPayments[idx];
                      const isSelected = selectedMonths.includes(idx);

                      return (
                        <button
                          key={monthName}
                          type="button"
                          disabled={isPaid}
                          onClick={() => toggleMonth(idx)}
                          className={`p-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                            isPaid
                              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white hover:bg-emerald-50/60 text-stone-700 border-stone-200'
                          }`}
                        >
                          <span className="text-[11px]">{monthName}</span>
                          <span className="text-[9px] mt-0.5">
                            {isPaid ? 'LUNAS' : isSelected ? 'Dipilih' : `+20rb`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: QRIS Display & Total */}
              <div className="flex flex-col justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700">Kode QRIS Kas Warga</span>
                    <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-full">
                      Standar GPN
                    </span>
                  </div>

                  {/* QRIS Card with uploaded image */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm text-center">
                    <div className="relative group mx-auto max-w-[200px] overflow-hidden rounded-lg border border-stone-200">
                      <img
                        src="/public/assets/aistudio/WhatsApp_Image_2026-11-11_at_11.57.56_1f815094.jpeg"
                        alt="Kode QRIS Kas Warga Medina Residence Bantargedang"
                        className="w-full h-auto object-contain"
                        onError={(e) => {
                          // Fallback to /qris-medina.jpeg
                          (e.currentTarget as HTMLImageElement).src = '/qris-medina.jpeg';
                        }}
                      />
                    </div>
                    <div className="mt-2 text-[11px] text-stone-600">
                      <div className="font-bold text-stone-800">{config.qrisMerchant}</div>
                      <div className="font-mono text-[10px] text-stone-500">NMID: {config.qrisNmid}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 mt-2 text-center leading-tight">
                    Scan via BCA Mobile, Mandiri Livin, BRImo, BSI, GoPay, OVO, DANA, ShopeePay
                  </p>
                </div>

                {/* Total & Submit Button */}
                <div className="mt-4 pt-3 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[11px] text-stone-500 block">Total Iuran Sampah</span>
                      <span className="text-xs font-semibold text-emerald-800">
                        {selectedMonths.length} Bulan Dipilih
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-mono text-emerald-700">
                        Rp {totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || selectedMonths.length === 0}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      'Memproses...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Konfirmasi Telah Bayar via QRIS</span>
                      </>
                    )}
                  </button>
                  <span className="block text-center text-[10px] text-stone-400 mt-1.5">
                    Data akan langsung terdata otomatis & tersimpan secara real-time
                  </span>
                </div>
              </div>

            </div>
          </form>
        )}

      </div>
    </div>
  );
};
