'use server';

import { RegisterSchema, LoginSchema } from '@/lib/schemas';
import { prisma } from '@/lib/db';
import { hashSync, genSaltSync } from 'bcrypt-ts';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { ensureUserSettingsSchema } from '@/lib/migrations';

// 1. REGISTRASI USER BARU (Standard Credentials - Tanpa Syarat NPM)
export async function registerUser(values: any) {
  try {
    // Run self-healing schema migration to ensure settings fields exist before querying User table
    await ensureUserSettingsSchema();
    
    const validatedFields = RegisterSchema.safeParse(values);
    
    if (!validatedFields.success) {
      const firstError = validatedFields.error.issues[0]?.message || 'Data input tidak valid.';
      return { error: firstError };
    }
    
    const { name, email, password } = validatedFields.data;
    
    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return { error: 'Email sudah terdaftar di sistem.' };
    }
    
    // Hash password menggunakan bcrypt-ts (Pure JS, kompatibel di Edge)
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);
    
    // Simpan user baru ke database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Otomatis buatkan dompet default (misal dompet Tunai & BCA) agar user langsung bisa bertransaksi
    const cashWallet = await prisma.wallet.create({
      data: {
        name: 'Dompet Tunai',
        type: 'CASH',
        balance: 0,
        description: 'Uang tunai fisik harian',
        userId: user.id,
      },
    });

    // Buat alokasi default (Tabungan 30%, Darurat 30%, Jajan 40%)
    await prisma.allocation.create({
      data: {
        savingsPct: 30,
        emergencyPct: 30,
        pocketPct: 40,
        userId: user.id,
      },
    });
    
    return { success: 'Registrasi berhasil! Silakan masuk.' };
  } catch (error: any) {
    return { error: error.message || 'Terjadi kesalahan sistem saat registrasi.' };
  }
}

// 2. LOGIN USER
export async function loginUser(values: any) {
  const validatedFields = LoginSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return { error: 'Format email atau password tidak valid.' };
  }
  
  const { email, password } = validatedFields.data;
  
  try {
    // Jalankan otentikasi NextAuth
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });
    
    return { success: 'Berhasil masuk!' };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email atau password salah.' };
        default:
          return { error: 'Terjadi kesalahan otentikasi sistem.' };
      }
    }
    // Next.js redirect melemparkan error yang harus di-throw ulang agar navigasi berhasil
    throw error;
  }
}
