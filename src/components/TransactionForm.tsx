'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, HelpCircle, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Pencil, Trash2, X, Check, Settings2 } from 'lucide-react';
import { createTransaction } from '@/app/actions/finance';
import { useThemeLanguage } from './ThemeLanguageContext';

interface QuickTemplate {
  label: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  description: string;
  amount: number;
}

const DEFAULT_TEMPLATES: QuickTemplate[] = [
  { label: '☕ Kopi Sore', type: 'EXPENSE', category: 'Makan', description: 'Kopi & camilan sore', amount: 25000 },
  { label: '🍲 Makan Siang', type: 'EXPENSE', category: 'Makan', description: 'Makan siang', amount: 35000 },
  { label: '🛒 Belanja Bulanan', type: 'EXPENSE', category: 'Belanja', description: 'Belanja bulanan', amount: 300000 },
  { label: '🚗 Bensin', type: 'EXPENSE', category: 'Transportasi', description: 'Bensin kendaraan', amount: 50000 },
  { label: '💰 Gaji Bulanan', type: 'INCOME', category: 'Gaji', description: 'Transfer gaji bulanan', amount: 5000000 },
];

const TEMPLATES_STORAGE_KEY = 'wm_quick_templates';

interface WalletItem {
  id: string;
  name: string;
  balance: number;
}

export interface RecentTransactionItem {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  description: string | null;
  timestamp: Date;
  wallet: {
    name: string;
  };
}

interface TransactionFormProps {
  wallets: WalletItem[];
  initialTransactions?: RecentTransactionItem[];
}

