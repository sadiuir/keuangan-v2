'use client';

import { useState, useTransition } from 'react';
import { useThemeLanguage } from '@/components/ThemeLanguageContext';
import { updateUserSettings, updateUserProfile } from '@/app/actions/settings';
import Sidebar from '@/components/Sidebar';
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Terminal, 
  Activity, 
  Calendar,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  HelpCircle
} from 'lucide-react';

interface SettingsFormProps {
  initialUser: {
    name: string;
    email: string;
    autoDebetEnabled: boolean;
    ewsEnabled: boolean;
    kostThreshold: number;
    showBudgeting: boolean;
    showLoans: boolean;
    showKost: boolean;
    currency: string;
    themePreference: string;
    overspendingAlertEnabled: boolean;
  };
}

export default function SettingsForm({ initialUser }: SettingsFormProps) {
  const { t, lang, setLang } = useThemeLanguage();
  const [isPending, startTransition] = useTransition();

  // State Pengaturan
  const [autoDebet, setAutoDebet] = useState(initialUser.autoDebetEnabled);
  const [ews, setEws] = useState(initialUser.ewsEnabled);
  const [kostThreshold, setKostThreshold] = useState(initialUser.kostThreshold);
  const [showBudgeting, setShowBudgeting] = useState(initialUser.showBudgeting);
  const [showLoans, setShowLoans] = useState(initialUser.showLoans);
  const [showKost, setShowKost] = useState(initialUser.showKost);
  const [currency, setCurrency] = useState(initialUser.currency);
  const [themePreference, setThemePreference] = useState(initialUser.themePreference);
  const [overspendingAlert, setOverspendingAlert] = useState(initialUser.overspendingAlertEnabled);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State Profil Baru
  const [profileName, setProfileName] = useState(initialUser.name);
  const [newPassword, setNewPassword] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateUserSettings({
        autoDebetEnabled: autoDebet,
        ewsEnabled: ews,
        kostThreshold: Number(kostThreshold),
        showBudgeting,
        showLoans,
        showKost,
        currency,
        themePreference,
        overspendingAlertEnabled: overspendingAlert,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(t('settingsSaved'));
        setTimeout(() => setSuccess(null), 2500);
      }
    });
  };

  const handleProfileSave = () => {
    setProfileError(null);
    setProfileSuccess(null);

    startProfileTransition(async () => {
      const result = await updateUserProfile({
        name: profileName,
        password: newPassword || undefined
      });

      if (result.error) {
        setProfileError(result.error);
      } else {
        setProfileSuccess(t('profileUpdated'));
        setNewPassword('');
        setTimeout(() => setProfileSuccess(null), 2500);
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      <Sidebar 
        userName={initialUser.name || 'User'} 
        showBudgeting={showBudgeting}
        showLoans={showLoans}
        showKost={showKost}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6 text-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <SettingsIcon className="text-indigo-500" size={24} />
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('systemSettings')}
              </h1>
            </div>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg font-bold shadow-md shadow-indigo-600/10 transition duration-200"
            >
              {isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span>{t('btnSaveSettings')}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs animate-status-pulse">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KIRI: Profil & Akun */}
            <div className="space-y-6">
              {/* Form Ubah Profil */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-indigo-500 font-bold text-xs uppercase tracking-wider font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
                  <UserIcon size={14} />
                  <span>{t('changeProfile')}</span>
                </div>
                
                {profileError && (
                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[11px]">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[11px] animate-status-pulse">
                    {profileSuccess}
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase mb-1">{t('email')}</span>
                    <input
                      type="text"
                      disabled
                      value={initialUser.email}
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-400 dark:text-slate-500 select-none focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block font-mono text-[9px] uppercase mb-1">{t('username')}</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-650 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block font-mono text-[9px] uppercase mb-1">{t('newPasswordLabel')}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('newPasswordPlaceholder')}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-650 focus:ring-indigo-600 placeholder:text-slate-400/70 placeholder:text-[10px]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleProfileSave}
                  disabled={isProfilePending}
                  className="w-full mt-2 flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded font-bold transition duration-200 text-xs shadow-md shadow-indigo-600/5"
                >
                  {isProfilePending ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                  <span>{t('btnUpdateProfile')}</span>
                </button>
              </div>
            </div>

            {/* KANAN: Form Layanan & Otomatisasi */}
            <div className="md:col-span-2 space-y-6">
              {/* Form Toggles */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
                <div className="flex items-center space-x-2 text-indigo-500 font-bold text-xs uppercase tracking-wider font-mono border-b border-slate-100 dark:border-slate-800 pb-3">
                  <SettingsIcon size={14} />
                  <span>{t('servicesSettings')}</span>
                </div>

                <div className="space-y-6">
                  {/* 1. Toggle Auto-Debet */}
                  <div className="flex items-start justify-between space-x-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('toggleAutoDebet')}
                      </label>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                        {t('toggleAutoDebetDesc')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoDebet(!autoDebet)}
                      className="text-slate-400 hover:text-indigo-500 transition duration-200"
                    >
                      {autoDebet ? (
                        <ToggleRight className="text-indigo-600 w-10 h-10" />
                      ) : (
                        <ToggleLeft className="text-slate-400 w-10 h-10" />
                      )}
                    </button>
                  </div>

                  {/* 2. Toggle EWS */}
                  <div className="flex items-start justify-between space-x-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('toggleEWS')}
                      </label>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                        {t('toggleEWSDesc')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEws(!ews)}
                      className="text-slate-400 hover:text-indigo-500 transition duration-200"
                    >
                      {ews ? (
                        <ToggleRight className="text-indigo-600 w-10 h-10" />
                      ) : (
                        <ToggleLeft className="text-slate-400 w-10 h-10" />
                      )}
                    </button>
                  </div>

                  {/* 3. Mata Uang & Tema Bawaan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('currencyLabel')}
                      </label>
                      <p className="text-[10px] text-slate-400">
                        {t('currencyDesc')}
                      </p>
                      <div className="relative">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        >
                          <option value="IDR">IDR (Rp)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="SGD">SGD (S$)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('themePreferenceLabel')}
                      </label>
                      <p className="text-[10px] text-slate-400">
                        {t('themePreferenceDesc')}
                      </p>
                      <div className="relative">
                        <select
                          value={themePreference}
                          onChange={(e) => setThemePreference(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        >
                          <option value="dark">{lang === 'id' ? 'Mode Gelap' : 'Dark Mode'}</option>
                          <option value="light">{lang === 'id' ? 'Mode Terang' : 'Light Mode'}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. Toggle Overspending Alert */}
                  <div className="flex items-start justify-between space-x-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('overspendingAlertLabel')}
                      </label>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                        {t('overspendingAlertDesc')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOverspendingAlert(!overspendingAlert)}
                      className="text-slate-400 hover:text-indigo-500 transition duration-200"
                    >
                      {overspendingAlert ? (
                        <ToggleRight className="text-indigo-600 w-10 h-10" />
                      ) : (
                        <ToggleLeft className="text-slate-400 w-10 h-10" />
                      )}
                    </button>
                  </div>

                  {/* 3. Threshold Kost */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>{t('kostThresholdLabel')}</span>
                      <span className="text-[10px] text-indigo-500 font-mono font-bold">
                        Rp{Number(kostThreshold).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={kostThreshold}
                        onChange={(e) => setKostThreshold(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                      <div className="absolute right-3 top-2.5 text-slate-400 cursor-help" title={t('kostThresholdDesc')}>
                        <HelpCircle size={14} />
                      </div>
                    </div>
                  </div>

                  {/* 4. Active Modules Selection */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('activeModules')}
                      </label>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t('activeModulesDesc')}
                      </p>
                    </div>

                    <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="mod-budgeting"
                          checked={showBudgeting}
                          onChange={(e) => setShowBudgeting(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-800 rounded focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900"
                        />
                        <label htmlFor="mod-budgeting" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                          {t('moduleBudgeting')}
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="mod-loans"
                          checked={showLoans}
                          onChange={(e) => setShowLoans(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-800 rounded focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900"
                        />
                        <label htmlFor="mod-loans" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                          {t('moduleLoans')}
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="mod-kost"
                          checked={showKost}
                          onChange={(e) => setShowKost(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-800 rounded focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900"
                        />
                        <label htmlFor="mod-kost" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                          {t('moduleKost')}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
