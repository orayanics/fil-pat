import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as os from 'os';
import { ipcMain } from 'electron';
import { registerClinician, loginClinician } from './database';


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

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icons', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);

  const ip = getLocalIp();

  if (isDev) {
    win.loadURL(`http://${ip}:3000`);
  } else {
    win.loadURL(`http://${ip}:3000`);
  }

  mainWindow = win;
}

function startDevServers() {
  const fullstack = spawn('npm', ['run', 'fullstack'], {
    shell: true,
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  fullstack.on('close', (code) => {
    console.log(`Dev servers exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  if (isDev) {
    startDevServers();
    setTimeout(() => {
      createWindow();
    }, 3000); 
  } else {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


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