// 1. UTILITAS EVALUASI INLINE CALCULATOR
export function evaluateExpression(expr: string): number {
  // Hapus semua titik pemisah ribuan, ganti koma menjadi titik desimal
  let clean = expr.replace(/\./g, '').replace(/,/g, '.');
  // Filter hanya mengizinkan angka dan operator matematika dasar
  clean = clean.replace(/[^0-9+\-*/().]/g, '');
  if (!clean) return 0;
  try {
    const result = new Function(`return (${clean})`)();
    return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

// 2. UTILITAS FORMAT RIBUAN DENGAN TITIK
export function formatThousand(valStr: string): string {
  // Jika mengandung operator matematika, jangan format real-time agar rumusnya kelihatan
  if (/[+\-*/()]/g.test(valStr)) {
    return valStr;
  }
  const clean = valStr.replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(clean));
}

export default function TransactionForm({ wallets, initialTransactions }: TransactionFormProps) {
  const { t, lang } = useThemeLanguage();
  const [amountInput, setAmountInput] = useState('');
  const [evalResult, setEvalResult] = useState<number | null>(null);
  
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [category, setCategory] = useState('Makan');
  const [description, setDescription] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [isNeed, setIsNeed] = useState(false);
  
  const [recentTx, setRecentTx] = useState<RecentTransactionItem[]>(initialTransactions || []);

  // State untuk templat kustom (persisten di localStorage)
  const [templates, setTemplates] = useState<QuickTemplate[]>(DEFAULT_TEMPLATES);
  const [isManageMode, setIsManageMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftType, setDraftType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [draftCategory, setDraftCategory] = useState('Makan');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftAmountInput, setDraftAmountInput] = useState('');

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Muat templat dari localStorage saat mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as QuickTemplate[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed);
        }
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, []);

  // Simpan templat ke localStorage saat berubah
  const saveTemplates = (newTemplates: QuickTemplate[]) => {
    setTemplates(newTemplates);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  };

  // Live calculator evaluator
  useEffect(() => {
    if (/[+\-*/()]/g.test(amountInput)) {
      const result = evaluateExpression(amountInput);
      setEvalResult(result > 0 ? result : null);
    } else {
      setEvalResult(null);
    }
  }, [amountInput]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    
    // Format ribuan otomatis jika hanya angka biasa
    if (!/[+\-*/()]/g.test(inputVal)) {
      // Izinkan angka saja
      const cleaned = inputVal.replace(/[^0-9]/g, '');
      setAmountInput(formatThousand(cleaned));
    } else {
      setAmountInput(inputVal);
    }
  };

  const handleBlur = () => {
    // Pada blur, jika ada ekspresi matematika, langsung ubah input menjadi hasil akhirnya
    if (evalResult !== null && evalResult > 0) {
      setAmountInput(formatThousand(evalResult.toString()));
      setEvalResult(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Ambil nominal akhir yang sudah dievaluasi
    const finalAmount = evaluateExpression(amountInput);

    if (finalAmount <= 0) {
      setError('Nominal transaksi harus lebih besar dari Rp0.');
      return;
    }

    if (!walletId) {
      setError('Dompet asal wajib dipilih.');
      return;
    }

    startTransition(async () => {
      const result = await createTransaction({
        amount: finalAmount,
        type,
        category,
        description,
        walletId,
        toWalletId: type === 'TRANSFER' ? toWalletId : null,
        isNeed,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || 'Transaksi berhasil disimpan.');
        setAmountInput('');
        setDescription('');
        
        const selectedWallet = wallets.find(w => w.id === walletId);
        const newTx: RecentTransactionItem = {
          id: Math.random().toString(),
          amount: finalAmount,
          type,
          category,
          description: description || null,
          timestamp: new Date(),
          wallet: {
            name: selectedWallet?.name || 'Dompet'
          }
        };
        setRecentTx(prev => [newTx, ...prev.slice(0, 4)]);

        setTimeout(() => setSuccess(null), 1500);
      }
    });
  };

  // Kategori default berdasarkan tipe transaksi
  const getCategories = () => {
    if (type === 'INCOME') {
      return ['Gaji', 'Bonus', 'Investasi', 'Saldo Awal', 'Hibah', 'Lainnya'];
    } else if (type === 'EXPENSE') {
      return ['Makan', 'Transportasi', 'Belanja', 'Kebutuhan Wajib', 'Hiburan', 'Kesehatan', 'Cicilan', 'Lainnya'];
    }
    return ['Transfer Internal'];
  };

  // Sesuaikan kategori otomatis jika tipe berubah
  useEffect(() => {
    const cats = getCategories();
    setCategory(cats[0]);
    if (type === 'TRANSFER') {
      setCategory('Transfer');
    }
  }, [type]);

  const handleApplyTemplate = (tpl: QuickTemplate) => {
    setType(tpl.type);
    setCategory(tpl.category);
    setDescription(tpl.description);
    setAmountInput(formatThousand(tpl.amount.toString()));
  };

  const openAddForm = () => {
    setDraftLabel('');
    setDraftType('EXPENSE');
    setDraftCategory('Makan');
    setDraftDescription('');
    setDraftAmountInput('');
    setEditingIndex(null);
    setShowAddForm(true);
  };

  const openEditForm = (idx: number) => {
    const tpl = templates[idx];
    setDraftLabel(tpl.label);
    setDraftType(tpl.type === 'TRANSFER' ? 'EXPENSE' : tpl.type);
    setDraftCategory(tpl.category);
    setDraftDescription(tpl.description);
    setDraftAmountInput(formatThousand(tpl.amount.toString()));
    setEditingIndex(idx);
    setShowAddForm(true);
  };

  const handleSaveDraft = () => {
    const amount = parseInt(draftAmountInput.replace(/\./g, '').replace(/,/g, '')) || 0;
    if (!draftLabel.trim() || amount <= 0) return;
    const newTpl: QuickTemplate = {
      label: draftLabel.trim(),
      type: draftType,
      category: draftCategory,
      description: draftDescription,
      amount,
    };
    if (editingIndex !== null) {
      const updated = [...templates];
      updated[editingIndex] = newTpl;
      saveTemplates(updated);
    } else {
      saveTemplates([...templates, newTpl]);
    }
    setShowAddForm(false);
    setEditingIndex(null);
  };

  const handleDeleteTemplate = (idx: number) => {
    const updated = templates.filter((_, i) => i !== idx);
    saveTemplates(updated);
  };

  const handleResetTemplates = () => {
    saveTemplates(DEFAULT_TEMPLATES);
  };

  const EXPENSE_CATEGORIES = ['Makan', 'Transportasi', 'Belanja', 'Kebutuhan Wajib', 'Hiburan', 'Kesehatan', 'Cicilan', 'Lainnya'];
  const INCOME_CATEGORIES = ['Gaji', 'Bonus', 'Investasi', 'Saldo Awal', 'Hibah', 'Lainnya'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* KOLOM KIRI: FORM CATAT TRANSAKSI */}
      <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-left">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('catatBaru')}</h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
            ACID Transaction
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded text-xs">{error}</div>}
          {success && <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded text-xs animate-status-pulse">{success}</div>}

          {/* TIPE TRANSAKSI TOGGLE BUTTONS */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 px-3 rounded text-xs font-bold transition duration-200 flex items-center justify-center space-x-1 border ${
                type === 'EXPENSE'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
              }`}
            >
              <ArrowDownRight size={14} />
              <span>{t('typeExpense')}</span>
            </button>
            
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 px-3 rounded text-xs font-bold transition duration-200 flex items-center justify-center space-x-1 border ${
                type === 'INCOME'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
              }`}
            >
              <ArrowUpRight size={14} />
              <span>{t('typeIncome')}</span>
            </button>

            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={`py-2 px-3 rounded text-xs font-bold transition duration-200 flex items-center justify-center space-x-1 border ${
                type === 'TRANSFER'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
              }`}
            >
              <RefreshCw size={12} />
              <span>{t('typeTransfer')}</span>
            </button>
          </div>

          {/* NOMINAL FIELD (WITH INLINE CALCULATOR AND THOUSAND DOTS FORMATTER) */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase flex items-center justify-between">
              <span>{t('labelAmount')}</span>
              {evalResult !== null && (
                <span className="text-emerald-500 font-bold font-mono">
                  {lang === 'id' ? 'Hasil' : 'Result'}: Rp{evalResult.toLocaleString('id-ID')}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={amountInput}
                onChange={handleAmountChange}
                onBlur={handleBlur}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-650"
                placeholder={t('placeholderAmount')}
              />
              <div className="absolute right-3 top-2.5 text-slate-400 cursor-help" title={lang === 'id' ? "Mendukung kalkulator inline dasar (+, -, *, /) tanpa spasi." : "Supports basic inline calculator (+, -, *, /) without spaces."}>
                <HelpCircle size={14} />
              </div>
            </div>
          </div>

          {/* DOMPET PENGIRIM & PENERIMA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-450 mb-1 uppercase">
                {type === 'TRANSFER' ? t('labelWallet') + ' (' + (lang === 'id' ? 'Asal' : 'Source') + ')' : t('labelWallet')}
              </label>
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

            {type === 'TRANSFER' && (
              <div>
                <label className="block text-[10px] font-mono text-slate-450 mb-1 uppercase">{t('labelToWallet')}</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Rp{w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type !== 'TRANSFER' && (
              <div>
                <label className="block text-[10px] font-mono text-slate-450 mb-1 uppercase">{t('labelCategory')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  {getCategories().map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* DESKRIPSI & CHECKBOX KEBUTUHAN */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-slate-450 mb-1 uppercase">{t('labelDescription')}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder={t('placeholderDescription')}
              />
            </div>

            {type === 'EXPENSE' && (
              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="is-need"
                  checked={isNeed}
                  onChange={(e) => setIsNeed(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-800 rounded focus:ring-indigo-500 bg-slate-50 dark:bg-slate-950"
                />
                <label htmlFor="is-need" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                  {t('labelIsNeed')}
                </label>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2.5 text-sm font-semibold transition duration-200 flex items-center justify-center space-x-1 shadow-md shadow-indigo-600/10"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-1" size={14} />
                <span>{t('loading')}</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>{t('btnSubmitTransaction')}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* KOLOM KANAN: TEMPLAT CEPAT & RIWAYAT TRANSAKSI TERAKHIR */}
      <div className="md:col-span-1 space-y-6">
        {/* TEMPLAT TRANSAKSI CEPAT */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
              {lang === 'id' ? 'Templat Cepat' : 'Quick Templates'}
            </h4>
            <button
              type="button"
              onClick={() => { setIsManageMode(!isManageMode); setShowAddForm(false); }}
              className={`text-[10px] flex items-center space-x-1 px-2 py-1 rounded transition duration-200 font-mono font-bold ${
                isManageMode
                  ? 'bg-indigo-600/10 text-indigo-500 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              {isManageMode ? <X size={11} /> : <Settings2 size={11} />}
              <span>{isManageMode ? (lang === 'id' ? 'Selesai' : 'Done') : (lang === 'id' ? 'Kelola' : 'Manage')}</span>
            </button>
          </div>

          {/* FORM TAMBAH / EDIT TEMPLAT */}
          {showAddForm && (
            <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
              <p className="text-[10px] font-bold font-mono text-indigo-500 uppercase">
                {editingIndex !== null ? (lang === 'id' ? 'Edit Templat' : 'Edit Template') : (lang === 'id' ? 'Tambah Templat Baru' : 'Add New Template')}
              </p>
              <input
                type="text"
                value={draftLabel}
                onChange={(e) => setDraftLabel(e.target.value)}
                placeholder={lang === 'id' ? '🔖 Label (mis: 🍕 Pizza Malam)' : '🔖 Label (e.g. 🍕 Pizza Night)'}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={draftType}
                  onChange={(e) => { setDraftType(e.target.value as 'INCOME' | 'EXPENSE'); setDraftCategory(e.target.value === 'INCOME' ? 'Gaji' : 'Makan'); }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="EXPENSE">{lang === 'id' ? 'Pengeluaran' : 'Expense'}</option>
                  <option value="INCOME">{lang === 'id' ? 'Pemasukan' : 'Income'}</option>
                </select>
                <select
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  {(draftType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder={lang === 'id' ? 'Keterangan (opsional)' : 'Description (optional)'}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <input
                type="text"
                value={draftAmountInput}
                onChange={(e) => { const c = e.target.value.replace(/[^0-9]/g, ''); setDraftAmountInput(c ? new Intl.NumberFormat('id-ID').format(parseInt(c)) : ''); }}
                placeholder={lang === 'id' ? 'Nominal (Rp)' : 'Amount (Rp)'}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex-1 flex items-center justify-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 rounded transition"
                >
                  <Check size={11} />
                  <span>{lang === 'id' ? 'Simpan' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setEditingIndex(null); }}
                  className="flex items-center justify-center px-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded transition"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          )}

          {/* DAFTAR TOMBOL TEMPLAT */}
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl, i) => (
              <div key={i} className="flex items-center group">
                {isManageMode ? (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="text-[11px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-l-lg px-2.5 py-1.5 transition text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {tpl.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditForm(i)}
                      className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-500 px-1.5 py-1.5 transition"
                      title={lang === 'id' ? 'Edit' : 'Edit'}
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(i)}
                      className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 px-1.5 py-1.5 rounded-r-lg transition"
                      title={lang === 'id' ? 'Hapus' : 'Delete'}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="text-[11px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 transition text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {tpl.label}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* TOMBOL AKSI MODE KELOLA */}
          {isManageMode && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={openAddForm}
                className="flex-1 flex items-center justify-center space-x-1 text-[11px] border border-dashed border-indigo-500/40 text-indigo-500 hover:bg-indigo-500/5 rounded-lg py-1.5 transition font-bold"
              >
                <Plus size={11} />
                <span>{lang === 'id' ? 'Tambah Templat' : 'Add Template'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetTemplates}
                className="text-[11px] text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 transition"
                title={lang === 'id' ? 'Reset ke bawaan' : 'Reset to defaults'}
              >
                {lang === 'id' ? 'Reset' : 'Reset'}
              </button>
            </div>
          )}
        </div>

        {/* RIWAYAT 5 TRANSAKSI TERAKHIR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-left">
          <h4 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase font-mono tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
            {lang === 'id' ? '5 Transaksi Terakhir' : 'Recent 5 Transactions'}
          </h4>
          {recentTx.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center font-mono">
              {lang === 'id' ? 'Belum ada transaksi.' : 'No transactions recorded.'}
            </p>
          ) : (
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-950 pb-2 last:border-none last:pb-0">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {tx.category}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                      {tx.description || tx.wallet.name}
                    </span>
                  </div>
                  <span className={`font-bold font-mono ${
                    tx.type === 'INCOME' 
                      ? 'text-emerald-500' 
                      : tx.type === 'EXPENSE' 
                      ? 'text-rose-500' 
                      : 'text-indigo-500'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                    Rp{tx.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
