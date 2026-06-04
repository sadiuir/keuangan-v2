'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { TransactionSchema, LoanSchema, AllocationSchema } from '@/lib/schemas';
import { calculateLoan, calculateSDA, calculateBudgetHealthIndex } from '@/lib/finance';
import { revalidatePath } from 'next/cache';

// Helper to verify user session
async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Sesi kedaluwarsa atau tidak valid. Silakan masuk kembali.');
  }
  return session.user.id;
}

// 1. AMBIL SELURUH DATA DASBOR
export async function getDashboardData() {
  try {
    const userId = await getUserId();
    
    // a. Ambil Dompet & Hitung Total Saldo
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
    
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    // b. Ambil Cicilan Aktif & Hitung Plafon Tagihan Bulanan
    const activeLoans = await prisma.loan.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const monthlyPaymentSum = activeLoans.reduce((sum, l) => sum + l.monthlyPayment, 0);

    // c. Hitung Sisa Dana Alokasi (SDA)
    const sda = calculateSDA(totalBalance, monthlyPaymentSum);

    // d. Hitung Arus Kas Bulanan (Pemasukan vs Pengeluaran)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        wallet: { userId },
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalIncome = monthlyTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    // e. Agregasi Grafik Harian (Daily Flux: tanggal 1 s.d. 31)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyFlux = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTransactions = monthlyTransactions.filter((t) => {
        const tDate = new Date(t.timestamp);
        return tDate.getDate() === day;
      });

      const income = dayTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
      
      dailyFlux.push({
        day: day.toString(),
        Pemasukan: income / 1000000, // Konversi ke "Jt" (Juta) sesuai spesifikasi
        Pengeluaran: expense / 1000000,
      });
    }

    // f. Ambil Alokasi Anggaran Terakhir
    let allocation = await prisma.allocation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!allocation) {
      allocation = await prisma.allocation.create({
        data: {
          savingsPct: 30,
          emergencyPct: 30,
          pocketPct: 40,
          userId,
        },
      });
    }

    // g. Ambil Tagihan Jatuh Tempo H-3 (EWS)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const upcomingBills = await prisma.loan.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        nextDueDate: {
          gte: startOfMonth, // Mulai awal bulan ini
          lte: threeDaysFromNow,
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    // h. Ambil Riwayat Transaksi Terbaru (10 Terakhir)
    const recentTransactions = await prisma.transaction.findMany({
      where: { wallet: { userId } },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        wallet: { select: { name: true } },
        toWallet: { select: { name: true } },
      },
    });

    // i. Hitung Indeks Kesehatan Anggaran (Health Index)
    // Budget total didasarkan pada sda atau pemasukan berjalan
    const healthIndex = calculateBudgetHealthIndex(sda > 0 ? sda : totalIncome, totalExpense);

    return {
      totalBalance,
      monthlyPaymentSum,
      sda,
      totalIncome,
      totalExpense,
      dailyFlux,
      allocation: {
        savings: allocation.savingsPct,
        emergency: allocation.emergencyPct,
        pocket: allocation.pocketPct,
      },
      upcomingBills,
      wallets,
      recentTransactions,
      healthIndex,
    };
  } catch (error: any) {
    return { error: error.message || 'Gagal mengambil data dasbor.' };
  }
}

// 2. DOMPET (WALLETS) ACTIONS
export async function createWallet(values: { name: string; type: string; balance: number; description?: string }) {
  try {
    const userId = await getUserId();
    
    if (!values.name || !values.type) {
      return { error: 'Nama dan tipe dompet wajib diisi.' };
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.create({
        data: {
          name: values.name,
          type: values.type,
          balance: values.balance || 0,
          description: values.description || '',
          userId,
        },
      });

      // Jika ada saldo awal, catat sebagai transaksi PEMASUKAN awal
      if (values.balance > 0) {
        await tx.transaction.create({
          data: {
            amount: values.balance,
            type: 'INCOME',
            category: 'Saldo Awal',
            description: `Saldo awal pembukaan dompet ${values.name}`,
            walletId: wallet.id,
            timestamp: new Date(),
          },
        });
      }
    });

    revalidatePath('/dashboard');
    return { success: 'Dompet berhasil ditambahkan!' };
  } catch (error: any) {
    return { error: error.message || 'Gagal membuat dompet.' };
  }
}

