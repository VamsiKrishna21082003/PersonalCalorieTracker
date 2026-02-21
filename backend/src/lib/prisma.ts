import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7: Use accelerateUrl for Prisma Accelerate connections
// For direct PostgreSQL connections (including Neon), use adapter
const isAccelerate = process.env.DATABASE_URL?.startsWith('prisma+');

let prismaConfig: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};

if (isAccelerate) {
  // Prisma Accelerate connection
  prismaConfig.accelerateUrl = process.env.DATABASE_URL;
} else {
  // Direct PostgreSQL connection (including Neon)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? {
      rejectUnauthorized: false
    } : undefined,
  });
  const adapter = new PrismaPg(pool);
  prismaConfig.adapter = adapter;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaConfig);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
