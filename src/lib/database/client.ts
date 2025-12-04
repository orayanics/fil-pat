import { PrismaClient } from '@prisma/client';
import { join } from 'path';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Configure Prisma query engine for packaged Electron app
const isElectron = process.versions && process.versions.electron;
if (process.env.NODE_ENV === 'production' && isElectron && !process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    // Use type assertion for Electron's process.resourcesPath
    const resourcesPath = (process as any).resourcesPath || '';
    const queryEnginePath = path.join(
      resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      '.prisma',
      'client',
      'query_engine-windows.dll.node'
    );
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
    process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = 'library';
  } catch (err) {
    console.error('Failed to set Prisma engine path:', err);
  }
}

// Determine database path based on environment
const getDatabasePath = () => {
  // Check if running in Electron environment (not during Next.js build)
  
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