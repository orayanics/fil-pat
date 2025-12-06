import { app, BrowserWindow, dialog, session } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess, exec } from 'child_process';
import * as os from 'os';
import { ipcMain } from 'electron';
import * as fs from 'fs';

// CRITICAL: Set Prisma paths BEFORE any imports that use Prisma
if (app.isPackaged) {
  const queryEnginePath = path.join(
    process.resourcesPath,
    'app',
    'node_modules',
    '.prisma',
    'client',
    'query_engine-windows.dll.node'
  );
  const schemaPath = path.join(
    process.resourcesPath,
    'app',
    'node_modules',
    '.prisma',
    'client',
    'schema.prisma'
  );
  
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
  process.env.PRISMA_SCHEMA_PATH = schemaPath;
  process.env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = '1';
  
  console.log('Prisma engine path:', queryEnginePath);
  console.log('Prisma schema path:', schemaPath);
}

// NOW import database functions after Prisma env vars are set
import { registerClinician, loginClinician } from './database';
import { initializeDatabase, ensureDatabaseDirectory } from './initDatabase';

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const isDev = !app.isPackaged;
const APP_PORT = 3000;
const WS_PORT = 8080;
const APP_USER_MODEL_ID = 'com.ust.filpat';
const PRODUCT_DISPLAY_NAME = 'Filipino Phonological Assessment Tool';

function resolveAssetPath(...segments: string[]): string {
  if (isDev) {
    return path.join(__dirname, '..', ...segments);
  }

  const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', ...segments);
  if (fs.existsSync(unpackedPath)) {
    return unpackedPath;
  }

  const appPath = app.getAppPath();
  const withinAsar = path.join(appPath, ...segments);
  if (fs.existsSync(withinAsar)) {
    return withinAsar;
  }

  return path.join(process.resourcesPath, ...segments);
}

const appIconPath = resolveAssetPath('assets', 'icons', 'icon.ico');

app.name = PRODUCT_DISPLAY_NAME;

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

function registerDownloadHandler() {
  app.whenReady().then(() => {
    const electronSession = session.defaultSession;
    if (!electronSession) {
      console.warn('[Download] No default session found; skipping download handler.');
      return;
    }

    electronSession.on('will-download', (event, item) => {
      const filename = item.getFilename();
      if (!filename.toLowerCase().endsWith('.pdf')) {
        return; // Let non-PDF downloads use default behavior
      }

      const downloadsPath = app.getPath('downloads');
      const targetPath = path.join(downloadsPath, filename);
      item.setSavePath(targetPath);

      console.log(`[Download] Saving ${filename} to ${targetPath}`);

      item.once('done', (_, state) => {
        if (state === 'completed') {
          console.log(`[Download] ${filename} saved successfully`);
        } else {
          console.warn(`[Download] ${filename} failed with state: ${state}`);
        }
      });
    });
  }).catch((err) => {
    console.warn('[Download] Failed to register handler:', err);
  });
}

registerDownloadHandler();

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let wsProcess: ChildProcess | null = null;

/**
 * Add Windows Firewall rules to allow incoming connections on ports 3000 and 8080
 * This enables other devices on the same WiFi network to access the patient dashboard
 * Rules are applied with 'private' and 'domain' profiles to work on home/office networks
 */
async function addFirewallRules(): Promise<void> {
  if (process.platform !== 'win32') {
    console.log('Firewall rules only needed on Windows');
    return;
  }

  const exePath = process.execPath;
  const appName = 'FIL-PAT';

  return new Promise((resolve) => {
    // Check if rules already exist
    exec(`netsh advfirewall firewall show rule name="${appName} - HTTP"`, (error) => {
      if (error) {
        // Rules don't exist, create them
        console.log('Adding Windows Firewall rules for network access...');
        
        const commands = [
          // Allow HTTP (Next.js) on port 3000 for private/domain networks
          `netsh advfirewall firewall add rule name="${appName} - HTTP" dir=in action=allow protocol=TCP localport=${APP_PORT} profile=private,domain enable=yes`,
          // Allow WebSocket on port 8080 for private/domain networks
          `netsh advfirewall firewall add rule name="${appName} - WebSocket" dir=in action=allow protocol=TCP localport=${WS_PORT} profile=private,domain enable=yes`,
          // Allow the executable itself for private/domain networks
          `netsh advfirewall firewall add rule name="${appName} - App" dir=in action=allow program="${exePath}" profile=private,domain enable=yes`,
        ];

        const addRules = spawn('powershell.exe', [
          '-Command',
          commands.join('; ')
        ], {
          shell: true,
          windowsHide: true,
        });

        addRules.on('close', (code) => {
          if (code === 0) {
            console.log('✓ Firewall rules added successfully');
            console.log('  Patient devices on same WiFi can now connect');
          } else {
            console.warn(`⚠ Firewall rules may not have been added (code ${code}). Manual setup may be needed.`);
            console.log('  You may need to run the app as Administrator to add firewall rules automatically.');
          }
          resolve();
        });

        addRules.on('error', (err) => {
          console.warn('⚠ Could not add firewall rules automatically:', err.message);
          console.log('Manual setup: Allow ports 3000 and 8080 in Windows Firewall for private networks');
          resolve();
        });
      } else {
        console.log('✓ Firewall rules already exist');
        resolve();
      }
    });
  });
}

