import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess, exec } from 'child_process';
import * as os from 'os';
import { ipcMain } from 'electron';
import { registerClinician, loginClinician } from './database';
import * as fs from 'fs';

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

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let wsProcess: ChildProcess | null = null;

/**
 * Add Windows Firewall rules to allow incoming connections on ports 3000 and 8080
 * This enables other devices on the same WiFi network to access the patient dashboard
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
        console.log('Adding Windows Firewall rules...');
        
        const commands = [
          // Allow HTTP (Next.js) on port 3000
          `netsh advfirewall firewall add rule name="${appName} - HTTP" dir=in action=allow protocol=TCP localport=${APP_PORT} enable=yes`,
          // Allow WebSocket on port 8080
          `netsh advfirewall firewall add rule name="${appName} - WebSocket" dir=in action=allow protocol=TCP localport=${WS_PORT} enable=yes`,
          // Allow the executable itself
          `netsh advfirewall firewall add rule name="${appName} - App" dir=in action=allow program="${exePath}" enable=yes`,
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
          } else {
            console.warn(`⚠ Firewall rules may not have been added (code ${code}). Manual setup may be needed.`);
          }
          resolve();
        });

        addRules.on('error', (err) => {
          console.warn('⚠ Could not add firewall rules automatically:', err.message);
          console.log('You may need to manually allow ports 3000 and 8080 in Windows Firewall');
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
    icon: path.join(__dirname, '..', 'assets', 'icons', 'icon.ico'),
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
    
    const serverPath = isDev 
      ? path.join(__dirname, '..', 'server.ts')
      : path.join(process.resourcesPath, 'app', 'dist', 'server.js');

    // Check if server file exists
    if (!fs.existsSync(serverPath)) {
      console.error('Server file not found at:', serverPath);
      reject(new Error('Server files not found. Please rebuild the application.'));
      return;
    }

    const env = {
      ...process.env,
      NODE_ENV: 'production',
      APP_HOSTNAME: '0.0.0.0', // Listen on all interfaces for LAN access
      APP_PORT: APP_PORT.toString(),
      WEBSOCKET_PORT: WS_PORT.toString(),
      WEBSOCKET_HOST: '0.0.0.0',
    };

    serverProcess = spawn('node', [serverPath], {
      env,
      cwd: isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app'),
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

    // Wait for server to be ready
    setTimeout(() => {
      console.log('✓ Server started');
      resolve();
    }, 3000);
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

Firewall: Windows Firewall rules have been configured automatically.
    `,
    buttons: ['OK'],
  });
}

// Initialize app
app.whenReady().then(async () => {
  try {
    // Add firewall rules first
    await addFirewallRules();

    // Start appropriate servers
    if (isDev) {
      await startDevServers();
    } else {
      await startProductionServer();
    }

    // Create main window
    createWindow();

    // Show connection info after window loads
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

ipcMain.handle('login-clinician', (event, username, password) => {
  const user = loginClinician(username, password);
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
