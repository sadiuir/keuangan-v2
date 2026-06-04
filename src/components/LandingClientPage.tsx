'use client';

import Link from 'next/link';
import { useThemeLanguage } from '@/components/ThemeLanguageContext';
import { 
  ArrowRight, 
  Cpu, 
  Layers, 
  DollarSign, 
  PieChart, 
  ShieldAlert, 
  Award,
  Sun,
  Moon,
  Globe,
  TrendingUp,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';

interface LandingClientPageProps {
  session: any;
}

export default function LandingClientPage({ session }: LandingClientPageProps) {
  const { theme, toggleTheme, lang, setLang, t } = useThemeLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* NAVBAR */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-black text-white tracking-wider text-sm shadow-md shadow-indigo-500/20">
              WM
            </div>
            <span className="font-extrabold text-lg tracking-wider text-slate-900 dark:text-white uppercase">
              {t('appName')}
            </span>
          </div>

          <nav className="flex items-center space-x-4">
            {/* Lang Switcher Pills */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setLang('id')}
                className={`px-2 py-1 rounded-md font-bold transition duration-200 ${
                  lang === 'id' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md font-bold transition duration-200 ${
                  lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-200 bg-slate-100 dark:bg-slate-900"
              title={theme === 'dark' ? 'Theme Terang' : 'Theme Gelap'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {session ? (
              <Link
                id="btn-goto-dashboard"
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition duration-200 text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/10"
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <Link
                  id="link-nav-login"
                  href="/login"
                  className="text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition duration-200"
                >
                  {lang === 'id' ? 'Masuk' : 'Sign In'}
                </Link>
                <Link
                  id="btn-nav-register"
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition duration-200 text-xs shadow-md shadow-indigo-600/10"
                >
                  {lang === 'id' ? 'Daftar' : 'Sign Up'}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/60 transition-colors duration-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="sm:text-center lg:text-left lg:col-span-7">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">
                {lang === 'id' ? 'Administrasi Aset Presisi' : 'Precision Asset Administration'}
              </span>
              <h1 className="mt-4 text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl text-slate-900 dark:text-white leading-none">
                {t('heroTitle')}
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('heroSubtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Link
                  id="btn-hero-cta"
                  href={session ? "/dashboard" : "/login"}
                  className="flex items-center justify-center px-6 py-3 border border-transparent text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 transition duration-200 shadow-lg shadow-indigo-600/10"
                >
                  <span>{t('heroCtaStart')}</span>
                  <ArrowRight className="ml-2" size={15} />
                </Link>
                <a
                  href="#capabilities"
                  className="flex items-center justify-center px-6 py-3 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 bg-white/50 dark:bg-slate-950/20 transition duration-200"
                >
                  {t('heroCtaLearn')}
                </a>
              </div>
            </div>
            
            {/* Right Mockup Panel */}
            <div className="mt-12 lg:mt-0 lg:col-span-5">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/20 transition duration-500" />
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t('livePreview')}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                    {t('activeSystem')}
                  </span>
                </div>

                <div className="mt-5 space-y-5 text-left">
                  {/* Mock Wallet */}
                  <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-indigo-950/30 dark:to-slate-900 border border-slate-200 dark:border-indigo-500/10 rounded-xl p-4 relative overflow-hidden shadow-inner">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-mono text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-bold">
                          {t('mainWallet')}
                        </p>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mt-1 font-mono">
                          Rp 12.450.000
                        </h3>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        BANK
                      </span>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>**** **** 9045</span>
                      <span>M. A. H. Musadi</span>
                    </div>
                  </div>

                  {/* Micro stats indicators */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-100/40 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
                      <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase block font-bold">
                        {t('savingsAlloc')}
                      </span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">30%</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>
                    
                    <div className="bg-slate-100/40 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
                      <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase block font-bold">
                        {t('healthIndex')}
                      </span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">92%</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Activity lists */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                      {t('lastActivities')}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-slate-100/30 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/50 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 text-[10px] font-bold">
                            +
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-700 dark:text-slate-200 truncate text-[11px]">{t('incomeReceived')}</p>
                            <p className="text-[8px] text-slate-400 font-mono">{t('monthlySalary')}</p>
                          </div>
                        </div>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">+15.000.000</span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-100/30 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/50 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0 text-[10px] font-bold">
                            -
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-700 dark:text-slate-200 truncate text-[11px]">{t('billPaid')}</p>
                            <p className="text-[8px] text-slate-400 font-mono">{t('autoDebetInstallment')}</p>
                          </div>
                        </div>
                        <span className="font-mono text-rose-600 dark:text-rose-400 font-bold text-[11px]">-2.550.000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTITUTIONAL CAPABILITIES */}
      <section id="capabilities" className="py-16 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('capabilitiesTitle')}
            </h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {t('capabilitiesSubtitle')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cap 1 */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-4">
                  <PieChart size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('cap1Title')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  {t('cap1Desc')}
                </p>
                
                {/* Visual Mini Slider Widget Mockup */}
                <div className="mt-5 space-y-3 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800 font-mono text-[10px]">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Savings (S1)</span>
                      <span>30%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Emergency (S2)</span>
                      <span>30%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Spending (S3)</span>
                      <span>40%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cap 2 */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-4">
                  <Percent size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('cap2Title')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  {t('cap2Desc')}
                </p>

                {/* Visual Loan Stack Comparison Mockup */}
                <div className="mt-5 space-y-2.5 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-650 dark:text-slate-300">Anuitas</span>
                    <span className="text-indigo-500 font-mono">Cicilan Tetap</span>
                  </div>
                  <div className="flex h-3 rounded overflow-hidden">
                    <div className="bg-indigo-650 dark:bg-indigo-600" style={{ width: '65%' }} title="Pokok" />
                    <div className="bg-indigo-400/50 dark:bg-indigo-500/30" style={{ width: '35%' }} title="Bunga" />
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono">
                    <span className="flex items-center"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-1 inline-block" />Pokok</span>
                    <span className="flex items-center"><span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full mr-1 inline-block" />Bunga</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cap 3 */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition duration-300">
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-4">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('cap3Title')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  {t('cap3Desc')}
                </p>

                {/* Visual EWS Alerts Mockup */}
                <div className="mt-5 space-y-2 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono px-2 py-1 rounded">
                    <span>Tagihan H-3 Jatuh Tempo</span>
                    <span className="font-extrabold">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono px-2 py-1 rounded">
                    <span>Kost Daily: Rp75.000</span>
                    <span className="font-extrabold">Safe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* SECURITY COMPLIANCE SUMMARY */}
      <section className="py-16 bg-white dark:bg-slate-950 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center space-x-2 text-indigo-650 dark:text-indigo-400 mb-4">
                <Lock size={20} />
                <span className="font-extrabold text-xs uppercase tracking-widest font-mono">Security Infrastructure</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t('techTitle')}
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('techDesc')}
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:col-span-5 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shadow-xl shadow-indigo-600/10">
                <ShieldAlert size={32} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-mono transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {t('appName')}. {t('footerRights')}</p>
          <div className="flex space-x-4 text-[10px] font-bold text-slate-500">
            <a href="#" className="hover:text-indigo-500 transition">{t('footerPrivacy')}</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-500 transition">{t('footerTerms')}</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-500 transition">{t('footerContact')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
