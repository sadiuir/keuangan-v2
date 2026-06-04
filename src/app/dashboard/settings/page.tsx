import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { ensureUserSettingsSchema } from '@/lib/migrations';
import SettingsForm from './SettingsForm';

export const runtime = 'edge';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Pemicuan migrasi kolom basis data secara self-healing
  await ensureUserSettingsSchema();

  // Ambil data profil & preferensi pengguna dari database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      autoDebetEnabled: true,
      ewsEnabled: true,
      kostThreshold: true,
      showBudgeting: true,
      showLoans: true,
      showKost: true,
      currency: true,
      themePreference: true,
      overspendingAlertEnabled: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <SettingsForm 
      initialUser={{
        name: user.name || 'User',
        email: user.email,
        autoDebetEnabled: user.autoDebetEnabled,
        ewsEnabled: user.ewsEnabled,
        kostThreshold: user.kostThreshold,
        showBudgeting: user.showBudgeting,
        showLoans: user.showLoans,
        showKost: user.showKost,
        currency: user.currency || 'IDR',
        themePreference: user.themePreference || 'dark',
        overspendingAlertEnabled: user.overspendingAlertEnabled,
      }}
    />
  );
}