export async function deleteWallet(walletId: string) {
  try {
    const userId = await getUserId();

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.userId !== userId) {
      return { error: 'Dompet tidak ditemukan atau Anda tidak berwenang.' };
    }

    // Eksekusi Cascade-Delete (ACID Clean-up)
    // Prisma secara otomatis menghapus transaksi terkait dompet ini karena relasi Cascade didefinisikan di schema.prisma
    await prisma.wallet.delete({
      where: { id: walletId },
    });

    revalidatePath('/dashboard');
    return { success: 'Dompet beserta seluruh riwayat transaksi di dalamnya berhasil dihapus permanen.' };
  } catch (error: any) {
    return { error: error.message || 'Gagal menghapus dompet.' };
  }
}

export async function updateWallet(walletId: string, values: { name: string; balance: number }) {
  try {
    const userId = await getUserId();

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.userId !== userId) {
      return { error: 'Dompet tidak ditemukan.' };
    }

    const diff = values.balance - wallet.balance;

    await prisma.$transaction(async (tx) => {
      // Update dompet
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          name: values.name,
          balance: values.balance,
        },
      });

      // Jika saldo diubah (Manual Override), catat log transaksi penyesuaian saldo
      if (diff !== 0) {
        await tx.transaction.create({
          data: {
            amount: Math.abs(diff),
            type: diff > 0 ? 'INCOME' : 'EXPENSE',
            category: 'Koreksi Saldo',
            description: `Manual Override: Penyesuaian saldo dompet '${values.name}'`,
            walletId: walletId,
            timestamp: new Date(),
          },
        });
      }
    });

    revalidatePath('/dashboard');
    return { success: 'Dompet berhasil diubah!' };
  } catch (error: any) {
    return { error: error.message || 'Gagal mengubah dompet.' };
  }
}

// 3. TRANSAKSI (TRANSACTIONS) ACTIONS - ACID COMPLIANT
export async function createTransaction(values: any) {
  try {
    const userId = await getUserId();
    const validated = TransactionSchema.safeParse(values);

    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || 'Data transaksi tidak valid.';
      return { error: firstError };
    }

    const data = validated.data;
    
    // ACID Transaction via prisma.$transaction
    await prisma.$transaction(async (tx) => {
      // Ambil & validasi dompet asal
      const sourceWallet = await tx.wallet.findUnique({
        where: { id: data.walletId },
      });

      if (!sourceWallet || sourceWallet.userId !== userId) {
        throw new Error('Dompet asal tidak ditemukan.');
      }

      // a. Logika Pengeluaran / Transfer
      if (data.type === 'EXPENSE' || data.type === 'TRANSFER') {
        // Double Check Logic: Validasi kecukupan saldo secara real-time
        if (sourceWallet.balance < data.amount) {
          throw new Error(`Saldo tidak mencukupi di dompet '${sourceWallet.name}'. (Tersedia: Rp${sourceWallet.balance}, Dibutuhkan: Rp${data.amount})`);
        }

        // Kurangi saldo asal
        await tx.wallet.update({
          where: { id: data.walletId },
          data: { balance: { decrement: data.amount } },
        });
      }

      // b. Logika Pemasukan
      if (data.type === 'INCOME') {
        // Tambahkan saldo asal
        await tx.wallet.update({
          where: { id: data.walletId },
          data: { balance: { increment: data.amount } },
        });
      }

      // c. Logika khusus jika Transfer
      if (data.type === 'TRANSFER') {
        if (!data.toWalletId) throw new Error('Dompet tujuan wajib diisi untuk transfer.');
        
        const targetWallet = await tx.wallet.findUnique({
          where: { id: data.toWalletId },
        });

        if (!targetWallet || targetWallet.userId !== userId) {
          throw new Error('Dompet tujuan tidak ditemukan.');
        }

        // Tambahkan saldo dompet tujuan
        await tx.wallet.update({
          where: { id: data.toWalletId },
          data: { balance: { increment: data.amount } },
        });
      }

      // d. Catat log riwayat transaksi
      await tx.transaction.create({
        data: {
          amount: data.amount,
          type: data.type,
          category: data.category,
          description: data.description,
          walletId: data.walletId,
          toWalletId: data.type === 'TRANSFER' ? data.toWalletId : null,
          isNeed: data.isNeed,
          timestamp: new Date(),
        },
      });
    });

    revalidatePath('/dashboard');
    return { success: 'Transaksi berhasil dicatat!' };
  } catch (error: any) {
    return { error: error.message || 'Gagal menyimpan transaksi.' };
  }
}

