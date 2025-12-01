# 🚀 Quick Build Instructions

## Build Standalone Windows .exe

### Using PowerShell Script (Easiest)

```powershell
# Run the automated build script
.\build-electron.ps1
```

The script will:
1. Check Node.js installation
2. Install dependencies
3. Generate Prisma client
4. Build Next.js app
5. Build Electron app
6. Package as .exe files
7. Open release folder when done

---

### Manual Build (Step-by-Step)

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Build Next.js app
npm run build

# 4. Build Electron
npm run build:electron

# 5. Package as portable .exe
npm run dist:portable

# OR package as full installer
npm run dist:installer

# OR package both versions
npm run dist
```

---

## Output Files

After building, check the `release/` folder:

- **FIL-PAT-1.0.0-Portable.exe** - Portable version (no installation)
- **FIL-PAT-1.0.0-win-x64-win.exe** - Full installer with auto firewall config

---

## Firewall Configuration

The app **automatically configures Windows Firewall** to:
- ✅ Allow incoming connections on port 3000 (HTTP)
- ✅ Allow incoming connections on port 8080 (WebSocket)
- ✅ Enable patient devices on same WiFi to connect

**No manual configuration needed!**

---

## Testing the .exe

1. Copy the .exe to a test computer (or same computer)
2. Right-click → **Run as Administrator**
3. Windows Firewall prompt → Click **Allow access**
4. App starts and shows network information
5. Patient devices can connect via displayed IP address

---

## Distribution

### For Other Clinics/Computers:

1. **Copy the .exe file** to USB drive or share via network
2. **Send instructions**: Run as Administrator, allow firewall
3. **Share IP address**: Clinician computer's local IP (shown in app)
4. **Patient connection**: Use QR code or manual URL

---

## Requirements

**Build Computer:**
- Windows 10/11
- Node.js v18+
- 8GB RAM
- 2GB disk space

**Target Computer (End User):**
- Windows 10/11
- WiFi connection
- **No Node.js required!**

---

## Troubleshooting

**Build fails?**
```bash
# Clear caches
npm cache clean --force
rm -rf node_modules .next dist dist-electron
npm install

# Try again
npm run dist
```

**App won't start?**
- Check if ports 3000/8080 are in use
- Run as Administrator
- Check Windows Firewall settings

**Patient can't connect?**
- Verify same WiFi network
- Check firewall rules: `netsh advfirewall firewall show rule name="FIL-PAT - HTTP Server"`
- Test URL directly in browser: `http://[IP]:3000`

---

## More Information

- **Complete Guide**: [ELECTRON_BUILD_GUIDE.md](ELECTRON_BUILD_GUIDE.md)
- **User Manual**: [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
- **Full Documentation**: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

**Ready to build? Run the script!**

```powershell
.\build-electron.ps1
```

🎉 Your standalone FIL-PAT app will be ready in ~10 minutes!
