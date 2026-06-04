import { AlertTriangle, Calendar, Bell } from 'lucide-react';
import { formatRupiah } from './HighlightCards';

interface BillItem {
  id: string;
  name: string;
  monthlyPayment: number;
  nextDueDate: Date;
}

interface UpcomingBillsProps {
  bills: BillItem[];
}

export default function UpcomingBills({ bills }: UpcomingBillsProps) {
  const getDaysRemaining = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Bell size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tagihan Jatuh Tempo (H-3)</h3>
        </div>
        {bills.length > 0 && (
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-status-pulse">
            EWS Terdeteksi
          </span>
        )}
      </div>

      {bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
          <div className="w-10 h-10 rounded bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-3">
            <Calendar size={18} className="text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-xs">Aman! Tidak ada tagihan jatuh tempo dalam H-3.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const daysRemaining = getDaysRemaining(bill.nextDueDate);
            const isCritical = daysRemaining <= 1;
            
            return (
              <div 
                key={bill.id}
                className={`p-3.5 rounded-lg border flex items-center justify-between transition duration-200 ${
                  isCritical 
                    ? 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-950/10' 
                    : 'bg-amber-500/5 border-amber-500/20 dark:bg-amber-950/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded ${
                    isCritical 
                      ? 'bg-rose-500/10 text-rose-500' 
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{bill.name}</span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Calendar size={12} />
                      <span>{new Date(bill.nextDueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {formatRupiah(bill.monthlyPayment)}
                  </span>
                  <span className={`text-[10px] font-mono font-bold uppercase mt-0.5 px-2 py-0.5 rounded ${
                    isCritical 
                      ? 'bg-rose-500/10 text-rose-500' 
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {daysRemaining <= 0 ? 'Hari Ini' : `H-${daysRemaining}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
