import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDashboardData } from '@/app/actions/finance';
import Sidebar from '@/components/Sidebar';
import HighlightCards from '@/components/HighlightCards';
import Charts from '@/components/Charts';
import UpcomingBills from '@/components/UpcomingBills';
import WalletManager from '@/components/WalletManager';
import { formatRupiah } from '@/components/HighlightCards';
import { Calendar, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { ensureUserSettingsSchema } from '@/lib/migrations';


export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Jalankan migrasi mandiri skema database jika belum ada kolomnya
  await ensureUserSettingsSchema();

  // Ambil preferensi pengguna dari database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      showBudgeting: true,
      showLoans: true,
      showKost: true,
    },
  }) || { name: session.user.name, showBudgeting: true, showLoans: true, showKost: true };

  const data = await getDashboardData();

  if ('error' in data) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg max-w-sm text-center">
          <p className="text-rose-400 font-mono text-sm">Error: {data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <Sidebar 
        userName={user.name || 'User'} 
        showBudgeting={user.showBudgeting}
        showLoans={user.showLoans}
        showKost={user.showKost}
      />

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="text-left">
              <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest block font-bold">WM Command Center</span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Halo, {user.name || 'User'}!
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mt-3 sm:mt-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800">
              <Calendar size={14} className="text-indigo-400" />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* HIGHLIGHT CARDS (Total Saldo, Pemasukan, Pengeluaran, SDA) */}
          <HighlightCards
            totalBalance={data.totalBalance}
            totalIncome={data.totalIncome}
            totalExpense={data.totalExpense}
            sda={data.sda}
          />

          {/* CHARTS (Daily Flux & Pie Allocation) */}
          {user.showBudgeting && (
            <Charts
              dailyFlux={data.dailyFlux}
              allocation={data.allocation}
            />
          )}

          {/* GRID LAYOUT FOR WIDGETS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT / CENTER WIDGET COLUMN (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Wallet Manager (Override, 2-step destruction timer) */}
              <WalletManager wallets={data.wallets} />

              {/* Recent Transactions Log */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Riwayat Mutasi Terkini</h3>
                  <span className="text-[10px] font-mono text-slate-400">10 Transaksi Terakhir</span>
                </div>

                {data.recentTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada aktivitas transaksi.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {data.recentTransactions.map((tx) => (
                      <div key={tx.id} className="py-3 flex items-center justify-between text-left">
                        <div className="flex items-center space-x-3 truncate">
                          <div className={`p-1.5 rounded-full ${
                            tx.type === 'INCOME' 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : tx.type === 'EXPENSE'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            {tx.type === 'INCOME' ? (
                              <ArrowUpRight size={14} />
                            ) : tx.type === 'EXPENSE' ? (
                              <ArrowDownRight size={14} />
                            ) : (
                              <RefreshCw size={12} />
                            )}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{tx.description || tx.category}</span>
                            <span className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                              <span className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[9px] font-bold text-slate-500">
                                {tx.category}
                              </span>
                              <span>•</span>
                              <span>{tx.wallet.name}</span>
                              {tx.toWallet && <span>→ {tx.toWallet.name}</span>}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end flex-shrink-0 ml-3">
                          <span className={`text-xs font-extrabold font-mono ${
                            tx.type === 'INCOME' 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : tx.type === 'EXPENSE'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                            {formatRupiah(tx.amount)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT WIDGET COLUMN (1 Col) */}
            <div className="space-y-6">
              {/* Upcoming Bills Widget (H-3 alerts) */}
              {user.showLoans && <UpcomingBills bills={data.upcomingBills} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
