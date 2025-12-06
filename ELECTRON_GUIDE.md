# FIL-PAT Electron Guide

This single guide replaces the previous setup/build docs and covers everything required to package, verify, and distribute the Windows desktop app.

## 1. Prerequisites
- Windows 10/11 (x64)
- Node.js 18+ and npm 9+
- 8 GB RAM / 2 GB free disk for builds
- Administrator access (needed the first time the app configures the firewall)

```powershell
# Clone and install
git clone <repo>
cd fil-pat
npm ci
```

> Tip: After installing dependencies the first time, run `npm run db:generate` so Prisma clients are ready for every build.

## 2. Quick Build Options
| Command | Use Case |
| --- | --- |
| `./build-electron.ps1` | One-stop automated build (checks Node, installs deps if needed, builds Next.js/Electron, packages portable + installer). |
| `npm run dist:portable` | Fast portable `.exe` for testing on other PCs without installation. |
| `npm run dist:installer` | NSIS installer with shortcuts + firewall rules (recommended for distribution). |
| `npm run dist` | Produces both installer and portable artifacts. |

Manual steps are still available:
```powershell
npm ci
npm run db:generate
npm run build            # Next.js + server
npm run build:electron   # Electron main process
npm run dist:portable    # or dist / dist:installer
```

### Outputs
After any packaging command, artifacts live in `release/`:
- `FIL-PAT-<version>-Portable.exe`
- `FIL-PAT-<version>-win-x64.exe`
- `win-unpacked/` (debug build tree)

## 3. Fresh-Build Cleanup
Use the new npm script to wipe all generated artifacts and dependencies before a clean install:
```powershell
npm run clean:fresh
```
This removes `node_modules`, `dist`, `dist-electron`, and `release`, ensuring the next `npm ci` + build starts from scratch.

## 4. Firewall & Network
- App binds to `0.0.0.0` so devices on the same WiFi can connect.
- Ports opened automatically:
  - `3000` – HTTP/Next.js clinician UI + patient web view
  - `8080` – WebSocket sync channel
- Portable build prompts on first run; installer adds rules during setup via NSIS.

Manual fallback (PowerShell as Admin):
```powershell
netsh advfirewall firewall add rule name="FIL-PAT - HTTP" dir=in action=allow protocol=TCP localport=3000 profile=private
netsh advfirewall firewall add rule name="FIL-PAT - WS" dir=in action=allow protocol=TCP localport=8080 profile=private
```

## 5. Database Auto-Initialization
On a fresh system the app:
1. Detects missing `prisma/filpat.db` inside the packaged resources.
2. Runs the compiled Prisma migrations and seeds test accounts:
   - Admin: `admin / admin123`
   - Clinician: `clinician / clinician123`
3. Shows the credentials dialog when ready.

To reset locally:
```powershell
Remove-Item prisma\filpat.db -Force
npm run db:generate
npm run db:push
npm run db:seed
```

## 6. Testing Checklist
1. **Build success** – `npm run build`, `npm run build:electron`, `npm run dist:*` finish without errors.
2. **Release contents** – `release/win-unpacked/resources/app/` contains `.next`, `dist`, `node_modules`, `prisma`, and `public`.
3. **Portable test** – run `release/FIL-PAT-*-Portable.exe` as Administrator and wait for the "Server Ready" banner.
4. **LAN access** – note the local IP printed by the app and open `http://<IP>:3000` on a second device; scan the patient QR to verify WebSockets sync.
5. **Installer test** – install via `FIL-PAT-*-win-x64.exe`, confirm shortcuts, firewall rules, and uninstall flow.

## 7. Troubleshooting
| Symptom | Fix |
| --- | --- |
| Build fails after dependency changes | `npm run clean:fresh && npm ci && npm run dist` |
| App says "Failed to start server" | Confirm `release/win-unpacked/resources/app/node_modules/next` exists (builds now include all runtime deps by default). |
| Patient cannot connect | Ensure both devices share the same WiFi, firewall rules exist, and clinician app shows the correct IP.
| Prisma errors | `npm run db:generate` before builds; check `prisma/schema.prisma` for typos. |

## 8. Distribution Workflow
1. Run the build script that matches your target (portable vs installer).
2. Copy artifacts from `release/` to USB/cloud.
3. Provide clinicians instructions:
   - Run as Administrator the first time
   - Allow firewall prompt
   - Use displayed IP/QR to pair patient devices
4. (Optional) Use `npm run clean:fresh` before the next release to guarantee clean artifacts.

For any new Electron feature or issue, start from this guide. It consolidates the previous BUILD_README, ELECTRON_BUILD_GUIDE, and ELECTRON_SETUP_GUIDE files.
