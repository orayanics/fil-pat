import { configurePrismaForElectron } from './client-electron';
import { join } from 'path';

// CRITICAL: Configure Prisma BEFORE importing PrismaClient
configurePrismaForElectron();

import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Determine database path based on environment
const getDatabasePath = () => {
  const isElectron = process.versions && process.versions.electron;
  
  if (process.env.NODE_ENV === 'production' && isElectron) {
    // In production Electron runtime, store database in app data directory
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { app } = require('electron');
      const userData = app.getPath('userData');
      return join(userData, 'filpat.db');
    } catch (err) {
      // Fallback if electron not available
      console.warn('Failed to get Electron app path, using fallback', err);
      return join(process.cwd(), 'prisma', 'filpat.db');
    }
  }
  // In development or Next.js build, use project root
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