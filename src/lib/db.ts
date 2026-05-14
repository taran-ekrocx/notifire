// src/lib/db.ts

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

export async function getDb() {
  try {
    await db.$connect();
    console.log('[db] ✅ PostgreSQL connected successfully');
    return db;
  } catch (error) {
    console.error('[db] Connection failed:', error);
    throw error;
  }
}