import { PrismaClient } from '@prisma/client';
import { join } from 'path';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Determine database path based on environment
const getDatabasePath = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production (Electron), store database in app data directory
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('electron');
    const userData = app.getPath('userData');
    return join(userData, 'filpat.db');
  }
  // In development, use project root
  return join(process.cwd(), 'prisma', 'filpat.db');
};

const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${getDatabasePath()}`
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Singleton pattern for Prisma client
export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});