'use client';

import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DailyFluxItem {
  day: string;
  Pemasukan: number;
  Pengeluaran: number;
}

interface ChartsProps {
  dailyFlux: DailyFluxItem[];
  allocation: {
    savings: number;
    emergency: number;
    pocket: number;
  };
}

export default function Charts({ dailyFlux, allocation }: ChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm h-80 flex items-center justify-center text-slate-400">
          Memuat Grafik Arus Kas...
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm h-80 flex items-center justify-center text-slate-400">
          Memuat Diagram Lingkaran Alokasi...
        </div>
      </div>
    );
  }

  // Persiapan data untuk Pie Chart
  const pieData = [
    { name: 'Tabungan', value: allocation.savings, color: '#4f46e5' }, // Indigo
    { name: 'Dana Darurat', value: allocation.emergency, color: '#10b981' }, // Emerald
    { name: 'Jajan', value: allocation.pocket, color: '#f59e0b' }, // Amber
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. DAILY FLUX AREA CHART */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Grafik Arus Kas Harian (Daily Flux)</h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800/80">Tanggal 1 - 31</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyFlux} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickFormatter={(value) => `${value} Jt`} // Format y-axis ke "Jt" sesuai spesifikasi
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px'
                }}
                formatter={(value: any) => [`Rp${(Number(value) * 1000000).toLocaleString('id-ID')}`]}
                labelFormatter={(label) => `Tanggal ${label}`}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Area 
                type="monotone" 
                name="Pemasukan"
                dataKey="Pemasukan" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorIncome)" 
              />
              <Area 
                type="monotone" 
                name="Pengeluaran"
                dataKey="Pengeluaran" 
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorExpense)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. ALLOCATION PIE CHART */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bagan Alokasi Saldo</h3>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-100/30">Total 100%</span>
        </div>
        <div className="h-44 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px'
                }}
                formatter={(value: any) => [`${value}%`]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center">
            <span className="text-xs text-slate-400 block font-mono">AKTIF</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">3 Kategori</span>
          </div>
        </div>

        {/* Legend Custom */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {pieData.map((item) => (
            <div key={item.name} className="flex flex-col items-center p-2 rounded bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-slate-500 font-medium truncate">{item.name}</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
