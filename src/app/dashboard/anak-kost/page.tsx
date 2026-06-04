import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar';
import ModeAnakKost from '@/components/ModeAnakKost';
import { prisma } from '@/lib/db';


export default async function AnakKostPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      showBudgeting: true,
      showLoans: true,
      showKost: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Ambil data dompet user
  const wallets = await prisma.wallet.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Sidebar 
        userName={user.name || 'User'} 
        showBudgeting={user.showBudgeting}
        showLoans={user.showLoans}
        showKost={user.showKost}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 text-left">
            <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest block font-bold">
              Wealth Manager
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Mode Anak Kost (Survival Gauge)
            </h1>
          </div>
          
          <ModeAnakKost wallets={wallets} />
        </div>
      </main>
    </div>
  );
}
