import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDashboardData } from '@/app/actions/finance';
import Sidebar from '@/components/Sidebar';
import SmartBudgeting from '@/components/SmartBudgeting';
import { Sliders } from 'lucide-react';

export const runtime = 'edge';

export default async function AllocationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const data = await getDashboardData();

  if ('error' in data) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg text-rose-400">
          Error: {data.error}
        </div>
      </div>
    );
  }

  // Ambil preferensi pengguna dari database
  const { prisma } = await import('@/lib/db');
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      showBudgeting: true,
      showLoans: true,
      showKost: true,
    },
  }) || { name: session.user.name, showBudgeting: true, showLoans: true, showKost: true };

  if (!user.showBudgeting) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      <Sidebar 
        userName={user.name || 'User'} 
        showBudgeting={user.showBudgeting}
        showLoans={user.showLoans}
        showKost={user.showKost}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Sliders className="text-indigo-500" size={24} />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Alokasi Cerdas (Smart Budgeting)
            </h1>
          </div>
          <SmartBudgeting initialAllocation={data.allocation} totalBalance={data.totalBalance} />
        </div>
      </main>
    </div>
  );
}
