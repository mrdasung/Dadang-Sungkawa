export interface PerumahanConfig {
  namaPerumahan: string;
  lokasi: string;
  bendahara: string;
  kontakBendahara: string;
  rekeningKas: string;
  qrisMerchant: string;
  qrisNmid: string;
  qrisCode: string;
  qrisImageUrl: string;
  iuranPerBulan: number;
  periode: string;
  bulanList: string[];
  blokList: string[];
  totalRumahPerBlok: number;
}

export interface Occupant {
  nama: string;
  catatan?: string;
  telepon?: string;
  statusHunian?: 'ditempati' | 'belum_ditempati';
  anggotaKeluarga?: number;
}

export type OccupantsMap = Record<string, Occupant>;

export type PaymentsMap = Record<string, Record<string, boolean[]>>;

export interface Transaction {
  id: string;
  jenis: 'masuk' | 'keluar';
  kategori: string;
  keterangan: string;
  jumlah: number;
  tanggal: string;
  metode?: 'QRIS' | 'Transfer Bank' | 'Tunai';
  unitKey?: string;
  namaWarga?: string;
  bulanIndices?: number[];
  verified?: boolean;
}

export interface AppData {
  config: PerumahanConfig;
  payments: PaymentsMap;
  occupants: OccupantsMap;
  transactions: Transaction[];
  serverTime: string;
}
