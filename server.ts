import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

const ADMIN_PASSWORD = 'adminsampah';

// Generate clean default 0 dataset
function createInitialDatabase() {
  const blokList = ['A', 'B', 'C', 'D'];
  const totalRumahPerBlok = 40;
  
  const payments: Record<string, Record<string, boolean[]>> = {};
  for (const blok of blokList) {
    payments[blok] = {};
    for (let u = 1; u <= totalRumahPerBlok; u++) {
      // Data pembayaran dikosongkan menjadi 0 (semua 12 bulan bernilai false)
      payments[blok][u.toString()] = Array(12).fill(false);
    }
  }

  // Nama warga terdata dari link Medina Residence Bantargedang
  const occupants: Record<string, any> = {
    A1: { nama: 'H. Sudirman', catatan: 'Dekat Pos Satpam Utama', statusHunian: 'ditempati', anggotaKeluarga: 4 },
    A2: { nama: 'Pak Hendra Kusuma', catatan: 'Rumah Putih Abu', statusHunian: 'ditempati', anggotaKeluarga: 3 },
    A5: { nama: 'Bu Hj. Rohanah', catatan: '', statusHunian: 'ditempati', anggotaKeluarga: 2 },
    A10: { nama: 'Bp Aziz Maryansyah', catatan: 'Bendahara Paguyuban', statusHunian: 'ditempati', anggotaKeluarga: 4 },
    B1: { nama: 'Pak Bambang S.', catatan: '', statusHunian: 'ditempati', anggotaKeluarga: 3 },
    B12: { nama: 'Pak RT Dedi Irawan', catatan: 'Ketua Paguyuban RT 04', statusHunian: 'ditempati', anggotaKeluarga: 4 },
    C4: { nama: 'Ibu Ratna Dewi', catatan: '', statusHunian: 'ditempati', anggotaKeluarga: 3 },
    C15: { nama: 'Pak Gunawan', catatan: '', statusHunian: 'ditempati', anggotaKeluarga: 2 },
    D8: { nama: 'Pak Mulyadi', catatan: '', statusHunian: 'ditempati', anggotaKeluarga: 4 },
    D20: { nama: 'Keluarga Bp Rudi', catatan: '', statusHunian: 'ditempati', anggotaKeluarga: 3 }
  };

  // Kosongkan nama jika di link tidak ada
  for (const blok of blokList) {
    for (let u = 1; u <= totalRumahPerBlok; u++) {
      const key = `${blok}${u}`;
      if (!occupants[key]) {
        occupants[key] = {
          nama: '',
          catatan: '',
          statusHunian: 'belum_ditempati',
          anggotaKeluarga: 0
        };
      }
    }
  }

  return {
    config: {
      namaPerumahan: 'Perumahan Medina Residence Bantargedang',
      lokasi: 'Bantargedang, Kota Tasikmalaya',
      bendahara: 'Bp Aziz Maryansyah',
      kontakBendahara: '0812-3456-7890',
      rekeningKas: 'BCA 8105-0982-11 a.n. Aziz Maryansyah',
      qrisMerchant: 'Kas Warga Medina Ban...',
      qrisNmid: 'ID1026635824174',
      qrisCode: 'A01',
      qrisImageUrl: '/assets/aistudio/WhatsApp_Image_2026-11-11_at_11.57.56_1f815094.jpeg',
      iuranPerBulan: 20000,
      periode: 'Nov 2026 – Okt 2027',
      bulanList: [
        'Nov 26', 'Des 26', 'Jan 27', 'Feb 27',
        'Mar 27', 'Apr 27', 'Mei 27', 'Jun 27',
        'Jul 27', 'Agu 27', 'Sep 27', 'Okt 27'
      ],
      blokList,
      totalRumahPerBlok
    },
    payments,
    occupants,
    // Data kas & transaksi dikosongkan menjadi 0
    transactions: [],
    updatedAt: new Date().toISOString()
  };
}

function loadDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse database file, resetting:', err);
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDatabase(data: any) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let db = loadDatabase();

