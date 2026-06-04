import { z } from 'zod';

// 1. OAUTH / AUTH CREDENTIALS SCHEMAS
export const LoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal terdiri dari 6 karakter'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Nama minimal terdiri dari 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal terdiri dari 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal terdiri dari 6 karakter'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Kata sandi dan konfirmasi kata sandi tidak cocok',
  path: ['confirmPassword'],
});

// 2. TRANSACTION SCHEMAS
export const TransactionSchema = z.object({
  amount: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    // Bersihkan format ribuan jika ada (titik)
    const cleanedVal = val.replace(/\./g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleanedVal);
    if (isNaN(parsed)) return 0;
    return parsed;
  }).pipe(z.number().positive('Nominal transaksi harus lebih besar dari 0')),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
    message: 'Tipe transaksi wajib dipilih',
  }),
  category: z.string().min(1, 'Kategori wajib diisi'),
  description: z.string().optional().nullable(),
  walletId: z.string().min(1, 'Dompet asal wajib dipilih'),
  toWalletId: z.string().optional().nullable(),
  isNeed: z.boolean().default(false),
}).refine((data) => {
  if (data.type === 'TRANSFER' && !data.toWalletId) {
    return false;
  }
  return true;
}, {
  message: 'Dompet tujuan wajib dipilih untuk tipe transfer',
  path: ['toWalletId'],
});

// 3. LOAN SCHEMAS
export const LoanSchema = z.object({
  name: z.string().min(2, 'Nama cicilan/pinjaman minimal terdiri dari 2 karakter'),
  principal: z.union([z.number(), z.string()]).transform((val) => {
    if (typeof val === 'number') return val;
    const cleanedVal = val.replace(/\./g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleanedVal);
    if (isNaN(parsed)) return 0;
    return parsed;
  }).pipe(z.number().positive('Pokok pinjaman harus lebih besar dari 0')),
  interestRate: z.coerce.number().min(0, 'Suku bunga tidak boleh negatif'),
  termMonths: z.coerce.number().int().positive('Tenor harus berupa bilangan bulat positif'),
  interestType: z.enum(['FLAT', 'EFEKTIF', 'ANUITAS'], {
    message: 'Tipe bunga wajib dipilih',
  }),
  walletId: z.string().min(1, 'Dompet pembayaran wajib dipilih'),
  autoDebet: z.boolean().default(true),
});

// 4. ALLOCATION SCHEMAS
export const AllocationSchema = z.object({
  savingsPct: z.coerce.number().min(0).max(100),
  emergencyPct: z.coerce.number().min(0).max(100),
  pocketPct: z.coerce.number().min(0).max(100),
}).refine((data) => {
  const total = data.savingsPct + data.emergencyPct + data.pocketPct;
  // Toleransi float precision kecil
  return Math.abs(total - 100) < 0.01;
}, {
  message: 'Total persentase alokasi wajib berjumlah tepat 100%',
  path: ['savingsPct'],
});
