import { prisma } from './db';

/**
 * Memastikan kolom-kolom baru pada model User terbuat di database Neon.
 * Ini dijalankan secara aman via query SQL ALTER TABLE IF NOT EXISTS.
 * Menghindari kendala port 5432 lokal karena berjalan via adapter WebSocket (port 443).
 */
export async function ensureUserSettingsSchema() {
  try {
    // 1. autoDebetEnabled
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "autoDebetEnabled" BOOLEAN DEFAULT true;`
    );
    
    // 2. ewsEnabled
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ewsEnabled" BOOLEAN DEFAULT true;`
    );
    
    // 3. kostThreshold
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kostThreshold" DOUBLE PRECISION DEFAULT 10000;`
    );
    
    // 4. showBudgeting
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "showBudgeting" BOOLEAN DEFAULT true;`
    );
    
    // 5. showLoans
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "showLoans" BOOLEAN DEFAULT true;`
    );
    
    // 6. showKost
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "showKost" BOOLEAN DEFAULT true;`
    );

    // 7. currency
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'IDR';`
    );

    // 8. themePreference
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themePreference" TEXT DEFAULT 'dark';`
    );

    // 9. overspendingAlertEnabled
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "overspendingAlertEnabled" BOOLEAN DEFAULT true;`
    );
    
    console.log('Self-healing database migration completed successfully.');
  } catch (error) {
    console.error('Self-healing migration failed:', error);
  }
}
