import { join } from 'path';

/**
 * Configure Prisma for Electron BEFORE importing PrismaClient
 * This must happen before the @prisma/client import
 */
export const configurePrismaForElectron = () => {
  const isElectron = process.versions && process.versions.electron;
  
  if (!isElectron) {
    return; // Not in Electron, no configuration needed
  }

  if (process.env.NODE_ENV === 'production') {
    try {
      // In packaged Electron app, get resourcesPath from electron
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { app } = require('electron');
      // Get resources path - app.getAppPath() returns path to app.asar, we need parent directory
      const appPath = app.getAppPath();
      const resourcesPath = appPath.includes('app.asar') 
        ? appPath.replace('app.asar', '').replace(/[\\\/]$/, '')
        : appPath;
      
      // Set the query engine library path to the unpacked binary
      const queryEnginePath = join(
        resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        '.prisma',
        'client',
        'query_engine-windows.dll.node'
      );
      
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
      
      console.log('[Prisma] Configured query engine path:', queryEnginePath);
    } catch (err) {
      console.error('[Prisma] Failed to configure Electron paths:', err);
    }
  }
};
