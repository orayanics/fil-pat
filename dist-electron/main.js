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
let mainWindow = null;
function createWindow() {
    const win = new electron_1.BrowserWindow({
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
    }
    else {
        // In production, you can change this to load a static HTML if needed
        win.loadURL(`http://${ip}:3000`);
    }
    mainWindow = win;
}
function startDevServers() {
    const fullstack = (0, child_process_1.spawn)('npm', ['run', 'fullstack'], {
        shell: true,
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
    });
    fullstack.on('close', (code) => {
        console.log(`Dev servers exited with code ${code}`);
    });
}
// ✅ SINGLE `whenReady` block
electron_1.app.whenReady().then(() => {
    if (isDev) {
        startDevServers();
        setTimeout(() => {
            createWindow();
        }, 3000); // adjust if needed
    }
    else {
        createWindow();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
