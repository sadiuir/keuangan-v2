import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    // 1. Validasi Token Keamanan CRON_SECRET
    const { searchParams } = new URL(req.url);
    const secretParam = searchParams.get('secret');
    
    const authHeader = req.headers.get('authorization');
    const secretHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || (secretParam !== expectedSecret && secretHeader !== expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    // Set jam ke 00:00:00 untuk perbandingan tanggal saja
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 2. Query Kontrak Cicilan Aktif yang jatuh tempo hari ini atau sebelumnya
    const activeLoans = await prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        nextDueDate: {
          lte: todayEnd, // Jatuh tempo hari ini atau lampau (jika cron terlewat)
        },
      },
      include: {
        wallet: true,
      },
    });

    const results = [];

    // 3. Proses Auto-Debet (Looping dengan Try-Catch per Loan agar satu kegagalan tidak mematikan antrean)
    for (const loan of activeLoans) {
      const loanResult = { loanId: loan.id, name: loan.name, status: '' };

      try {
        // Cek kecukupan saldo dompet sumber
        if (loan.wallet.balance < loan.monthlyPayment) {
          // Saldo kurang: Catat kegagalan di CronLog (Status tertunda)
          await prisma.cronLog.create({
            data: {
              taskName: 'AUTO_DEBET',
              status: 'FAILED',
              logMessage: `Gagal debet otomatis untuk cicilan '${loan.name}': Saldo dompet '${loan.wallet.name}' tidak mencukupi (Tersedia: Rp${loan.wallet.balance}, Dibutuhkan: Rp${loan.monthlyPayment}).`,
              userId: loan.userId,
            },
          });
          
          loanResult.status = 'PENDING_INSUFFICIENT_FUNDS';
          results.push(loanResult);
          continue;
        }

        // Hitung bunga dan pokok untuk bulan berjalan (untuk update remainingPrincipal)
        const i = loan.interestRate / 12 / 100;
        let interestPaid = 0;
        let principalPaid = 0;

        if (loan.interestType === 'FLAT') {
          interestPaid = loan.principal * i;
          principalPaid = loan.monthlyPayment - interestPaid;
        } else if (loan.interestType === 'EFEKTIF' || loan.interestType === 'ANUITAS') {
          interestPaid = loan.remainingPrincipal * i;
          principalPaid = loan.monthlyPayment - interestPaid;
        }

        // Bulatkan ke desimal
        interestPaid = Math.round(interestPaid * 100) / 100;
        principalPaid = Math.round(Math.min(loan.remainingPrincipal, principalPaid) * 100) / 100;

        const nextDueDate = new Date(loan.nextDueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1); // Tambah 1 bulan

        const newRemainingTerm = loan.remainingTerm - 1;
        const newRemainingPrincipal = Math.max(0, loan.remainingPrincipal - principalPaid);
        const isFullyPaid = newRemainingTerm <= 0 || newRemainingPrincipal <= 0;

        // Eksekusi Transaksi ACID: All-or-Nothing
        await prisma.$transaction([
          // a. Potong saldo dompet
          prisma.wallet.update({
            where: { id: loan.walletId },
            data: {
              balance: {
                decrement: loan.monthlyPayment,
              },
            },
          }),
          // b. Catat log pengeluaran transaksi
          prisma.transaction.create({
            data: {
              amount: loan.monthlyPayment,
              type: 'EXPENSE',
              category: 'Cicilan',
              description: `Auto-debet pinjaman: ${loan.name} (Bulan ke-${loan.termMonths - loan.remainingTerm + 1})`,
              walletId: loan.walletId,
              isNeed: true,
              timestamp: today,
            },
          }),
          // c. Update status & tenor pinjaman
          prisma.loan.update({
            where: { id: loan.id },
            data: {
              remainingTerm: newRemainingTerm,
              remainingPrincipal: newRemainingPrincipal,
              status: isFullyPaid ? 'PAID' : 'ACTIVE',
              nextDueDate: nextDueDate,
            },
          }),
          // d. Catat histori sukses di CronLogs
          prisma.cronLog.create({
            data: {
              taskName: 'AUTO_DEBET',
              status: 'SUCCESS',
              logMessage: `Sukses debet otomatis untuk cicilan '${loan.name}' sebesar Rp${loan.monthlyPayment}. Sisa tenor: ${newRemainingTerm} bulan.`,
              userId: loan.userId,
            },
          }),
        ]);

        loanResult.status = isFullyPaid ? 'FULLY_PAID' : 'SUCCESS';
        results.push(loanResult);
      } catch (err: any) {
        // Jika transaksi ACID gagal (Rollback berjalan otomatis)
        await prisma.cronLog.create({
          data: {
            taskName: 'AUTO_DEBET',
            status: 'FAILED',
            logMessage: `Error sistem saat debet otomatis '${loan.name}': ${err.message || err}`,
            userId: loan.userId,
          },
        });
        
        loanResult.status = 'ERROR';
        results.push(loanResult);
      }
    }

    // 4. EARLY WARNING SYSTEM (EWS) H-3
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStart = new Date(threeDaysFromNow.getFullYear(), threeDaysFromNow.getMonth(), threeDaysFromNow.getDate());
    const threeDaysEnd = new Date(threeDaysFromNow.getFullYear(), threeDaysFromNow.getMonth(), threeDaysFromNow.getDate(), 23, 59, 59, 999);

    const upcomingLoans = await prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        nextDueDate: {
          gte: todayStart,
          lte: threeDaysEnd,
        },
      },
    });

    for (const upcoming of upcomingLoans) {
      const diffTime = Math.abs(upcoming.nextDueDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Catat info EWS di CronLog untuk kebutuhan audit/notifikasi
      await prisma.cronLog.create({
        data: {
          taskName: 'EWS',
          status: 'SUCCESS',
          logMessage: `EWS H-${diffDays}: Cicilan '${upcoming.name}' akan jatuh tempo dalam ${diffDays} hari pada tanggal ${upcoming.nextDueDate.toLocaleDateString('id-ID')}. nominal tagihan: Rp${upcoming.monthlyPayment}.`,
          userId: upcoming.userId,
        },
      });
    }

    return NextResponse.json({
      message: 'Cron job executed successfully',
      processedLoans: results,
      ewsCount: upcomingLoans.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
