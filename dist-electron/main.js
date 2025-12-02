"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const os = __importStar(require("os"));
const electron_2 = require("electron");
const database_1 = require("./database");
const fs = __importStar(require("fs"));
const initDatabase_1 = require("./initDatabase");
function getLocalIp() {
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
const isDev = !electron_1.app.isPackaged;
const APP_PORT = 3000;
const WS_PORT = 8080;
let mainWindow = null;
let serverProcess = null;
let wsProcess = null;
/**
 * Add Windows Firewall rules to allow incoming connections on ports 3000 and 8080
 * This enables other devices on the same WiFi network to access the patient dashboard
 * Rules are applied with 'private' and 'domain' profiles to work on home/office networks
 */
async function addFirewallRules() {
    if (process.platform !== 'win32') {
        console.log('Firewall rules only needed on Windows');
        return;
    }
    const exePath = process.execPath;
    const appName = 'FIL-PAT';
    return new Promise((resolve) => {
        // Check if rules already exist
        (0, child_process_1.exec)(`netsh advfirewall firewall show rule name="${appName} - HTTP"`, (error) => {
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
                const addRules = (0, child_process_1.spawn)('powershell.exe', [
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
                    }
                    else {
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
            }
            else {
                console.log('✓ Firewall rules already exist');
                resolve();
            }
        });
    });
}
/**
 * Remove firewall rules when app is uninstalled or closed
 */
function removeFirewallRules() {
    if (process.platform !== 'win32')
        return;
    const appName = 'FIL-PAT';
    const commands = [
        `netsh advfirewall firewall delete rule name="${appName} - HTTP"`,
        `netsh advfirewall firewall delete rule name="${appName} - WebSocket"`,
        `netsh advfirewall firewall delete rule name="${appName} - App"`,
    ];
    (0, child_process_1.exec)(commands.join(' & '), (error) => {
        if (error) {
            console.warn('Could not remove firewall rules:', error.message);
        }
        else {
            console.log('Firewall rules removed');
        }
    });
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
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
    }
    else {
        win.loadURL(`http://localhost:${APP_PORT}`);
    }
    mainWindow = win;
}
/**
 * Start the Next.js server in production mode
 */
function startProductionServer() {
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
        serverProcess = (0, child_process_1.spawn)('node', [serverPath], {
            env: env,
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
function startDevServers() {
    return new Promise((resolve) => {
        console.log('Starting development servers...');
        const fullstack = (0, child_process_1.spawn)('npm', ['run', 'fullstack:lan'], {
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
    electron_1.dialog.showMessageBox(mainWindow, {
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
electron_1.app.whenReady().then(async () => {
    try {
        console.log('═══════════════════════════════════════════════════════');
        console.log('          FIL-PAT Starting Up (Electron)              ');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        // Step 1: Ensure database directory exists
        (0, initDatabase_1.ensureDatabaseDirectory)(isDev);
        // Step 2: Initialize database (auto-seed on fresh install)
        await (0, initDatabase_1.initializeDatabase)(isDev);
        // Step 3: Add firewall rules
        await addFirewallRules();
        // Step 4: Start appropriate servers
        if (isDev) {
            await startDevServers();
        }
        else {
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
    }
    catch (error) {
        console.error('Failed to start application:', error);
        electron_1.dialog.showErrorBox('Startup Error', 'Failed to start FIL-PAT server. Please check the logs and try again.');
        electron_1.app.quit();
    }
});
electron_1.app.on('window-all-closed', () => {
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
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    // Optional: Remove firewall rules on quit (comment out if you want rules to persist)
    // removeFirewallRules();
});
// IPC Handlers
electron_2.ipcMain.handle('register-clinician', (event, username, password) => {
    try {
        (0, database_1.registerClinician)(username, password);
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
});
electron_2.ipcMain.handle('login-clinician', async (event, username, password) => {
    const user = await (0, database_1.loginClinician)(username, password);
    if (user)
        return { success: true, user };
    return { success: false, error: 'Invalid credentials' };
});
electron_2.ipcMain.handle('get-network-info', () => {
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
