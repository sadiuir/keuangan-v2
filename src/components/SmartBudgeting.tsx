'use client';

import { useState, useTransition, useEffect } from 'react';
import { Sliders, Save, Loader2, Sparkles, Target, TrendingUp, DollarSign, Clock, Coins } from 'lucide-react';
import { balanceAllocation, BudgetAllocation } from '@/lib/finance';
import { updateAllocation } from '@/app/actions/finance';
import { useThemeLanguage } from './ThemeLanguageContext';

interface SmartBudgetingProps {
  initialAllocation: BudgetAllocation;
  totalBalance?: number;
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export default function SmartBudgeting({ initialAllocation, totalBalance = 0 }: SmartBudgetingProps) {
  const { t } = useThemeLanguage();
  const [allocation, setAllocation] = useState<BudgetAllocation>(() => ({
    savings: Math.round(initialAllocation.savings),
    emergency: Math.round(initialAllocation.emergency),
    pocket: Math.round(initialAllocation.pocket),
  }));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // States untuk fitur baru (kalkulator & target planner)
  const [simIncomeInput, setSimIncomeInput] = useState('10.000.000');
  const [simIncome, setSimIncome] = useState(10000000);
  const [savingsTargetInput, setSavingsTargetInput] = useState('50.000.000');
  const [savingsTarget, setSavingsTarget] = useState(50000000);

  // Efek sinkronisasi input angka berformat rupiah
  useEffect(() => {
    const rawIncome = parseFloat(simIncomeInput.replace(/\./g, '')) || 0;
    setSimIncome(rawIncome);
  }, [simIncomeInput]);

  useEffect(() => {
    const rawTarget = parseFloat(savingsTargetInput.replace(/\./g, '')) || 0;
    setSavingsTarget(rawTarget);
  }, [savingsTargetInput]);

  const handleNumericInputChange = (val: string, setter: (v: string) => void) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      setter('');
      return;
    }
    setter(new Intl.NumberFormat('id-ID').format(parseInt(clean)));
  };

  const handleSliderChange = (key: keyof BudgetAllocation, value: number) => {
    const balanced = balanceAllocation(allocation, key, value);
    setAllocation(balanced);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateAllocation({
        savingsPct: allocation.savings,
        emergencyPct: allocation.emergency,
        pocketPct: allocation.pocket,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || 'Preferensi alokasi disimpan.');
        setTimeout(() => setSuccess(null), 2000);
      }
    });
  };

  const handleTierApply = (tier: number) => {
    setError(null);
    setSuccess(null);
    if (tier === 1) {
      setAllocation({ savings: 10, emergency: 10, pocket: 80 });
    } else if (tier === 2) {
      setAllocation({ savings: 20, emergency: 20, pocket: 60 });
    } else if (tier === 3) {
      setAllocation({ savings: 35, emergency: 25, pocket: 40 });
    }
  };

  // Perhitungan Distribusi Pemasukan Simulasi
  const simSavings = Math.round(simIncome * (allocation.savings / 100));
  const simEmergency = Math.round(simIncome * (allocation.emergency / 100));
  const simPocket = Math.round(simIncome * (allocation.pocket / 100));

  // Perhitungan Goal Planner
  const monthlySavingsAmount = Math.round(simIncome * (allocation.savings / 100));
  const monthsNeeded = monthlySavingsAmount > 0 ? (savingsTarget / monthlySavingsAmount).toFixed(1) : '∞';
  
  // Rekomendasi akselerasi
  const potentialSavingsPct = Math.min(allocation.savings + 10, 80);
  const potentialMonthlySavings = Math.round(simIncome * (potentialSavingsPct / 100));
  const potentialMonthsNeeded = potentialMonthlySavings > 0 ? (savingsTarget / potentialMonthlySavings).toFixed(1) : '∞';

  return (
    <div className="space-y-6">
      {/* GRID UTAMA: SLIDER & DISTRIBUSI REALTIME */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* KARTU KIRI: SLIDERS & AI ADVISOR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sliders size={16} className="text-indigo-600 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Formula Proporsi (Smart Sliders)</h3>
              </div>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-2.5 py-1.5 rounded transition duration-200 shadow-md shadow-indigo-600/10"
              >
                {isPending ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                <span>{t('sbSaveAllocation')}</span>
              </button>
            </div>

            {error && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs mb-3">{error}</div>}
            {success && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs mb-3 animate-status-pulse">{success}</div>}

            <div className="space-y-5">
              {/* 1. Tabungan */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-medium">
                  <span className="text-indigo-600 dark:text-indigo-400">{t('sbSavings')}</span>
                  <span className="text-slate-700 dark:text-slate-200">{allocation.savings}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.savings}
                  onChange={(e) => handleSliderChange('savings', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* 2. Dana Darurat */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-medium">
                  <span className="text-emerald-600 dark:text-emerald-400">{t('sbEmergency')}</span>
                  <span className="text-slate-700 dark:text-slate-200">{allocation.emergency}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.emergency}
                  onChange={(e) => handleSliderChange('emergency', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* 3. Jajan */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono font-medium">
                  <span className="text-amber-500">{t('sbPocket')}</span>
                  <span className="text-slate-700 dark:text-slate-200">{allocation.pocket}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={allocation.pocket}
                  onChange={(e) => handleSliderChange('pocket', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>

            {/* 100% Lock indicator */}
            <div className="mt-4 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] text-slate-400 text-center font-mono">
              {t('sbBudgetLock')}: <span className="font-extrabold text-indigo-500">{t('sbBudgetLockVal')}</span>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
            <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase flex items-center space-x-1">
              <Sparkles size={12} className="text-indigo-400" />
              <span>{t('sbAiRecommendation')}</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleTierApply(1)}
                className="p-2 border border-slate-150 dark:border-slate-800 rounded text-[9px] text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-center transition duration-200"
              >
                <span className="block font-bold">Tier 1 (&lt;5Jt)</span>
                <span className="font-mono">10% / 10% / 80%</span>
              </button>
              <button
                onClick={() => handleTierApply(2)}
                className="p-2 border border-slate-150 dark:border-slate-800 rounded text-[9px] text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-center transition duration-200"
              >
                <span className="block font-bold">Tier 2 (5-15Jt)</span>
                <span className="font-mono">20% / 20% / 60%</span>
              </button>
              <button
                onClick={() => handleTierApply(3)}
                className="p-2 border border-slate-150 dark:border-slate-800 rounded text-[9px] text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-center transition duration-200"
              >
                <span className="block font-bold">Tier 3 (&gt;15Jt)</span>
                <span className="font-mono">35% / 25% / 40%</span>
              </button>
            </div>
          </div>
        </div>

        {/* KARTU KANAN: SIMULASI ALOKASI PEMASUKAN NYATA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <DollarSign size={16} className="text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('sbCalcTitle')}</h3>
            </div>

            <div className="space-y-4">
              {/* Input Pemasukan */}
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
                  {t('sbSimIncomeLabel')}
                </label>
                <input
                  type="text"
                  value={simIncomeInput}
                  onChange={(e) => handleNumericInputChange(e.target.value, setSimIncomeInput)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder={t('sbSimIncomePlaceholder')}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {t('sbCurrentBalance')}: <strong className="text-slate-700 dark:text-slate-350">{formatRupiah(totalBalance)}</strong>
                </p>
              </div>

              {/* Tampilan Visual Breakdown */}
              <div className="space-y-3 pt-2">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">{t('sbDistributionLabel')}</span>
                
                {/* Bar Tabungan */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">{t('sbSavingsLabel')} - {allocation.savings}%)</span>
                    <strong className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">{formatRupiah(simSavings)}</strong>
                  </div>
                  <Coins className="text-indigo-400" size={20} />
                </div>

                {/* Bar Dana Darurat */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">{t('sbEmergencyLabel')} - {allocation.emergency}%)</span>
                    <strong className="text-sm text-emerald-600 dark:text-emerald-400 font-mono">{formatRupiah(simEmergency)}</strong>
                  </div>
                  <Sparkles className="text-emerald-400" size={20} />
                </div>

                {/* Bar Jajan */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">{t('sbPocketLabel')} - {allocation.pocket}%)</span>
                    <strong className="text-sm text-amber-500 font-mono">{formatRupiah(simPocket)}</strong>
                  </div>
                  <Sliders className="text-amber-400" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KARTU BAWAH: GOAL PLANNER TARGET TABUNGAN IMPIAN */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-left">
        <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <Target size={16} className="text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('sbGoalTitle')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Target */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">{t('sbGoalTargetLabel')}</label>
              <input
                type="text"
                value={savingsTargetInput}
                onChange={(e) => handleNumericInputChange(e.target.value, setSavingsTargetInput)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder={t('sbGoalTargetPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">{t('sbGoalIncomeLabel')}</label>
              <input
                type="text"
                value={simIncomeInput}
                onChange={(e) => handleNumericInputChange(e.target.value, setSimIncomeInput)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Analisis Waktu Capaian */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">{t('sbGoalDuration')}</span>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{monthsNeeded}</span>
                <span className="text-xs text-slate-500 font-bold">{t('sbGoalMonths')}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {t('sbGoalDesc')} <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(monthlySavingsAmount)}{t('sbGoalDescPer')}</strong> ({allocation.savings}% {t('sbGoalDescFrom')}
              </p>
            </div>
            <div className="flex items-center space-x-1 text-[9px] text-indigo-400 mt-3 font-mono">
              <Clock size={12} />
              <span>{t('sbGoalRealtime')}</span>
            </div>
          </div>

          {/* Akselerator Cerdas */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-indigo-500 font-bold text-[10px] font-mono uppercase mb-2">
                <TrendingUp size={12} />
                <span>{t('sbAcceleratorTitle')}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {t('sbAcceleratorDesc')} <strong className="text-emerald-500 font-extrabold">+10%</strong> {t('sbAcceleratorDesc2')} {potentialSavingsPct}%), {t('sbAcceleratorDesc3')} <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(potentialMonthlySavings)}{t('sbGoalDescPer')}</strong>.
              </p>
              <div className="mt-3 p-2 bg-indigo-500/5 rounded border border-indigo-500/10 text-[10px] font-mono flex justify-between items-center">
                <span className="text-slate-400">{t('sbAcceleratorDuration')}</span>
                <span className="font-bold text-emerald-500">{potentialMonthsNeeded} {t('sbGoalMonths')}</span>
              </div>
            </div>
            <p className="text-[8px] text-slate-400 leading-tight mt-3">
              {t('sbAcceleratorNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
