'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '@/app/actions/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }

    startTransition(async () => {
      try {
        const result = await loginUser({ email, password });
        if (result?.error) {
          setError(result.error);
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      } catch (err: any) {
        // Next.js redirect melemparkan error yang memicu navigasi, abaikan jika tidak ada pesan
        if (err.message && !err.message.includes('NEXT_REDIRECT')) {
          setError('Terjadi kesalahan sistem saat masuk.');
        }
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Back button to Landing Page */}
      <Link
        id="btn-back-to-landing"
        href="/"
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center space-x-1.5 text-sm transition duration-200"
      >
        <ArrowLeft size={16} />
        <span>Kembali ke Beranda</span>
      </Link>

      <div className="w-full max-w-md space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl relative z-10">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded bg-indigo-600 items-center justify-center font-bold text-white tracking-wider text-xl mb-4 shadow-lg shadow-indigo-600/20">
            WM
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Masuk ke Akun Anda</h2>
          <p className="mt-2 text-sm text-slate-400">
            Masukkan kredensial finansial Anda untuk melanjutkan
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div id="login-error-alert" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs text-left">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Alamat Email */}
            <div>
              <label htmlFor="email-address" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 text-left">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 bg-slate-950 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition duration-200"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Kata Sandi (dengan tombol mata) */}
            <div>
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 text-left">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-800 bg-slate-950 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  id="btn-toggle-login-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition duration-200"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-md shadow-indigo-600/10"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Belum memiliki akun?{' '}
            <Link id="link-goto-register" href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition duration-200">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
