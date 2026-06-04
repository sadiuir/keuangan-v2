import { Wallet, ArrowDownRight, ArrowUpRight, Lock } from 'lucide-react';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

interface HighlightCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  sda: number;
}

export default function HighlightCards({
  totalBalance,
  totalIncome,
  totalExpense,
  sda,
}: HighlightCardsProps) {
  const cards = [
    {
      title: 'TOTAL SALDO GLOBAL',
      value: formatRupiah(totalBalance),
      icon: Wallet,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/20',
      description: 'Total akumulasi seluruh dompet berjalan',
    },
    {
      title: 'PEMASUKAN BULAN INI',
      value: formatRupiah(totalIncome),
      icon: ArrowUpRight,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/20',
      description: 'Total arus kas masuk periode ini',
    },
    {
      title: 'PENGELUARAN BULAN INI',
      value: formatRupiah(totalExpense),
      icon: ArrowDownRight,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/20',
      description: 'Total belanja dan kewajiban terbayar',
    },
    {
      title: 'SISA DANA ALOKASI (SDA)',
      value: formatRupiah(sda),
      icon: Lock,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/20',
      description: 'Dana bersih bebas belanja (saldo - plafon aktif)',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm hover:shadow-md transition duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded border ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {card.value}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
