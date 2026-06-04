'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, X, Trash2, Edit, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { createWallet, updateWallet, deleteWallet } from '@/app/actions/finance';
import { formatRupiah } from './HighlightCards';
import { useThemeLanguage } from './ThemeLanguageContext';

interface WalletItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  description: string | null;
}

interface WalletManagerProps {
  wallets: WalletItem[];
}

export default function WalletManager({ wallets }: WalletManagerProps) {
  const { t } = useThemeLanguage();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletItem | null>(null);
  
  // States untuk 2-Step Destruction Guardrail
  const [isDeleteStep1Open, setIsDeleteStep1Open] = useState(false);
  const [isDeleteStep2Open, setIsDeleteStep2Open] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  // States untuk Form
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('0');
  const [description, setDescription] = useState('');
  
  // States untuk Edit (Manual Override)
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('0');

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountdownActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setIsCountdownActive(false);
    }
    return () => clearTimeout(timer);
  }, [isCountdownActive, countdown]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name) {
      setError(t('wErrorNameRequired'));
      return;
    }

    startTransition(async () => {
      const result = await createWallet({
        name,
        type,
        balance: parseFloat(balance) || 0,
        description,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || t('wSuccessCreated'));
        setName('');
        setBalance('0');
        setDescription('');
        setTimeout(() => {
          setIsAddOpen(false);
          setSuccess(null);
        }, 1500);
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedWallet) return;

    startTransition(async () => {
      const result = await updateWallet(selectedWallet.id, {
        name: editName,
        balance: parseFloat(editBalance) || 0,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || t('wSuccessUpdated'));
        setTimeout(() => {
          setSelectedWallet(null);
          setSuccess(null);
        }, 1500);
      }
    });
  };

  const triggerDeleteStep1 = () => {
    // Tutup modal edit dahulu, lalu buka step 1
    setIsDeleteStep1Open(true);
    setCountdown(10);
    setIsCountdownActive(true);
  };

  const proceedToDeleteStep2 = () => {
    setIsDeleteStep1Open(false);
    setIsDeleteStep2Open(true);
  };

  const executeDelete = () => {
    if (!selectedWallet) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteWallet(selectedWallet.id);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success || t('wSuccessDeleted'));
        setIsDeleteStep2Open(false);
        setSelectedWallet(null);
        setTimeout(() => setSuccess(null), 1500);
      }
    });
  };

  const openEditModal = (wallet: WalletItem) => {
    setSelectedWallet(wallet);
    setEditName(wallet.name);
    setEditBalance(wallet.balance.toString());
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('wManageTitle')}</h3>
        <button
          id="btn-trigger-add-wallet"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center space-x-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded transition duration-200"
        >
          <Plus size={14} />
          <span>{t('wAddWalletBtn')}</span>
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          {t('wEmpty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              onClick={() => openEditModal(wallet)}
              className="p-4 border border-slate-150 dark:border-slate-700/60 hover:border-indigo-500/40 rounded-lg cursor-pointer bg-slate-50/50 dark:bg-slate-900/10 hover:bg-indigo-50/10 transition duration-200 text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{wallet.name}</span>
                  <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-500">
                    {wallet.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">{wallet.description || '-'}</p>
              </div>
              <div className="mt-4">
                <span className="text-[10px] text-slate-400 block font-mono">{t('wCurrentBalance')}</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatRupiah(wallet.balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. MODAL TAMBAH DOMPET */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
            <h3 className="text-base font-bold text-white mb-4">{t('wAddModalTitle')}</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {error && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs">{error}</div>}
              {success && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs animate-status-pulse">{success}</div>}

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">{t('wNameLabel')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder={t('wNamePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">{t('wTypeLabel')}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="BANK">{t('wTypeBank')}</option>
                    <option value="CASH">{t('wTypeCash')}</option>
                    <option value="EWALLET">{t('wTypeEwallet')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">{t('wInitialBalance')}</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">{t('wDescLabel')}</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder={t('wDescPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2 text-sm font-semibold transition duration-200 flex items-center justify-center space-x-1"
              >
                {isPending && <Loader2 className="animate-spin mr-1" size={14} />}
                <span>{t('wSaveBtn')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL DETAIL & MANUAL OVERRIDE */}
      {selectedWallet && !isDeleteStep1Open && !isDeleteStep2Open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={() => setSelectedWallet(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">{t('wDetailTitle')}: {selectedWallet.name}</h3>
              <button
                type="button"
                onClick={triggerDeleteStep1}
                className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded transition duration-200 flex items-center space-x-1 text-xs"
              >
                <Trash2 size={14} />
                <span>{t('wDeleteBtn')}</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {error && <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs">{error}</div>}
              {success && <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-xs animate-status-pulse">{success}</div>}

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  {t('wEditNameLabel')} <span className="text-[10px] text-amber-500 font-bold">{t('wManualOverride')}</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  {t('wEditBalanceLabel')} <span className="text-[10px] text-amber-500 font-bold">{t('wManualOverride')}</span>
                </label>
                <input
                  type="number"
                  required
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {t('wEditBalanceNote')}
                </p>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2 text-sm font-semibold transition duration-200 flex items-center justify-center"
              >
                {isPending && <Loader2 className="animate-spin mr-1" size={14} />}
                <span>{t('wSaveChanges')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. POP-UP DESTRUCTION STEP 1 (Countdown Timer) */}
      {isDeleteStep1Open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-500/20 p-6 rounded-lg w-full max-w-sm shadow-2xl relative text-left">
            <div className="flex items-center space-x-2 text-rose-500 mb-3">
              <AlertCircle size={20} />
              <h4 className="text-sm font-bold uppercase tracking-wider font-mono">{t('wDeleteWarningTitle')}</h4>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('wDeleteWarningMsg')} <strong>{selectedWallet?.name}</strong>{t('wDeleteWarningMsg2')}
            </p>

            <div className="mt-5 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteStep1Open(false);
                  setIsCountdownActive(false);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded py-2 transition duration-200 font-medium"
              >
                {t('wCancelBtn')}
              </button>
              <button
                type="button"
                disabled={countdown > 0}
                onClick={proceedToDeleteStep2}
                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950/40 text-white text-xs rounded py-2 transition duration-200 font-bold disabled:text-rose-700/60"
              >
                {countdown > 0 ? `${t('wProceedBtn')} (${countdown}s)` : t('wProceedBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. POP-UP DESTRUCTION STEP 2 (Final Warning) */}
      {isDeleteStep2Open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-rose-600 p-6 rounded-lg w-full max-w-sm shadow-2xl text-left">
            <div className="flex items-center space-x-2 text-rose-600 mb-3">
              <ShieldAlert size={22} className="animate-status-pulse" />
              <h4 className="text-sm font-bold uppercase tracking-wider font-mono">{t('wFinalTitle')}</h4>
            </div>

            <p className="text-xs text-rose-400 font-bold border border-rose-500/20 bg-rose-500/5 p-3 rounded">
              {t('wFinalWarning')}
            </p>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              {t('wFinalDesc')}
            </p>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteStep2Open(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded py-2 transition duration-200 font-medium"
              >
                {t('wCancelBtn')}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={executeDelete}
                className="flex-1 bg-rose-700 hover:bg-rose-600 text-white text-xs rounded py-2 transition duration-200 font-bold flex items-center justify-center"
              >
                {isPending && <Loader2 className="animate-spin mr-1" size={12} />}
                <span>{t('wDeleteConfirmBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