// 4. CICILAN / PINJAMAN (LOANS) ACTIONS
export async function createLoan(values: any) {
  try {
    const userId = await getUserId();
    const validated = LoanSchema.safeParse(values);

    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || 'Data cicilan tidak valid.';
      return { error: firstError };
    }

    const data = validated.data;

    // Lakukan simulasi kalkulator pinjaman secara instan
    const calcResult = calculateLoan(data.principal, data.interestRate, data.termMonths, data.interestType);

    // Hitung tanggal jatuh tempo pertama (1 bulan dari sekarang)
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    nextDueDate.setHours(0, 0, 0, 0);

    // Buat kontrak cicilan baru
    await prisma.loan.create({
      data: {
        name: data.name,
        principal: data.principal,
        interestRate: data.interestRate,
        termMonths: data.termMonths,
        remainingTerm: data.termMonths,
        interestType: data.interestType,
        nextDueDate,
        monthlyPayment: calcResult.monthlyPayment,
        remainingPrincipal: data.principal,
        autoDebet: data.autoDebet,
        walletId: data.walletId,
        userId,
      },
    });

    revalidatePath('/dashboard');
    return { success: 'Kontrak cicilan berhasil dibuat!' };
  } catch (error: any) {
    return { error: error.message || 'Gagal membuat kontrak cicilan.' };
  }
}

// 5. ALOKASI ANGGARAN (ALLOCATIONS) ACTIONS
export async function updateAllocation(values: { savingsPct: number; emergencyPct: number; pocketPct: number }) {
  try {
    const userId = await getUserId();
    const validated = AllocationSchema.safeParse(values);

    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Persentase alokasi tidak valid.' };
    }

    // Buat alokasi baru (Non-retroaktif / history per periode)
    await prisma.allocation.create({
      data: {
        savingsPct: values.savingsPct,
        emergencyPct: values.emergencyPct,
        pocketPct: values.pocketPct,
        userId,
      },
    });

    revalidatePath('/dashboard');
    return { success: 'Alokasi anggaran berhasil diperbarui!' };
  } catch (error: any) {
    return { error: error.message || 'Gagal menyimpan alokasi.' };
  }
}