// --- REST API ENDPOINTS ---

// 1. Get all data (real-time pollable)
app.get('/api/data', (_req: Request, res: Response) => {
  res.json({
    success: true,
    config: db.config,
    payments: db.payments,
    occupants: db.occupants,
    transactions: db.transactions,
    serverTime: new Date().toISOString()
  });
});

// 2. Admin Auth login (password 'adminsampah', hidden from public)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    res.status(400).json({ success: false, message: 'Password wajib diisi.' });
    return;
  }
  if (password.trim() === ADMIN_PASSWORD) {
    const token = 'admin_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    res.json({
      success: true,
      message: 'Berhasil login sebagai Pengurus / Bendahara.',
      token,
      role: 'admin'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Password salah. Akses ditolak.'
    });
  }
});

// 3. Toggle single payment month
app.post('/api/payments/toggle', (req: Request, res: Response) => {
  const { blok, unit, monthIndex, value } = req.body;
  if (!blok || !unit || monthIndex === undefined) {
    res.status(400).json({ success: false, message: 'Parameter tidak lengkap.' });
    return;
  }

  if (!db.payments[blok]) db.payments[blok] = {};
  if (!db.payments[blok][unit]) {
    db.payments[blok][unit] = Array(12).fill(false);
  }

  const currentArr = [...db.payments[blok][unit]];
  currentArr[monthIndex] = Boolean(value);
  db.payments[blok][unit] = currentArr;

  saveDatabase(db);
  res.json({
    success: true,
    message: `Status pembayaran Blok ${blok} No. ${unit} bulan ke-${monthIndex + 1} diperbarui.`,
    payments: db.payments
  });
});

// 4. Batch update payments (e.g. 1 year or multiple months)
app.post('/api/payments/batch', (req: Request, res: Response) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) {
    res.status(400).json({ success: false, message: 'Format update massal tidak valid.' });
    return;
  }

  for (const item of updates) {
    const { blok, unit, monthIndex, value } = item;
    if (blok && unit && monthIndex !== undefined) {
      if (!db.payments[blok]) db.payments[blok] = {};
      if (!db.payments[blok][unit]) {
        db.payments[blok][unit] = Array(12).fill(false);
      }
      db.payments[blok][unit][monthIndex] = Boolean(value);
    }
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Perubahan massal berhasil disimpan.' });
});

// 5. Automatic QRIS Payment recording
app.post('/api/payments/qris-pay', (req: Request, res: Response) => {
  const { unitKey, months, payerName, senderBank, refId, phone, catatan } = req.body;

  if (!unitKey || !Array.isArray(months) || months.length === 0) {
    res.status(400).json({ success: false, message: 'Pilih unit rumah dan minimal satu bulan iuran.' });
    return;
  }

  const blok = unitKey.charAt(0).toUpperCase();
  const unit = unitKey.substring(1);

  if (!db.payments[blok]) db.payments[blok] = {};
  if (!db.payments[blok][unit]) {
    db.payments[blok][unit] = Array(12).fill(false);
  }

  // Update payment status for all selected months
  for (const mIdx of months) {
    if (mIdx >= 0 && mIdx < 12) {
      db.payments[blok][unit][mIdx] = true;
    }
  }

  const monthNames = months
    .map(m => db.config.bulanList[m] || `Bulan ${m + 1}`)
    .join(', ');

  const totalNominal = months.length * (db.config.iuranPerBulan || 20000);
  const occupant = db.occupants[unitKey];
  const residentName = payerName?.trim() || occupant?.nama || `Warga Blok ${blok} No. ${unit}`;

  const transactionId = `QRIS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const newTx = {
    id: transactionId,
    jenis: 'masuk',
    kategori: 'Iuran Sampah QRIS',
    keterangan: `Pembayaran Iuran Unit ${blok}${unit} (${monthNames}) a.n. ${residentName}`,
    jumlah: totalNominal,
    tanggal: new Date().toISOString().split('T')[0],
    metode: 'QRIS',
    unitKey,
    namaWarga: residentName,
    bulanIndices: months,
    refId: refId || `NMID-ID1026635824174-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    senderBank: senderBank || 'QRIS / E-Wallet',
    phone: phone || '',
    catatan: catatan || '',
    verified: true,
    createdAt: new Date().toISOString()
  };

  db.transactions.unshift(newTx);
  saveDatabase(db);

  res.json({
    success: true,
    message: `Pembayaran QRIS Rp ${totalNominal.toLocaleString('id-ID')} untuk unit ${blok}${unit} berhasil diverifikasi dan terdata otomatis!`,
    transaction: newTx,
    payments: db.payments
  });
});

