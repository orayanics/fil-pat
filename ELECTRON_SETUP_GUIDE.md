# FIL-PAT Electron Setup Guide

## ✅ Enhancements Implemented

### Enhancement 1: Network Firewall Configuration ✓
**Status:** Fully Implemented

#### How it works:
1. **Installer (NSIS)**: Automatically adds firewall rules during installation
2. **Portable .exe**: Automatically adds firewall rules on first run
3. **Network Profiles**: Rules are applied to `private` and `domain` profiles (home/office WiFi)
4. **Dynamic IP**: Server binds to `0.0.0.0` to listen on all network interfaces
5. **Ports Opened**:
   - Port 3000: HTTP (Next.js server for patient dashboard)
   - Port 8080: WebSocket (Real-time session communication)

#### Technical Details:
- **Location**: `scripts/installer.nsh` (NSIS installer) & `electron/main.ts` (runtime)
- **Commands**: Uses `netsh advfirewall firewall add rule` with profile restrictions
- **Fallback**: If auto-configuration fails, provides manual instructions to user
- **IP Detection**: `getLocalIp()` function detects current network IP dynamically

#### Testing:
```bash
# 1. Build the application
npm run dist

# 2. Install the .exe on the clinician's computer
# Run as Administrator to ensure firewall rules are added

# 3. The app will display the local IP on startup
# Example: http://192.168.1.100:3000

# 4. On a patient device (same WiFi):
# - Scan the QR code shown in a session
# - OR manually enter: http://[CLINICIAN-IP]:3000/session/patient/[SESSION-ID]
```

---

### Enhancement 2: Auto Database Initialization ✓
**Status:** Fully Implemented

#### How it works:
1. **Fresh Install Detection**: Checks if `filpat.db` exists
2. **Auto-Setup**: If no database found:
   - Generates Prisma Client
   - Creates database schema (`db push`)
   - Seeds with test accounts and settings
3. **Welcome Dialog**: Shows default credentials after initialization

#### Default Test Accounts:
```
Admin Account:
  Username: admin
  Password: admin123
  Access: Full system administration

Test Clinician Account:
  Username: clinician
  Password: clinician123
  Access: Standard clinician features
  Profile: Pre-filled with test data
```

#### Technical Details:
- **Location**: `electron/initDatabase.ts` (initialization logic)
- **Trigger**: Called in `electron/main.ts` during `app.whenReady()`
- **Seed Script**: `src/lib/database/seed.ts` (compiled to `dist/lib/database/seed.js`)
- **Production Path**: Seed file is bundled in `dist` folder and included in .exe

#### Testing:
```bash
# 1. Build the application
npm run dist

# 2. Delete any existing database
# Location: prisma/filpat.db

# 3. Run the .exe
# The app will automatically:
# - Detect fresh installation
# - Create database
# - Seed test accounts
# - Show welcome dialog with credentials

# 4. Login with test accounts
# Username: admin or clinician
# Password: admin123 or clinician123
```

---

## 🏗️ Complete Build Process

### Prerequisites
- Node.js 18+ installed
- Windows 10/11
- Administrator privileges (for firewall configuration)

### Build Commands

#### Development Mode (Testing)
```powershell
# Start development with LAN access
npm run fullstack:lan

# Or test Electron in development
npm run dev:electron
```

#### Production Build
```powershell
# Option 1: Use the automated build script (Recommended)
.\build-electron.ps1

# Option 2: Manual build commands
npm run build              # Build Next.js + compile server/websocket
npm run build:electron     # Compile Electron main process
npm run dist              # Package everything as .exe
```

#### Build Output
```
release/
├── FIL-PAT-[version]-Portable.exe     # Portable executable (no installation)
└── FIL-PAT-[version]-Setup.exe        # NSIS installer
```

---

## 🧪 Testing Checklist

### Part 1: Build Verification
- [ ] Run `npm run build` successfully
- [ ] Verify `dist/` folder contains compiled files
- [ ] Verify `dist/lib/database/seed.js` exists
- [ ] Run `npm run build:electron` successfully
- [ ] Verify `dist-electron/` folder contains main.js

### Part 2: Fresh Installation Test
- [ ] Delete `prisma/filpat.db` if exists
- [ ] Run the built .exe as Administrator
- [ ] Verify welcome dialog appears with credentials
- [ ] Check console shows:
  ```
  🔍 Checking database status...
  📦 Fresh installation detected - initializing database...
  1️⃣  Generating Prisma client...
  2️⃣  Creating database schema...
  3️⃣  Seeding database with test accounts...
  ✅ Test accounts created
  ```
- [ ] Verify `prisma/filpat.db` file is created
- [ ] Login with `admin` / `admin123` ✓
- [ ] Login with `clinician` / `clinician123` ✓

### Part 3: Firewall Configuration Test
- [ ] Run .exe as Administrator
- [ ] Check Windows Firewall settings:
  ```powershell
  netsh advfirewall firewall show rule name="FIL-PAT - HTTP"
  netsh advfirewall firewall show rule name="FIL-PAT - WebSocket"
  ```
- [ ] Verify rules exist for ports 3000 and 8080
- [ ] Check console shows:
  ```
  ✓ Firewall rules added successfully
  Patient devices on same WiFi can now connect
  ```

### Part 4: Network Access Test
1. **On Clinician Computer:**
   - [ ] Start the application
   - [ ] Note the local IP address (shown in welcome dialog)
   - [ ] Create a session
   - [ ] Generate QR code for patient

2. **On Patient Device (same WiFi):**
   - [ ] Scan QR code OR
   - [ ] Manually enter URL: `http://[CLINICIAN-IP]:3000/session/patient/[ID]`
   - [ ] Verify patient dashboard loads
   - [ ] Test real-time updates (clinician sends item → patient sees it)

