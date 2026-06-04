import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar';
import { prisma } from '@/lib/db';
import { formatRupiah } from '@/components/HighlightCards';
import { Calendar, History, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';


export default async function TransactionsHistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch all transactions for the user
  const transactions = await prisma.transaction.findMany({
    where: {
      wallet: { userId: session.user.id }
    },
    orderBy: { timestamp: 'desc' },
    include: {
      wallet: { select: { name: true } },
      toWallet: { select: { name: true } }
    }
  });

  // Fetch user preferences
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      showBudgeting: true,
      showLoans: true,
      showKost: true,
    }
  }) || { name: session.user.name, showBudgeting: true, showLoans: true, showKost: true };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      <Sidebar 
        userName={user.name || 'User'} 
        showBudgeting={user.showBudgeting}
        showLoans={user.showLoans}
        showKost={user.showKost}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <History className="text-indigo-500" size={24} />
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Riwayat Transaksi Arus Kas
              </h1>
            </div>
            <span className="text-xs text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono">
              Total: {transactions.length} Mutasi
            </span>
          </div>

          {/* Transactions List */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Belum ada aktivitas transaksi yang dicatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Tanggal</th>
                      <th className="pb-3 font-semibold">Dompet</th>
                      <th className="pb-3 font-semibold">Kategori</th>
                      <th className="pb-3 font-semibold">Deskripsi</th>
                      <th className="pb-3 font-semibold text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition">
                        <td className="py-3.5 text-slate-500 flex items-center space-x-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </td>
                        <td className="py-3.5 font-bold text-slate-700 dark:text-slate-300">
                          {tx.wallet.name}
                          {tx.toWallet && <span className="text-slate-400 font-normal"> → {tx.toWallet.name}</span>}
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                            tx.type === 'INCOME'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : tx.type === 'EXPENSE'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-300 font-sans max-w-[200px] truncate">
                          {tx.description || '-'}
                        </td>
                        <td className={`py-3.5 text-right font-extrabold font-mono text-sm ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'EXPENSE'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        }`}>
                          <div className="flex items-center justify-end space-x-1">
                            <span>{tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}</span>
                            <span>{formatRupiah(tx.amount)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