/**
 * Remove firewall rules when app is uninstalled or closed
 */
function removeFirewallRules(): void {
  if (process.platform !== 'win32') return;

  const appName = 'FIL-PAT';
  const commands = [
    `netsh advfirewall firewall delete rule name="${appName} - HTTP"`,
    `netsh advfirewall firewall delete rule name="${appName} - WebSocket"`,
    `netsh advfirewall firewall delete rule name="${appName} - App"`,
  ];

  exec(commands.join(' & '), (error) => {
    if (error) {
      console.warn('Could not remove firewall rules:', error.message);
    } else {
      console.log('Firewall rules removed');
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);

  const localIp = getLocalIp();

  // Show connection info to user
  win.webContents.on('did-finish-load', () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                    FIL-PAT Server Ready                  ║
╠══════════════════════════════════════════════════════════╣
║  Clinician Interface: http://localhost:${APP_PORT}           ║
║  Local Network URL:   http://${localIp}:${APP_PORT}        ║
║  WebSocket Server:    ws://${localIp}:${WS_PORT}           ║
╠══════════════════════════════════════════════════════════╣
║  Patient devices on same WiFi can connect using:        ║
║  http://${localIp}:${APP_PORT}/session/patient/[ID]       ║
╚══════════════════════════════════════════════════════════╝
    `);
  });

  if (isDev) {
    win.loadURL(`http://localhost:${APP_PORT}`);
    win.webContents.openDevTools();
  } else {
    win.loadURL(`http://localhost:${APP_PORT}`);
  }

  mainWindow = win;
}

/**
 * Start the Next.js server in production mode
 */
function startProductionServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting Next.js server...');
    
    if (isDev) {
      // In dev mode, spawn as separate process
      const serverPath = path.join(__dirname, '..', 'server.ts');
      
      if (!fs.existsSync(serverPath)) {
        console.error('Server file not found at:', serverPath);
        reject(new Error('Server files not found. Please rebuild the application.'));
        return;
      }

      serverProcess = spawn('node', [serverPath], {
        env: process.env as NodeJS.ProcessEnv,
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
      });

      serverProcess.stdout?.on('data', (data) => {
        console.log(`[Server] ${data.toString()}`);
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error(`[Server Error] ${data.toString()}`);
      });

      serverProcess.on('error', (error) => {
        console.error('Failed to start server:', error);
        reject(error);
      });

      serverProcess.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
      });

      setTimeout(() => {
        console.log('✓ Server started');
        resolve();
      }, 3000);
    } else {
      // In production, run the compiled Next.js server that we copied to resources dir
      const { fork } = require('child_process');
      const packagedAppPath = app.getAppPath();
      const resourcesPath = process.resourcesPath;
      const unpackedPath = path.join(resourcesPath, 'app.asar.unpacked');
      const serverCandidates = [
        path.join(resourcesPath, 'dist', 'server.js'), // preferred: copied via extraResources
        path.join(unpackedPath, 'dist', 'server.js'),  // fallback when unpacked copy exists
        path.join(packagedAppPath, 'dist', 'server.js'), // fallback to asar
      ];
      const serverPath = serverCandidates.find((candidate) => fs.existsSync(candidate));
      const workingDir = resourcesPath;

      if (!serverPath) {
        console.error('Server bundle not found at expected locations:', serverCandidates);
        reject(new Error('Server bundle missing. Please reinstall the application.'));
        return;
      }

      const nodeModulePaths = [path.join(packagedAppPath, 'node_modules')];
      if (process.env.NODE_PATH) {
        nodeModulePaths.push(process.env.NODE_PATH);
      }

      const env = {
        ...process.env,
        NODE_ENV: 'production',
        APP_HOSTNAME: '0.0.0.0',
        APP_PORT: APP_PORT.toString(),
        WEBSOCKET_PORT: WS_PORT.toString(),
        WEBSOCKET_HOST: '0.0.0.0',
        NODE_PATH: nodeModulePaths.join(path.delimiter),
      };

      console.log('Server path:', serverPath);
      console.log('Working directory:', workingDir);

      try {
        serverProcess = fork(serverPath, [], {
          env: env as NodeJS.ProcessEnv,
          cwd: workingDir,
          stdio: 'pipe',
        });

        if (serverProcess) {
          serverProcess.stdout?.on('data', (data) => {
            console.log(`[Server] ${data.toString()}`);
          });

          serverProcess.stderr?.on('data', (data) => {
            console.error(`[Server Error] ${data.toString()}`);
          });

          serverProcess.on('error', (error) => {
            console.error('Failed to start server:', error);
            reject(error);
          });

          serverProcess.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
            if (code !== 0 && code !== null) {
              reject(new Error(`Server exited with code ${code}`));
            }
          });

          // Give server time to initialize
          setTimeout(() => {
            console.log('✓ Server started');
            resolve();
          }, 3000);
        } else {
          reject(new Error('Failed to fork server process'));
        }
      } catch (error) {
        console.error('Failed to fork server:', error);
        reject(error);
      }
    }
  });
}

