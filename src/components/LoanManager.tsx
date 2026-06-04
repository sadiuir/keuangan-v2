'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  ShieldCheck, 
  Loader2, 
  Coins, 
  TrendingUp, 
  Sparkles, 
  HelpCircle 
} from 'lucide-react';
import { createLoan } from '@/app/actions/finance';
import { calculateLoan, AmortizationSchedule } from '@/lib/finance';
import { formatRupiah } from './HighlightCards';

interface WalletItem {
  id: string;
  name: string;
  balance: number;
}

interface LoanItem {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  remainingTerm: number;
  interestType: string;
  status: string;
  nextDueDate: Date;
  monthlyPayment: number;
  remainingPrincipal: number;
  autoDebet: boolean;
  walletId: string;
}

interface LoanManagerProps {
  wallets: WalletItem[];
  loans: LoanItem[];
}

export default function LoanManager({ wallets, loans }: LoanManagerProps) {
  // States untuk Form input
  const [name, setName] = useState('');
  const [principalInput, setPrincipalInput] = useState('');
  const [interestRate, setInterestRate] = useState('12'); // default 12% per tahun
  const [termMonths, setTermMonths] = useState('12'); // default 12 bulan
  const [interestType, setInterestType] = useState<'FLAT' | 'EFEKTIF' | 'ANUITAS'>('ANUITAS');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [autoDebet, setAutoDebet] = useState(true);

  // States untuk Simulasi Live
  const [simResult, setSimResult] = useState<any>(null);
  const [showSimSchedule, setShowSimSchedule] = useState(false);
  const [calcTab, setCalcTab] = useState<'schedule' | 'booster'>('schedule');

  // States untuk Debt Payoff Booster (Pelunasan Dipercepat)
  const [selectedLoanId, setSelectedLoanId] = useState<string>('sim');
  const [extraPaymentInput, setExtraPaymentInput] = useState('500.000');
  const [extraPayment, setExtraPayment] = useState(500000);

  // States untuk Debt-to-Income (DTI)
  const [dtiIncomeInput, setDtiIncomeInput] = useState('10.000.000');
  const [dtiIncome, setDtiIncome] = useState(10000000);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Efek sinkronisasi input angka berformat rupiah
  useEffect(() => {
    const rawExtra = parseFloat(extraPaymentInput.replace(/\./g, '')) || 0;
    setExtraPayment(rawExtra);
  }, [extraPaymentInput]);

  useEffect(() => {
    const rawIncome = parseFloat(dtiIncomeInput.replace(/\./g, '')) || 0;
    setDtiIncome(rawIncome);
  }, [dtiIncomeInput]);

  // Live simulation trigger
  useEffect(() => {
    const p = parseFloat(principalInput.replace(/\./g, '')) || 0;
    const r = parseFloat(interestRate) || 0;
    const t = parseInt(termMonths) || 0;

    if (p > 0 && r >= 0 && t > 0) {
      const result = calculateLoan(p, r, t, interestType);
      setSimResult(result);
    } else {
      setSimResult(null);
    }
  }, [principalInput, interestRate, termMonths, interestType]);

  const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      setPrincipalInput('');
      return;
    }
    setPrincipalInput(new Intl.NumberFormat('id-ID').format(parseInt(val)));
  };

  const handleNumericInputChange = (val: string, setter: (v: string) => void) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      setter('');
      return;
    }
    setter(new Intl.NumberFormat('id-ID').format(parseInt(clean)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const p = parseFloat(principalInput.replace(/\./g, '')) || 0;

    if (p <= 0) {
      setError('Pokok pinjaman harus lebih besar dari Rp0.');
      return;
    }

    if (!walletId) {
      setError('Dompet pembayaran wajib dipilih.');
      return;
    }

    startTransition(async () => {
      const result = await createLoan({
        name,
        principal: p,
        interestRate: parseFloat(interestRate),
        termMonths: parseInt(termMonths),
        interestType,
        walletId,
        autoDebet,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || 'Kontrak cicilan berhasil didaftarkan.');
        setName('');
        setPrincipalInput('');
        setShowSimSchedule(false);
        setTimeout(() => setSuccess(null), 2000);
      }
    });
  };

  // --- 1. HITUNG SUMMARY LIABILITAS ---
  const totalPrincipal = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalRemainingPrincipal = loans.reduce((sum, l) => sum + l.remainingPrincipal, 0);
  const totalMonthlyPayment = loans.reduce((sum, l) => sum + l.monthlyPayment, 0);

  // Perhitungan DTI
  const dtiRatio = dtiIncome > 0 ? (totalMonthlyPayment / dtiIncome) * 100 : 0;
  let dtiStatus = 'Aman (Safe)';
  let dtiClass = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
  if (dtiRatio > 35 && dtiRatio <= 50) {
    dtiStatus = 'Siaga (Warning)';
    dtiClass = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
  } else if (dtiRatio > 50) {
    dtiStatus = 'Bahaya (Danger)';
    dtiClass = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
  }

  // --- 2. HITUNG AMORTISASI PAYOFF BOOSTER ---
  let targetLoan: {
    name: string;
    principal: number;
    interestRate: number;
    termMonths: number;
    remainingTerm: number;
    remainingPrincipal: number;
    monthlyPayment: number;
    interestType: string;
  } | null = null;

  if (selectedLoanId === 'sim' && simResult) {
    targetLoan = {
      name: name || 'Simulasi Kontrak',
      principal: parseFloat(principalInput.replace(/\./g, '')) || 0,
      interestRate: parseFloat(interestRate) || 0,
      termMonths: parseInt(termMonths) || 0,
      remainingTerm: parseInt(termMonths) || 0,
      remainingPrincipal: parseFloat(principalInput.replace(/\./g, '')) || 0,
      monthlyPayment: simResult.monthlyPayment,
      interestType: interestType,
    };
  } else {
    const act = loans.find(l => l.id === selectedLoanId);
    if (act) {
      targetLoan = {
        name: act.name,
        principal: act.principal,
        interestRate: act.interestRate,
        termMonths: act.termMonths,
        remainingTerm: act.remainingTerm,
        remainingPrincipal: act.remainingPrincipal,
        monthlyPayment: act.monthlyPayment,
        interestType: act.interestType,
      };
    }
  }

  let payoffSavingsMonths = 0;
  let payoffInterestSaved = 0;
  let payoffNewDuration = 0;

  if (targetLoan && targetLoan.remainingPrincipal > 0 && targetLoan.monthlyPayment > 0) {
    const p = targetLoan.principal;
    const r = targetLoan.interestRate;
    const remainingP = targetLoan.remainingPrincipal;
    const monthlyPaymentVal = targetLoan.monthlyPayment;
    const intType = targetLoan.interestType;
    const remainingT = targetLoan.remainingTerm;
    
    const monthlyInterestRate = (r / 12) / 100;

    // a. Simulasi Tanpa Ekstra
    let tempP_no = remainingP;
    let months_no = 0;
    let interestSum_no = 0;
    while (tempP_no > 0 && months_no < remainingT) {
      months_no++;
      let interest = 0;
      if (intType === 'FLAT') {
        interest = p * monthlyInterestRate;
      } else {
        interest = tempP_no * monthlyInterestRate;
      }
      let principalPaid = (monthlyPaymentVal - interest);
      if (principalPaid <= 0) break;
      if (principalPaid > tempP_no) principalPaid = tempP_no;
      tempP_no -= principalPaid;
      interestSum_no += interest;
    }

    // b. Simulasi Dengan Ekstra
    let tempP_with = remainingP;
    let months_with = 0;
    let interestSum_with = 0;
    while (tempP_with > 0 && months_with < remainingT) {
      months_with++;
      let interest = 0;
      if (intType === 'FLAT') {
        interest = p * monthlyInterestRate;
      } else {
        interest = tempP_with * monthlyInterestRate;
      }
      let principalPaid = (monthlyPaymentVal - interest) + extraPayment;
      if (principalPaid <= 0) break;
      if (principalPaid > tempP_with) principalPaid = tempP_with;
      tempP_with -= principalPaid;
      interestSum_with += interest;
    }

    payoffNewDuration = months_with;
    payoffSavingsMonths = Math.max(0, months_no - months_with);
    payoffInterestSaved = Math.max(0, interestSum_no - interestSum_with);
  }

  return (
    <div className="space-y-6">
      {/* 0. ANALISIS LIABILITAS & BEBAN UTANG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Total Outstanding Debt Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-indigo-500 font-bold text-xs uppercase tracking-wider font-mono mb-2">
            <Coins size={14} />
            <span>Total Sisa Pokok Hutang</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatRupiah(totalRemainingPrincipal)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Dari total pinjaman awal senilai {formatRupiah(totalPrincipal)}
          </p>
        </div>

        {/* Total Monthly Payment Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-indigo-500 font-bold text-xs uppercase tracking-wider font-mono mb-2">
            <Calendar size={14} />
            <span>Beban Cicilan Bulanan</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatRupiah(totalMonthlyPayment)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Akan didebet secara otomatis pada tanggal jatuh tempo jika Auto-Debet aktif
          </p>
        </div>

        {/* DTI Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-indigo-500 font-bold text-xs uppercase tracking-wider font-mono">
            <div className="flex items-center space-x-2">
              <TrendingUp size={14} />
              <span>Debt-to-Income (DTI) Ratio</span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${dtiClass}`}>
              {dtiStatus}
            </span>
          </div>
          
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {dtiRatio.toFixed(1)}%
          </div>

          <div className="space-y-1">
            <label className="block text-[8px] font-mono text-slate-400 uppercase">Simulasi Gaji Bulanan Anda (Rp)</label>
            <input
              type="text"
              value={dtiIncomeInput}
              onChange={(e) => handleNumericInputChange(e.target.value, setDtiIncomeInput)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[10px] text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* 1. LAYOUT GRID: INPUT & PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Form Input Kontrak */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <Sliders size={16} className="text-indigo-600 animate-pulse" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Daftarkan Cicilan Baru</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs">{error}</div>}
            {success && <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs animate-status-pulse">{success}</div>}

            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Nama Kontrak / Pinjaman</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder="Misal: KPR Rumah, Cicilan Laptop"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Pokok Pinjaman (Rupiah)</label>
                <input
                  type="text"
                  required
                  value={principalInput}
                  onChange={handlePrincipalChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="Misal: 10.000.000"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Suku Bunga Tahunan (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Tenor (Bulan)</label>
                <input
                  type="number"
                  required
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Metode Bunga</label>
                <select
                  value={interestType}
                  onChange={(e) => setInterestType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="ANUITAS">Bunga Anuitas (Standard)</option>
                  <option value="EFEKTIF">Bunga Efektif</option>
                  <option value="FLAT">Bunga Flat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Dompet Sumber Pembayaran</label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Rp{w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-5">
                <input
                  type="checkbox"
                  id="auto-debet-opt"
                  checked={autoDebet}
                  onChange={(e) => setAutoDebet(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-800 rounded focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900"
                />
                <label htmlFor="auto-debet-opt" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  Aktifkan Auto-Debet (00:01 WIB)
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2.5 text-sm font-semibold transition duration-200 flex items-center justify-center space-x-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-1" size={14} />
                  <span>Mendaftarkan Kontrak...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Daftarkan Kontrak Cicilan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Calculation Preview & Payoff Booster tabs */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Live Kalkulator Amortisasi</h3>
              </div>
              
              {/* Tab Toggles */}
              <div className="flex bg-slate-900 rounded p-0.5 font-mono text-[9px]">
                <button
                  onClick={() => setCalcTab('schedule')}
                  className={`px-2 py-1 rounded transition duration-200 ${
                    calcTab === 'schedule' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Jadwal Amortisasi
                </button>
                <button
                  onClick={() => setCalcTab('booster')}
                  className={`px-2 py-1 rounded transition duration-200 ${
                    calcTab === 'booster' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pelunasan Dipercepat
                </button>
              </div>
            </div>

            {/* TAB 1: AMORTIZATION SCHEDULE */}
            {calcTab === 'schedule' && (
              <div>
                {simResult ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900 p-4 rounded-lg text-center">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">ESTIMASI ANGSURAN BULANAN</span>
                      <span className="text-3xl font-extrabold text-white mt-1 block font-mono">
                        {formatRupiah(simResult.monthlyPayment)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="bg-slate-900 p-3 rounded">
                        <span className="text-slate-500 block text-[9px] uppercase">Total Bunga Dibayar</span>
                        <span className="font-semibold text-slate-200 mt-0.5 block">{formatRupiah(simResult.totalInterest)}</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded">
                        <span className="text-slate-500 block text-[9px] uppercase">Total Keseluruhan</span>
                        <span className="font-semibold text-slate-200 mt-0.5 block">{formatRupiah(simResult.totalPayment)}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowSimSchedule(!showSimSchedule)}
                        className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-white transition duration-200 font-mono"
                      >
                        <span>{showSimSchedule ? 'Sembunyikan' : 'Tampilkan'} Jadwal Angsuran Bulanan</span>
                        {showSimSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {showSimSchedule && (
                        <div className="mt-3 max-h-48 overflow-y-auto border border-slate-800 rounded bg-slate-950 text-[10px] font-mono divide-y divide-slate-800">
                          <div className="grid grid-cols-5 p-2 font-bold text-slate-500 bg-slate-900 sticky top-0">
                            <span>Bln</span>
                            <span className="col-span-2">Pokok</span>
                            <span>Bunga</span>
                            <span>Sisa Pokok</span>
                          </div>
                          {simResult.schedule.map((row: AmortizationSchedule) => (
                            <div key={row.month} className="grid grid-cols-5 p-2 text-slate-300">
                              <span>#{row.month}</span>
                              <span className="col-span-2">Rp{row.principalPaid.toLocaleString('id-ID')}</span>
                              <span>Rp{row.interestPaid.toLocaleString('id-ID')}</span>
                              <span>Rp{row.remainingPrincipal.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-450 text-xs text-center border border-dashed border-slate-800 rounded-lg">
                    Masukkan pokok, suku bunga, dan tenor di formulir sebelah kiri untuk melihat simulasi kalkulator amortisasi.
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PAYOFF BOOSTER SIMULATOR */}
            {calcTab === 'booster' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {/* Select Target Loan */}
                  <div>
                    <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">
                      Pilih Kontrak untuk Akselerasi
                    </label>
                    <select
                      value={selectedLoanId}
                      onChange={(e) => setSelectedLoanId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="sim">Simulasi Kontrak Baru (Form Kiri)</option>
                      {loans.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({formatRupiah(l.remainingPrincipal)} tersisa)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Extra Payment Input */}
                  <div>
                    <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">
                      Pembayaran Ekstra Bulanan (Rp)
                    </label>
                    <input
                      type="text"
                      value={extraPaymentInput}
                      onChange={(e) => handleNumericInputChange(e.target.value, setExtraPaymentInput)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {targetLoan && targetLoan.remainingPrincipal > 0 ? (
                  <div className="space-y-3 border-t border-slate-800 pt-3">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase block tracking-wider font-bold">Hasil Akselerasi</span>
                    
                    <div className="grid grid-cols-2 gap-3 text-left font-mono">
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase">Bunga yang Dihemat</span>
                        <strong className="text-emerald-400 text-sm mt-0.5 block">{formatRupiah(payoffInterestSaved)}</strong>
                      </div>
                      
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[9px] uppercase">Pangkas Waktu Tenor</span>
                        <strong className="text-indigo-400 text-sm mt-0.5 block">{payoffSavingsMonths} Bulan lebih awal</strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] font-sans leading-relaxed text-slate-300">
                      Dengan tambahan <strong>{formatRupiah(extraPayment)}/bulan</strong>, tenor kontrak <strong>{targetLoan.name}</strong> terpangkas dari {targetLoan.remainingTerm} bulan menjadi hanya <strong>{payoffNewDuration} bulan</strong> saja!
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-slate-450 text-xs text-center border border-dashed border-slate-800 rounded-lg">
                    Silakan masukkan pokok pinjaman simulasi di sebelah kiri atau pilih kontrak pinjaman aktif untuk memulai simulasi akselerasi.
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-4 uppercase">Wealth Manager Math Engine v2.1</span>
        </div>
      </div>

      {/* 2. DAFTAR KONTRAK CICILAN AKTIF */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-left">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <CreditCard size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Kontrak Pinjaman Aktif</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Total: {loans.length} Kontrak</span>
        </div>

        {loans.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada kontrak cicilan/pinjaman aktif saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="p-4 border border-slate-150 dark:border-slate-800/60 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{loan.name}</h4>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">
                      {loan.interestType}
                    </span>
                  </div>
                  {loan.autoDebet ? (
                    <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Auto-Debet Aktif
                    </span>
                  ) : (
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Manual Pay
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-[11px] text-slate-400">
                  <div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase">Angsuran Bulanan</span>
                    <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(loan.monthlyPayment)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase">Sisa Pokok Pinjaman</span>
                    <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(loan.remainingPrincipal)}</strong>
                  </div>
                </div>

                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Calendar size={12} className="text-indigo-500" />
                    <span>Jatuh Tempo: <strong>{new Date(loan.nextDueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</strong></span>
                  </span>
                  <span className="font-mono">
                    Tenor: <strong>{loan.remainingTerm}</strong> / {loan.termMonths} bln
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