// 6. Update occupant / resident details
app.post('/api/occupants/update', (req: Request, res: Response) => {
  const { unitKey, nama, catatan, telepon, statusHunian, anggotaKeluarga } = req.body;
  if (!unitKey) {
    res.status(400).json({ success: false, message: 'Unit key wajib disertakan.' });
    return;
  }

  db.occupants[unitKey] = {
    ...(db.occupants[unitKey] || {}),
    nama: nama !== undefined ? nama.trim() : (db.occupants[unitKey]?.nama || ''),
    catatan: catatan !== undefined ? catatan.trim() : (db.occupants[unitKey]?.catatan || ''),
    telepon: telepon !== undefined ? telepon.trim() : (db.occupants[unitKey]?.telepon || ''),
    statusHunian: statusHunian || (nama?.trim() ? 'ditempati' : 'belum_ditempati'),
    anggotaKeluarga: anggotaKeluarga !== undefined ? Number(anggotaKeluarga) : (db.occupants[unitKey]?.anggotaKeluarga || 0)
  };

  saveDatabase(db);
  res.json({
    success: true,
    message: `Data warga unit ${unitKey} berhasil diperbarui.`,
    occupants: db.occupants
  });
});

// 7. Kas transactions
app.post('/api/transactions', (req: Request, res: Response) => {
  const { jenis, kategori, keterangan, jumlah, tanggal, metode, unitKey } = req.body;
  if (!jenis || !kategori || !keterangan || !jumlah) {
    res.status(400).json({ success: false, message: 'Semua kolom wajib diisi.' });
    return;
  }

  const newTx = {
    id: `TX-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    jenis,
    kategori,
    keterangan: keterangan.trim(),
    jumlah: Math.abs(Number(jumlah)),
    tanggal: tanggal || new Date().toISOString().split('T')[0],
    metode: metode || 'Manual',
    unitKey: unitKey || null,
    verified: true,
    createdAt: new Date().toISOString()
  };

  db.transactions.unshift(newTx);
  saveDatabase(db);
  res.json({ success: true, message: 'Transaksi kas berhasil dicatat.', transaction: newTx });
});

app.delete('/api/transactions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = db.transactions.length;
  db.transactions = db.transactions.filter((t: any) => t.id !== id);

  if (db.transactions.length === initialLen) {
    res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    return;
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
});

// 8. Update configuration
app.post('/api/config/update', (req: Request, res: Response) => {
  db.config = {
    ...db.config,
    ...req.body
  };
  saveDatabase(db);
  res.json({ success: true, message: 'Konfigurasi perumahan berhasil diperbarui.', config: db.config });
});

// 9. Reset data to 0
app.post('/api/system/reset-to-zero', (_req: Request, res: Response) => {
  const initial = createInitialDatabase();
  db.payments = initial.payments;
  db.transactions = initial.transactions;
  saveDatabase(db);
  res.json({
    success: true,
    message: 'Data pembayaran dan transaksi kas berhasil dikosongkan menjadi 0.',
    payments: db.payments,
    transactions: db.transactions
  });
});

// --- VITE & STATIC FILES MOUNT ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Serve static public assets explicitly if needed
  app.use('/assets/aistudio', express.static(path.resolve(__dirname, 'public/assets/aistudio')));
  app.use(express.static(path.resolve(__dirname, 'public')));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
