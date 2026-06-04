'use client';

import { useState, useEffect, useTransition } from 'react';
import { Award, ShieldAlert, Sparkles, RefreshCw, Send, Loader2 } from 'lucide-react';
import { getModeAnakKostData, sweepSurplus } from '@/app/actions/finance';
import { formatRupiah } from './HighlightCards';
import { useThemeLanguage } from './ThemeLanguageContext';

interface WalletItem {
  id: string;
  name: string;
  balance: number;
}

interface ModeAnakKostProps {
  wallets: WalletItem[];
}

export default function ModeAnakKost({ wallets }: ModeAnakKostProps) {
  const { t, lang } = useThemeLanguage();
  const [sourceWalletId, setSourceWalletId] = useState(wallets[0]?.id || '');
  const [targetWalletId, setTargetWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!sourceWalletId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getModeAnakKostData(sourceWalletId);
      if (data.error) {
        setError(data.error);
      } else {
        setStats(data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat statistik Mode Anak Kost.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [sourceWalletId]);

  const handleSweep = () => {
    if (!stats || stats.rewardOrPenaltyValue <= 0 || stats.isPenalty) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await sweepSurplus({
        sourceWalletId,
        targetWalletId,
        amount: stats.rewardOrPenaltyValue,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || 'Surplus berhasil dialihkan!');
        fetchStats();
        setTimeout(() => setSuccess(null), 2000);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-left">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Award size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{t('survivalGauge')}</h3>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition p-1"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded text-xs mb-3">{error}</div>}
      {success && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded text-xs mb-3 animate-status-pulse">{success}</div>}

      {/* DROPDOWN CONFIGURATIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-[10px] font-mono text-slate-450 dark:text-slate-400 mb-1 uppercase">{t('selectKostWallet')}</label>
          <select
            value={sourceWalletId}
            onChange={(e) => setSourceWalletId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (Rp{w.balance.toLocaleString('id-ID')})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-slate-450 dark:text-slate-400 mb-1 uppercase">{t('selectTargetWallet')}</label>
          <select
            value={targetWalletId}
            onChange={(e) => setTargetWalletId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !stats ? (
        <div className="text-center py-8 text-slate-400 text-xs font-mono">
          {lang === 'id' ? 'Menganalisis data pengeluaran dan kalender...' : 'Analyzing spending and calendar data...'}
        </div>
      ) : stats ? (
        <div className="space-y-5">
          {/* Main Survival Gauge */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex flex-col justify-between relative overflow-hidden">
            {stats.isPenalty ? (
              <div className="absolute top-2 right-2 flex items-center space-x-1 text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-status-pulse">
                <ShieldAlert size={10} />
                <span>Penalty Active</span>
              </div>
            ) : (
              <div className="absolute top-2 right-2 flex items-center space-x-1 text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                <Sparkles size={10} />
                <span>Reward Active</span>
              </div>
            )}

            <span className="text-[10px] font-mono text-slate-500 uppercase block">{t('kostDailyQuota')}</span>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 font-mono">
              {formatRupiah(stats.dailyLimit)}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {t('daysRemaining')}: <strong className="text-indigo-600 dark:text-indigo-450">{stats.daysRemaining}</strong> {t('daysUnit')}
            </p>
          </div>

          {/* Details stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-slate-550 dark:text-slate-500 block font-mono text-[9px] uppercase">{t('baseDailyLimit')}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5 block font-mono">{formatRupiah(stats.baseLimit)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-slate-550 dark:text-slate-500 block font-mono text-[9px] uppercase">{t('expectedSavings')}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5 block font-mono">{formatRupiah(stats.requiredAmount)}</span>
            </div>
          </div>

          {/* Sweep/Rollover Panel */}
          {stats.rewardOrPenaltyValue > 0 && !stats.isPenalty && (
            <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono block">
                  {lang === 'id' ? 'SURPLUS DANA TERDETEKSI' : 'SURPLUS FUNDS DETECTED'}
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-350 mt-0.5">
                  {t('savingMsg').replace('{amount}', formatRupiah(stats.rewardOrPenaltyValue))}
                </p>
              </div>
              <button
                onClick={handleSweep}
                disabled={isPending}
                className="flex items-center space-x-1 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg transition duration-200"
              >
                {isPending ? <Loader2 className="animate-spin mr-1" size={12} /> : <Send size={12} />}
                <span>Sweep</span>
              </button>
            </div>
          )}

          {stats.isPenalty && (
            <div className="p-3 border border-rose-500/20 bg-rose-500/5 rounded-lg text-left">
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider font-mono block">
                {t('overspendingDetected')}
              </span>
              <p className="text-[11px] text-slate-650 dark:text-slate-300 mt-0.5 leading-relaxed">
                {t('overspendingMsg').replace('{amount}', formatRupiah(stats.rewardOrPenaltyValue))}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400 text-xs">
          {lang === 'id' ? 'Silakan pilih dompet untuk memuat analitik.' : 'Please select a wallet to load analytics.'}
        </div>
      )}
    </div>
  );
}
