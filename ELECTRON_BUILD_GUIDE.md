# 📦 FIL-PAT Electron Build & Distribution Guide

## Building Standalone .exe for Windows

This guide explains how to build FIL-PAT as a standalone Windows application that can be distributed and run on any Windows computer without requiring Node.js or npm installation.

---

## 🎯 What This Does

The Electron build process creates a **standalone Windows executable** that:

✅ **Bundles everything**: Next.js app, WebSocket server, database, and all dependencies  
✅ **No installation needed**: Portable version runs directly  
✅ **Network accessible**: Automatically configures Windows Firewall  
✅ **Multi-device ready**: Patient devices on same WiFi can connect  
✅ **QR code support**: Easy patient device pairing  
✅ **Database included**: SQLite database bundled in the app  

---

## 🚀 Quick Start - Build the .exe

### Option 1: Portable EXE (Recommended for Testing)

**Single file, no installation required:**

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Build the Next.js app
npm run build

# 3. Build and package as portable .exe
npm run dist:portable
```

**Output**: `release/FIL-PAT-1.0.0-Portable.exe`

**Usage**: 
- Copy the .exe to any Windows computer
- Double-click to run
- No installation needed
- Firewall prompt will appear on first run (click "Allow access")

---

### Option 2: Full Installer (Recommended for Distribution)

**NSIS installer with automatic firewall configuration:**

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Build everything
npm run dist:installer
```

**Output**: 
- `release/FIL-PAT-1.0.0-win-x64-win.exe` (Installer)
- `release/FIL-PAT-1.0.0-Portable.exe` (Portable version)

**Installation Features**:
- ✅ Automatic Windows Firewall rules
- ✅ Desktop shortcut
- ✅ Start menu entry
- ✅ Proper uninstaller
- ✅ Runs with administrator privileges (for firewall config)

---

### Option 3: Build Both Versions

```bash
npm run dist
```

Creates both portable and installer versions.

---

## 📋 Build Requirements

### System Requirements
- **OS**: Windows 10/11 (64-bit)
- **Node.js**: v18 or higher
- **RAM**: 8GB minimum
- **Disk Space**: 2GB for build process

### First-Time Setup

```bash
# 1. Clone repository
git clone [repository-url]
cd fil-pat

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run db:generate

# 4. Build Next.js app
npm run build

# 5. Build Electron app
npm run build:electron

# 6. Package as .exe
npm run dist:portable
```

---

## 🔧 Build Process Explained

### What Happens During Build

```
1. npm run build
   ├─ Compiles Next.js app (.next folder)
   ├─ Transpiles TypeScript server code (dist folder)
   └─ Optimizes assets and dependencies

2. npm run build:electron
   ├─ Compiles Electron main process (dist-electron folder)
   └─ Prepares database integration

3. electron-builder
   ├─ Bundles all files into Electron app
   ├─ Includes Node.js runtime
   ├─ Packages dependencies
   ├─ Creates .exe with installer
   └─ Adds firewall configuration scripts
```

### Build Output Structure

```
release/
├── FIL-PAT-1.0.0-Portable.exe          # Portable version (no install)
├── FIL-PAT-1.0.0-win-x64-win.exe       # NSIS installer
└── win-unpacked/                        # Unpacked files (for debugging)
    ├── FIL-PAT.exe                      # Main executable
    ├── resources/
    │   └── app/
    │       ├── .next/                   # Next.js build
    │       ├── dist/                    # Server code
    │       ├── prisma/                  # Database
    │       └── public/                  # Static assets
    └── ... (Electron runtime files)
```

---

## 🔥 Firewall Configuration

### Automatic Setup

The installer **automatically configures Windows Firewall** to allow:

| Port | Service | Rule Name |
|------|---------|-----------|
| 3000 | Next.js HTTP Server | FIL-PAT - HTTP Server |
| 8080 | WebSocket Server | FIL-PAT - WebSocket Server |
| * | Application Executable | FIL-PAT Application |

### How It Works

**During Installation (NSIS):**
```
1. Installer runs with admin privileges
2. Adds firewall rules via netsh commands
3. Shows confirmation message
4. App can now accept network connections
```

**On First Run (Portable):**
```
1. App requests admin privileges
2. Adds firewall rules programmatically
3. Windows Firewall prompt appears
4. User clicks "Allow access"
```

