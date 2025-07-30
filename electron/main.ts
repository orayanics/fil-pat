import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import * as os from 'os';

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
    webPreferences: {
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);

  const ip = getLocalIp();

  if (isDev) {
    win.loadURL(`http://${ip}:3000`);
  } else {
    // In production, you can change this to load a static HTML if needed
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

// ✅ SINGLE `whenReady` block
app.whenReady().then(() => {
  if (isDev) {
    startDevServers();
    setTimeout(() => {
      createWindow();
    }, 3000); // adjust if needed
  } else {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
