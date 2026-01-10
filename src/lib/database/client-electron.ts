import { join } from 'path';

/**
 * Configure Prisma for Electron BEFORE importing PrismaClient
 * This must happen before the @prisma/client import
 */
export const configurePrismaForElectron = () => {
  const isElectron = !!(process.versions && process.versions.electron);
  // Child Node processes spawned by Electron (eg. Next.js/Prisma server) inherit
  // the electron version flag but don't have process.type or the electron module
  // available. Bail out early in that environment to avoid noisy require errors.
  const electronProcess = process as NodeJS.Process & { type?: string };
  const hasElectronContext = typeof electronProcess.type === 'string';

  if (!isElectron || !hasElectronContext) {
    return; // Not running inside an Electron main/renderer context
  }

  if (process.env.NODE_ENV === 'production') {
    try {
      // In packaged Electron app, get resourcesPath from electron
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { app } = require('electron');

      const prismaEngines: Record<string, string> = {
        win32: 'query_engine-windows.dll.node',
        darwin: 'libquery_engine-darwin.dylib.node',
        linux: 'libquery_engine-linux.so.node',
      };
      const engineFilename = prismaEngines[process.platform];

      if (!engineFilename) {
        console.warn(`[Prisma] No query engine mapping for platform: ${process.platform}`);
        return;
      }

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
        engineFilename
      );
      
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
      
      console.log('[Prisma] Configured query engine path:', queryEnginePath);
    } catch (err) {
      console.error('[Prisma] Failed to configure Electron paths:', err);
    }
  }
};