3. **WebSocket Connection:**
   - [ ] Verify WebSocket connects: `ws://[CLINICIAN-IP]:8080`
   - [ ] Test bidirectional communication
   - [ ] Check console for WebSocket logs

### Part 5: Template Seeding (Optional)
After initial setup, add assessment templates:

```powershell
# For admin account (clinician_id = 1)
npm run db:seed:templates 1

# For test clinician (clinician_id = 2)
npm run db:seed:templates 2
```

This creates:
- 2 templates (Standard + Kids) per clinician
- 76 assessment items per template
- Total: 152 items per clinician

---

## 🔧 Troubleshooting

### Issue: Firewall rules not added
**Symptom:** Console shows firewall warning or error

**Solutions:**
1. Run the .exe as Administrator
2. Manually add firewall rules:
   ```powershell
   netsh advfirewall firewall add rule name="FIL-PAT - HTTP" dir=in action=allow protocol=TCP localport=3000 profile=private enable=yes
   netsh advfirewall firewall add rule name="FIL-PAT - WebSocket" dir=in action=allow protocol=TCP localport=8080 profile=private enable=yes
   ```
3. Disable Windows Firewall temporarily for testing

### Issue: Patient device cannot connect
**Symptom:** Patient gets "Cannot connect" error

**Solutions:**
1. Verify both devices are on the **same WiFi network**
2. Check firewall rules are active (see above)
3. Verify the IP address is correct (shown in app)
4. Try disabling Windows Firewall temporarily
5. Check if antivirus is blocking connections
6. Ensure ports 3000 and 8080 are not used by other apps:
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :8080
   ```

### Issue: Database not created on fresh install
**Symptom:** Login fails, no database file found

**Solutions:**
1. Check console logs for seed errors
2. Manually run seed:
   ```powershell
   npm run db:push
   npm run db:seed
   ```
3. Verify Prisma client is generated:
   ```powershell
   npm run db:generate
   ```
4. Check if `dist/lib/database/seed.js` exists in the build

### Issue: Build fails
**Symptom:** `npm run build` or `npm run dist` fails

**Solutions:**
1. Clean and rebuild:
   ```powershell
   npm run clean:dist
   npm run rebuild:dist
   ```
2. Delete `node_modules` and reinstall:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```
3. Check TypeScript errors:
   ```powershell
   npx tsc --noEmit
   ```

---

## 📁 Key Files Reference

### Firewall Configuration
- `scripts/installer.nsh` - NSIS installer firewall rules
- `electron/main.ts` - Runtime firewall rules (lines 30-90)

### Database Initialization
- `electron/initDatabase.ts` - Auto-initialization logic
- `src/lib/database/seed.ts` - Seed script (creates test accounts)
- `tsconfig.server.json` - Ensures seed.ts is compiled

### Network Configuration
- `server.ts` - Next.js server (binds to 0.0.0.0)
- `websocket.ts` - WebSocket server (binds to 0.0.0.0)
- `next.config.ts` - Next.js hostname configuration

### Build Configuration
- `package.json` - Build scripts
- `tsconfig.electron.json` - Electron TypeScript config
- `build-electron.ps1` - Automated build script

---

## 🚀 Distribution Workflow

### For Clinicians (Recipients)
1. **Receive the .exe file** from developer
2. **Run as Administrator** (right-click → "Run as administrator")
3. **First launch:**
   - Wait for database initialization (~30 seconds)
   - Note the local IP address shown in welcome dialog
   - Write down default credentials
4. **Login** with test accounts:
   - Admin: `admin` / `admin123`
   - Clinician: `clinician` / `clinician123`
5. **Change passwords** for security
6. **Create session** and generate QR code for patients
7. **Patient devices** scan QR code to connect

### For Developers (You)
1. **Make changes** to code
2. **Test locally:**
   ```powershell
   npm run fullstack:lan
   ```
3. **Build distribution:**
   ```powershell
   .\build-electron.ps1
   ```
4. **Test the .exe:**
   - Install on a clean machine
   - Verify fresh DB initialization
   - Test network access
5. **Distribute** the .exe from `release/` folder

---

## 📊 Network Architecture

```
Clinician Computer (Windows)
├── Electron App (FIL-PAT.exe)
│   ├── Next.js Server → http://0.0.0.0:3000
│   ├── WebSocket Server → ws://0.0.0.0:8080
│   └── SQLite Database → prisma/filpat.db
│
├── Windows Firewall
│   ├── Rule: Allow TCP 3000 (HTTP)
│   ├── Rule: Allow TCP 8080 (WebSocket)
│   └── Profile: Private, Domain
│
└── Network Interface
    └── Local IP: 192.168.1.X (detected dynamically)

        ↓ WiFi Network ↓

Patient Device (Phone/Tablet/Computer)
├── Web Browser
│   ├── Access: http://192.168.1.X:3000/session/patient/[ID]
│   └── WebSocket: ws://192.168.1.X:8080
│
└── Scans QR Code with:
    - Session URL
    - Room ID
    - WebSocket connection info
```

---

## ✅ Summary

Both enhancements are **fully implemented and ready for testing**:

1. **✓ Firewall Configuration**: Automatic network access for patient devices
2. **✓ Database Auto-Init**: Fresh installs get test accounts automatically

Build the app and test with the checklist above. If you encounter any issues, refer to the troubleshooting section or check the console logs for detailed error messages.

**Next Steps:**
1. Run `.\build-electron.ps1`
2. Test the .exe on a clean machine
3. Verify network connectivity from another device
4. Confirm database initialization works on fresh install