### Manual Firewall Setup (If Needed)

If automatic configuration fails:

```powershell
# Run in PowerShell as Administrator

# Allow port 3000 (HTTP)
netsh advfirewall firewall add rule name="FIL-PAT - HTTP Server" dir=in action=allow protocol=TCP localport=3000

# Allow port 8080 (WebSocket)
netsh advfirewall firewall add rule name="FIL-PAT - WebSocket Server" dir=in action=allow protocol=TCP localport=8080

# Allow the executable
netsh advfirewall firewall add rule name="FIL-PAT App" dir=in action=allow program="C:\Path\To\FIL-PAT.exe"
```

### Verify Firewall Rules

```powershell
# Check if rules exist
netsh advfirewall firewall show rule name="FIL-PAT - HTTP Server"
netsh advfirewall firewall show rule name="FIL-PAT - WebSocket Server"
```

---

## 🌐 Network Access Configuration

### How Network Access Works

1. **Server Binds to 0.0.0.0**: Listens on all network interfaces
2. **Firewall Allows Incoming**: Windows Firewall rules permit external connections
3. **Patient Devices Connect**: Devices on same WiFi can access via IP address

### Connection URLs

When the app starts, it displays:

```
╔══════════════════════════════════════════════════════════╗
║                    FIL-PAT Server Ready                  ║
╠══════════════════════════════════════════════════════════╣
║  Clinician Interface: http://localhost:3000              ║
║  Local Network URL:   http://192.168.1.100:3000          ║
║  WebSocket Server:    ws://192.168.1.100:8080            ║
╠══════════════════════════════════════════════════════════╣
║  Patient devices on same WiFi can connect using:        ║
║  http://192.168.1.100:3000/session/patient/[ID]          ║
╚══════════════════════════════════════════════════════════╝
```

### Finding Your IP Address

**Automatic (in app):**
- App detects and displays local IP on startup
- Shows in dialog box
- Prints to console

**Manual:**
```powershell
# Windows Command Prompt
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

### Patient Connection Steps

1. **Clinician starts session** on main computer
2. **App generates QR code** with URL: `http://192.168.1.100:3000/session/patient/abc123`
3. **Patient scans QR code** with tablet/phone
4. **Browser opens patient interface** automatically
5. **WebSocket connects** and syncs in real-time

---

## 📱 Multi-Device Setup

### Typical Clinic Setup

```
┌─────────────────────────────────────────────────────────┐
│                    WiFi Network                         │
│                (192.168.1.x subnet)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │ Clinician PC     │         │ Patient Tablet   │    │
│  │ (192.168.1.100)  │◄────────┤ (192.168.1.105)  │    │
│  │                  │ WebSocket│                  │    │
│  │ - FIL-PAT.exe    │         │ - Web Browser    │    │
│  │ - Main Interface │         │ - Patient View   │    │
│  │ - Port 3000      │         │ - Scans QR Code  │    │
│  │ - Port 8080      │         │                  │    │
│  └──────────────────┘         └──────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Requirements

**Clinician Computer:**
- ✅ Windows 10/11
- ✅ FIL-PAT.exe installed/running
- ✅ Connected to WiFi
- ✅ Firewall configured (automatic)

**Patient Device:**
- ✅ Tablet, phone, or laptop
- ✅ Modern web browser (Chrome, Safari, Firefox, Edge)
- ✅ Connected to **same WiFi network**
- ✅ Camera (for QR code scanning)

---

## 🐛 Troubleshooting

### Build Issues

**Problem: `npm run build` fails**

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Try again
npm run build
```

**Problem: `electron-builder` fails**

```bash
# Update electron-builder
npm install electron-builder@latest --save-dev

# Clear dist folders
rm -rf dist dist-electron release

# Rebuild
npm run dist
```

**Problem: Database errors during build**

```bash
# Regenerate Prisma client
npm run db:generate

# Check schema
npx prisma validate

# Rebuild
npm run build
```

---

### Runtime Issues

**Problem: App won't start**

1. Check if ports 3000/8080 are already in use:
   ```powershell
   netstat -ano | findstr "3000"
   netstat -ano | findstr "8080"
   ```

2. Close conflicting applications

3. Restart FIL-PAT

**Problem: Patient device can't connect**

