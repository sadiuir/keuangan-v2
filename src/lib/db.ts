import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL || '';

// Deteksi runtime Next.js
// Di server lokal (Node.js), process.env.NEXT_RUNTIME bernilai undefined/node.
// Di Cloudflare Edge Workers, process.env.NEXT_RUNTIME bernilai 'edge'.
const isEdge = process.env.NEXT_RUNTIME === 'edge';

let prismaClient: PrismaClient;

if (!isEdge) {
  // 1. RUNTIME LOKAL / NODE.JS (Development): gunakan koneksi TCP relasional standar.
  // Ini memungkinkan koneksi ke Localhost PostgreSQL, Docker Postgres, atau cloud DB apa pun tanpa WebSocket.
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
    });
  }
  prismaClient = globalForPrisma.prisma;
} else {
  // 2. RUNTIME EDGE / CLOUDFLARE (Production): gunakan adapter Neon serverless via WebSockets.
  // Menjaga agar tidak ada connection exhaustion akibat scale-to-zero di Edge Workers.
  neonConfig.webSocketConstructor = globalThis.WebSocket;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  prismaClient = new PrismaClient({ adapter });
}

export const prisma = prismaClient;
