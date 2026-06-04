'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeLanguage } from './ThemeLanguageContext';
import { 
  LayoutDashboard, 
  History, 
  Sliders, 
  CreditCard, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  User,
  PlusCircle,
  Activity,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  userName: string;
  showBudgeting?: boolean;
  showLoans?: boolean;
  showKost?: boolean;
}

export default function Sidebar({ userName, showBudgeting = true, showLoans = true, showKost = true }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme, lang, setLang, t } = useThemeLanguage();

  // Dapatkan daftar menu secara dinamis sesuai per terjemahan dan preferensi aktif
  const menuItems = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('transactions'), href: '/dashboard/transactions', icon: History },
    { name: t('catatTransaksi'), href: '/dashboard/transactions/new', icon: PlusCircle },
    ...(showBudgeting ? [{ name: t('alokasiCerdas'), href: '/dashboard/allocation', icon: Sliders }] : []),
    ...(showLoans ? [{ name: t('manajemenCicilan'), href: '/dashboard/loans', icon: CreditCard }] : []),
    ...(showKost ? [{ name: t('modeAnakKost'), href: '/dashboard/anak-kost', icon: Activity }] : []),
    { name: t('pengaturan'), href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div 
      className={`bg-slate-950 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } h-screen sticky top-0 z-40`}
    >
      {/* HEADER SECTION (Minimalist Branding) */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="w-8 h-8 rounded bg-indigo-650 flex-shrink-0 flex items-center justify-center font-black text-white tracking-wider text-sm shadow-md shadow-indigo-500/20">
            WM
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider text-slate-100 uppercase">{t('appName')}</span>
              <span className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase">{t('appSubtitle')}</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition duration-205 focus:outline-none"
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* NAVIGATION MENU */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded transition duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/15' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-xs truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* KONTROL MULTI-BAHASA & TEMA (Light/Dark & ID/EN) */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between gap-1">
          {/* Theme Toggler Button */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white transition duration-200 flex items-center justify-center ${
              isCollapsed ? 'w-full' : 'flex-1'
            }`}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {!isCollapsed && <span className="text-[10px] ml-2 font-bold font-mono">Theme</span>}
          </button>

          {/* Language Switcher Button */}
          {!isCollapsed ? (
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 flex-1 font-mono text-[9px]">
              <button
                onClick={() => setLang('id')}
                className={`px-2 py-1 rounded flex-1 text-center font-bold transition duration-200 ${
                  lang === 'id' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded flex-1 text-center font-bold transition duration-200 ${
                  lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                EN
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white transition duration-200 flex items-center justify-center w-full"
              title="Ganti Bahasa (Switch Language)"
            >
              <Globe size={15} />
            </button>
          )}
        </div>
      </div>

      {/* USER PROFILE SECTION */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between overflow-hidden">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center text-indigo-400">
              <User size={18} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="font-semibold text-xs text-white truncate max-w-[130px]">{userName}</span>
                <span className="text-[9px] text-slate-500 font-mono tracking-tighter truncate max-w-[130px]">Musadi Network</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition duration-200 focus:outline-none"
              title={t('logout')}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