/**
 * Start development servers (Next.js + WebSocket)
 */
function startDevServers(): Promise<void> {
  return new Promise((resolve) => {
    console.log('Starting development servers...');
    
    const fullstack = spawn('npm', ['run', 'fullstack:lan'], {
      shell: true,
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        APP_HOSTNAME: '0.0.0.0',
        WEBSOCKET_HOST: '0.0.0.0',
      },
    });

    fullstack.on('close', (code) => {
      console.log(`Dev servers exited with code ${code}`);
    });

    // Wait longer for dev servers to start
    setTimeout(() => {
      resolve();
    }, 8000);
  });
}

/**
 * Show initial setup dialog with connection information
 */
function showConnectionInfo() {
  const localIp = getLocalIp();
  
  dialog.showMessageBox(mainWindow!, {
    type: 'info',
    title: 'FIL-PAT Network Ready',
    message: 'Server is running and accessible on your network!',
    detail: `
Clinician Interface:
• This computer: http://localhost:${APP_PORT}
• On network: http://${localIp}:${APP_PORT}

Patient Connection:
Devices on the same WiFi can access patient dashboard using:
http://${localIp}:${APP_PORT}

Use the QR code feature in sessions for easy patient device connection.

🔐 Default Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin Account:
  Username: admin
  Password: admin123

Test Clinician Account:
  Username: clinician
  Password: clinician123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Note: Please change passwords after first login for security.

Firewall: Windows Firewall rules have been configured automatically.
    `,
    buttons: ['OK'],
  });
}

// Initialize app
app.whenReady().then(async () => {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('          FIL-PAT Starting Up (Electron)              ');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Step 1: Ensure database directory exists
    ensureDatabaseDirectory(isDev);

    // Step 2: Initialize database (auto-seed on fresh install)
    await initializeDatabase(isDev);

    // Step 3: Add firewall rules
    await addFirewallRules();

    // Step 4: Start appropriate servers
    if (isDev) {
      await startDevServers();
    } else {
      await startProductionServer();
    }

    // Step 5: Create main window
    createWindow();

    // Step 6: Show connection info after window loads
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        showConnectionInfo();
      }
    }, 2000);

  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox(
      'Startup Error',
      'Failed to start FIL-PAT server. Please check the logs and try again.'
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Clean up server processes
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (wsProcess) {
    wsProcess.kill();
    wsProcess = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Optional: Remove firewall rules on quit (comment out if you want rules to persist)
  // removeFirewallRules();
});

// IPC Handlers
ipcMain.handle('register-clinician', (event, username, password) => {
  try {
    registerClinician(username, password);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

ipcMain.handle('login-clinician', async (event, username, password) => {
  const user = await loginClinician(username, password);
  if (user) return { success: true, user };
  return { success: false, error: 'Invalid credentials' };
});

ipcMain.handle('get-network-info', () => {
  const localIp = getLocalIp();
  return {
    localIp,
    port: APP_PORT,
    wsPort: WS_PORT,
    clinicianUrl: `http://localhost:${APP_PORT}`,
    networkUrl: `http://${localIp}:${APP_PORT}`,
    wsUrl: `ws://${localIp}:${WS_PORT}`,
  };
});