// 6. MODE ANAK KOST (SURVIVAL GAUGE ACTIONS)
export async function getModeAnakKostData(walletId: string) {
  try {
    const userId = await getUserId();
    const now = new Date();
    
    // Hitung Dimensi Waktu kalender berjalan
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = totalDaysInMonth - currentDay + 1; // Inklusif hari ini

    // Ambil detail dompet basis anggaran
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.userId !== userId) {
      throw new Error('Dompet basis anggaran tidak ditemukan.');
    }

    // Ambil Alokasi untuk mendapatkan jatah pocket/jajan
    const allocation = await prisma.allocation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const pocketPct = allocation ? allocation.pocketPct : 40;
    
    // Nominal anggaran awal bulan = total saldo dompet dikali persentase jajan
    // Kita simpan estimasi jatah survive awal bulan
    const totalInitialBudget = wallet.balance * (pocketPct / 100);

    // Ambil pengeluaran kategori 'Makan' & 'Jajan' (atau semua kategori non-kebutuhan wajib) bulan berjalan di dompet tersebut
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const transactions = await prisma.transaction.findMany({
      where: {
        walletId,
        type: 'EXPENSE',
        timestamp: { gte: startOfMonth },
      },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const actualRemaining = wallet.balance;

    // Batas Harian Tetap (Base Limit): Math.floor(DanaAwal / TotalHari)
    const baseLimit = Math.floor(totalInitialBudget / totalDaysInMonth) || 10000; // minimal 10rb default

    // Expected remaining: Base Limit * Hari Tersisa
    const requiredAmount = baseLimit * daysRemaining;

    let dailyLimit = 0;
    let isPenalty = false;
    let rewardOrPenaltyValue = 0;

    // Evaluasi Sisa Dana & Penghitungan Jatah Hari Ini (Smart Daily Optimizer)
    if (actualRemaining < requiredAmount) {
      // Overspending / Penalty Mode
      isPenalty = true;
      dailyLimit = Math.floor(Math.max(0, actualRemaining / daysRemaining));
      rewardOrPenaltyValue = requiredAmount - actualRemaining;
    } else {
      // Reward / Rollover Mode
      isPenalty = false;
      const surplus = actualRemaining - requiredAmount;
      dailyLimit = Math.floor(baseLimit + (surplus / daysRemaining));
      rewardOrPenaltyValue = surplus;
    }

    return {
      daysRemaining,
      totalDaysInMonth,
      currentDay,
      baseLimit,
      requiredAmount,
      actualRemaining,
      dailyLimit,
      isPenalty,
      rewardOrPenaltyValue,
      totalInitialBudget,
      totalSpent,
    };
  } catch (error: any) {
    return { error: error.message || 'Gagal menghitung statistik Anak Kost.' };
  }
}

// Tindak lanjut pengalihan surplus (sweeping sisa tabungan harian)
export async function sweepSurplus(values: { sourceWalletId: string; targetWalletId: string; amount: number }) {
  try {
    const userId = await getUserId();
    
    if (values.sourceWalletId === values.targetWalletId) {
      return { error: 'Dompet asal dan tujuan pengalihan tidak boleh sama.' };
    }

    await prisma.$transaction(async (tx) => {
      const source = await tx.wallet.findUnique({ where: { id: values.sourceWalletId } });
      const target = await tx.wallet.findUnique({ where: { id: values.targetWalletId } });

      if (!source || source.userId !== userId || !target || target.userId !== userId) {
        throw new Error('Dompet asal/tujuan tidak ditemukan.');
      }

      if (source.balance < values.amount) {
        throw new Error('Saldo dompet asal tidak mencukupi untuk dialihkan.');
      }

      // Pindahkan saldo
      await tx.wallet.update({
        where: { id: values.sourceWalletId },
        data: { balance: { decrement: values.amount } },
      });

      await tx.wallet.update({
        where: { id: values.targetWalletId },
        data: { balance: { increment: values.amount } },
      });

      // Catat transaksi transfer untuk surplus Anak Kost
      await tx.transaction.create({
        data: {
          amount: values.amount,
          type: 'TRANSFER',
          category: 'Surplus Anak Kost',
          description: 'Pengalihan surplus akumulasi hemat Mode Anak Kost',
          walletId: values.sourceWalletId,
          toWalletId: values.targetWalletId,
          timestamp: new Date(),
        },
      });
    });

    revalidatePath('/dashboard');
    return { success: 'Sisa dana surplus berhasil dialihkan!' };
  } catch (error: any) {
    return { error: error.message || 'Gagal mengalihkan surplus.' };
  }
}
