'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface UpdateSettingsInput {
  autoDebetEnabled: boolean;
  ewsEnabled: boolean;
  kostThreshold: number;
  showBudgeting: boolean;
  showLoans: boolean;
  showKost: boolean;
  currency: string;
  themePreference: string;
  overspendingAlertEnabled: boolean;
}

export async function updateUserSettings(input: UpdateSettingsInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        autoDebetEnabled: input.autoDebetEnabled,
        ewsEnabled: input.ewsEnabled,
        kostThreshold: input.kostThreshold,
        showBudgeting: input.showBudgeting,
        showLoans: input.showLoans,
        showKost: input.showKost,
        currency: input.currency,
        themePreference: input.themePreference,
        overspendingAlertEnabled: input.overspendingAlertEnabled,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');
    return { success: 'Pengaturan berhasil diperbarui.' };
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    return { error: error.message || 'Gagal memperbarui pengaturan.' };
  }
}

export interface UpdateProfileInput {
  name: string;
  password?: string;
}

export async function updateUserProfile(input: UpdateProfileInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    if (!input.name.trim()) {
      return { error: 'Nama tidak boleh kosong.' };
    }

    const dataToUpdate: any = {
      name: input.name,
    };

    if (input.password && input.password.trim() !== '') {
      if (input.password.length < 6) {
        return { error: 'Kata sandi baru minimal 6 karakter.' };
      }
      const { hashSync, genSaltSync } = require('bcrypt-ts');
      const salt = genSaltSync(10);
      dataToUpdate.password = hashSync(input.password, salt);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: dataToUpdate,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');
    return { success: 'Profil berhasil diperbarui.' };
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return { error: error.message || 'Gagal memperbarui profil.' };
  }
}
