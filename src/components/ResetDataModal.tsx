import React, { useState } from 'react';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';
import { api } from '../services/api';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSuccess: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  isOpen,
  onClose,
  onResetSuccess,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim().toLowerCase() !== 'kosongkan') {
      setError('Ketik kata "KOSONGKAN" untuk mengonfirmasi.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.resetToZero();
      onResetSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengosongkan data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 bg-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">Kosongkan Data Pembayaran Menjadi 0</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleReset} className="p-5 space-y-4 text-xs">
          <p className="text-stone-600 leading-relaxed">
            Tindakan ini akan <strong>mengosongkan seluruh status pembayaran warga menjadi 0</strong> (belum lunas) dan <strong>menghapus riwayat transaksi kas</strong> menjadi saldo Rp 0. Daftar nama warga dan konfigurasi perumahan tetap aman.
          </p>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Ketik kata <strong className="text-rose-700 font-mono">KOSONGKAN</strong> untuk melanjutkan:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="KOSONGKAN"
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none uppercase font-mono font-bold"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Mengosongkan...' : 'Ya, Kosongkan Jadi 0'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