1. **Verify same WiFi network**
   ```
   Clinician PC WiFi: MyClinicWiFi
   Patient Device WiFi: MyClinicWiFi ✓
   ```

2. **Check firewall**
   ```powershell
   netsh advfirewall firewall show rule name="FIL-PAT - HTTP Server"
   ```

3. **Ping test**
   ```powershell
   # From patient device, open command prompt
   ping 192.168.1.100
   # Should get replies
   ```

4. **Test URL directly**
   ```
   # Open browser on patient device
   http://192.168.1.100:3000
   # Should show FIL-PAT homepage
   ```

**Problem: Firewall blocks connections**

```powershell
# Run as Administrator
# Re-add firewall rules
netsh advfirewall firewall add rule name="FIL-PAT - HTTP" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="FIL-PAT - WebSocket" dir=in action=allow protocol=TCP localport=8080
```

---

## 📦 Distribution

### Sharing the .exe with Other Clinics

**Option 1: Portable EXE**

1. Build portable version:
   ```bash
   npm run dist:portable
   ```

2. Distribute file:
   - `release/FIL-PAT-1.0.0-Portable.exe` (≈200-300 MB)

3. Instructions for recipients:
   ```
   1. Copy FIL-PAT-1.0.0-Portable.exe to your computer
   2. Right-click → Run as Administrator
   3. Click "Allow" when Windows Firewall prompts
   4. App will start automatically
   ```

**Option 2: Full Installer**

1. Build installer:
   ```bash
   npm run dist:installer
   ```

2. Distribute file:
   - `release/FIL-PAT-1.0.0-win-x64-win.exe` (≈200-300 MB)

3. Instructions:
   ```
   1. Run FIL-PAT-1.0.0-win-x64-win.exe
   2. Follow installation wizard
   3. Firewall configured automatically
   4. Launch from Desktop shortcut
   ```

### File Size Optimization

Current build size: ~200-300 MB (includes Node.js runtime, all dependencies)

**To reduce size:**

```javascript
// In package.json > build
"files": [
  "!node_modules/**/*",           // Exclude all node_modules
  "node_modules/.prisma/**/*",    // Include only Prisma
  "node_modules/@prisma/**/*",
  // ... minimize included files
]
```

---

## 🔄 Updates and Versions

### Version Management

```json
// package.json
{
  "version": "1.0.0",  // Update this for new releases
  "build": {
    "artifactName": "${productName}-${version}-${arch}-${os}.${ext}"
  }
}
```

### Creating New Release

```bash
# 1. Update version
npm version patch  # 1.0.0 → 1.0.1
# or
npm version minor  # 1.0.0 → 1.1.0

# 2. Build new release
npm run dist

# 3. Distribute new .exe
# File: release/FIL-PAT-1.1.0-Portable.exe
```

---

## ✅ Pre-Distribution Checklist

Before distributing the .exe:

- [ ] Test on clean Windows machine (no Node.js)
- [ ] Verify firewall configuration works
- [ ] Test multi-device connection (clinician + patient)
- [ ] Verify QR code generation
- [ ] Test database operations (CRUD)
- [ ] Check all assessment features work
- [ ] Verify PDF report generation
- [ ] Test kids mode themes
- [ ] Check session persistence
- [ ] Verify WebSocket stability

---

## 📞 Support

**Build Issues:**
- Check Node.js version: `node --version` (should be v18+)
- Check npm version: `npm --version`
- Clear caches: `npm cache clean --force`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Runtime Issues:**
- Check Windows Firewall settings
- Verify network configuration
- Review console logs (Ctrl+Shift+I in app)
- Check Event Viewer for errors

**For Help:**
- Email: filpat.support@ust.edu.ph
- Phone: (02) 8731-3101 ext. 2450

---

## 🎉 Success!

Once built, you'll have:

✅ **Standalone Windows application**  
✅ **No Node.js required for end users**  
✅ **Automatic network configuration**  
✅ **Multi-device session support**  
✅ **Easy distribution (single .exe file)**  
✅ **Professional installer option**  

Your FIL-PAT system is now ready for deployment at UST-CRS and other clinics! 🇵🇭

---

**Last Updated:** December 2, 2025  
**Version:** 1.0  
**Platform:** Windows 10/11 (x64)
