# BUILD INSTRUCTIONS - Electron with Prisma Fix

## What Changed - Based on Working Solution

After researching the successful [prisma-electron-test](https://github.com/TasinIshmam/prisma-electron-test) repository and the [Prisma discussion #10562](https://github.com/prisma/prisma/discussions/10562), here's what was implemented:

1. ✅ **Added Prisma to BOTH `files` AND `extraResources`** in package.json
2. ✅ **Included ALL Prisma packages explicitly**:
   - `node_modules/.prisma/**/*`
   - `node_modules/@prisma/client/**/*`
   - `node_modules/@prisma/engines/**/*`
3. ✅ **Updated paths** - extraResources now places files directly in `resources/` (not `resources/app/`)
4. ✅ **Set query engine paths** in both main.ts and client-electron.ts BEFORE importing PrismaClient

## The Key Insight

**The working solution puts Prisma in extraResources WITHOUT subdirectory mapping**. Instead of:
```json
"extraResources": [
  { "from": "node_modules/.prisma", "to": "app/node_modules/.prisma" }
]
```

Use the simpler format:
```json
"extraResources": [
  "node_modules/.prisma/**/*",
  "node_modules/@prisma/client/**/*",
  "node_modules/@prisma/engines/**/*"
]
```

This places files directly in `resources/` instead of `resources/app/`.

## Build Steps

### 1. Clean Previous Build
```powershell
Remove-Item -Recurse -Force .next, dist, dist-electron, release -ErrorAction SilentlyContinue
```

### 2. Install Dependencies (if needed)
```powershell
npm install
```

### 3. Build Everything
```powershell
npm run package:electron
```

This runs:
- `prebuild:electron` - Generates Prisma client with Windows binary
- `build` - Builds Next.js app
- `build:electron` - Compiles TypeScript electron files
- `electron-builder` - Packages the app

### 4. Verify the Build

Check that Prisma files are in extraResources (directly in resources/):
```powershell
Test-Path .\release\win-unpacked\resources\node_modules\.prisma\client\query_engine-windows.dll.node
```

Should return `True`

### 5. Test the Application
```powershell
.\release\win-unpacked\FIL-PAT.exe
```

Check console output for:
```
Prisma engine path: C:\...\resources\node_modules\.prisma\client\query_engine-windows.dll.node
```

## Expected File Structure
```
release/
  win-unpacked/
    resources/
      node_modules/               ← Prisma files here (NOT in subdirectory)
        @prisma/
          client/
          engines/
        .prisma/
          client/
            query_engine-windows.dll.node  ← The critical binary
            schema.prisma
            index.js
      prisma/
        filpat.db                 ← Initial database file
      app.asar                    ← Main application code
    FIL-PAT.exe
```

## Troubleshooting

### If build fails
1. Check `scripts/prebuild-electron.js` ran successfully
2. Verify `node_modules/.prisma/client/query_engine-windows.dll.node` exists locally
3. Run `npx prisma generate` manually to test

### If app starts but database fails
1. Check console logs for "Prisma engine path: ..."
2. Verify the path shown actually exists
3. Check if the binary file is 30+ MB (if it's smaller, it's corrupted)

### If "cannot find module" error persists
The `extraResources` approach should fix this completely. If it still fails:
1. Verify `package.json` has Prisma in `extraResources`, NOT in `asarUnpack`
2. Check that both main.ts and client.ts set the engine path BEFORE importing
3. Make sure you cleaned previous builds completely

## Alternative: Docker
If Electron continues to have issues, use the Docker deployment:
```powershell
.\start-filpat.ps1
```

Docker works flawlessly because it doesn't use ASAR packaging.
