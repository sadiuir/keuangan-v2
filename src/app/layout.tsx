import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeLanguageProvider } from "@/components/ThemeLanguageContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "Wealth Manager - Kendali Arus Kas Proaktif",
  description: "Platform manajemen keuangan cerdas untuk mengontrol arus kas, alokasi anggaran slider cerdas, kalkulator cicilan amortisasi, dan otomatisasi auto-debet harian.",
  keywords: ["Wealth Manager", "Finance", "Budgeting", "Amortization", "Anak Kost", "Auto-Debet"],
  authors: [{ name: "Muhammad Abdullah Hasyim Musadi" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  const lang = localStorage.getItem('lang') || 'id';
                  document.documentElement.setAttribute('lang', lang);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200">
        <ThemeLanguageProvider>
          {children}
        </ThemeLanguageProvider>
      </body>
    </html>
  );
}
