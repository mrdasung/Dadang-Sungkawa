import { AppData, PerumahanConfig, Occupant, Transaction, PaymentsMap } from '../types';

export const api = {
  async getData(): Promise<AppData> {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Gagal memuat data sistem.');
    const json = await res.json();
    return json;
  },

  async login(password: string): Promise<{ success: boolean; token: string; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login gagal.');
    return json;
  },

  async togglePayment(blok: string, unit: string, monthIndex: number, value: boolean): Promise<any> {
    const res = await fetch('/api/payments/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blok, unit, monthIndex, value }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal mengubah status pembayaran.');
    return json;
  },

  async batchUpdatePayments(updates: { blok: string; unit: string; monthIndex: number; value: boolean }[]): Promise<any> {
    const res = await fetch('/api/payments/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal menyimpan pembaruan massal.');
    return json;
  },

  async payViaQris(payload: {
    unitKey: string;
    months: number[];
    payerName?: string;
    senderBank?: string;
    refId?: string;
    phone?: string;
    catatan?: string;
  }): Promise<{ success: boolean; message: string; transaction: Transaction; payments: PaymentsMap }> {
    const res = await fetch('/api/payments/qris-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal memproses pembayaran QRIS.');
    return json;
  },

  async updateOccupant(unitKey: string, data: Partial<Occupant>): Promise<any> {
    const res = await fetch('/api/occupants/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitKey, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal memperbarui data warga.');
    return json;
  },

  async addTransaction(data: {
    jenis: 'masuk' | 'keluar';
    kategori: string;
    keterangan: string;
    jumlah: number;
    tanggal?: string;
    metode?: string;
    unitKey?: string;
  }): Promise<any> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal mencatat transaksi.');
    return json;
  },

  async deleteTransaction(id: string): Promise<any> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal menghapus transaksi.');
    return json;
  },

  async updateConfig(data: Partial<PerumahanConfig>): Promise<any> {
    const res = await fetch('/api/config/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal memperbarui konfigurasi.');
    return json;
  },

  async resetToZero(): Promise<any> {
    const res = await fetch('/api/system/reset-to-zero', {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Gagal mengosongkan data.');
    return json;
  },
};
