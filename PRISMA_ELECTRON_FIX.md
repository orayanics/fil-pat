# Electron + Prisma Packaging Solution

## The Problem
Prisma Client cannot work from inside ASAR archives because:
1. Native binaries (query_engine-windows.dll.node) cannot be loaded from ASAR
2. Prisma's module resolution expects files in node_modules structure
3. ASAR unpacking alone doesn't solve this - Prisma needs to be completely outside ASAR

## The Complete Fix

### 1. Move Prisma to extraResources (package.json)
```json
"asarUnpack": [
  // Remove Prisma from asarUnpack - it doesn't work there
  "node_modules/better-sqlite3/**/*"
],
"extraResources": [
  {
    "from": "node_modules/@prisma",
    "to": "app/node_modules/@prisma"
  },
  {
    "from": "node_modules/.prisma",
    "to": "app/node_modules/.prisma"
  }
]
```

### 2. Set Query Engine Path BEFORE Import (main.ts)
```typescript
// MUST happen before any Prisma imports
if (app.isPackaged) {
  const queryEnginePath = path.join(
    process.resourcesPath,
    'app',
    'node_modules',
    '.prisma',
    'client',
    'query_engine-windows.dll.node'
  );
  
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath;
  process.env.PRISMA_SCHEMA_PATH = path.join(
    process.resourcesPath,
    'app',
    'node_modules',
    '.prisma',
    'client',
    'schema.prisma'
  );
}

// NOW safe to import
import { prisma } from './database';
```

### 3. Configure in Client (client.ts)
Created `client-electron.ts` that sets paths before PrismaClient import:
```typescript
import { configurePrismaForElectron } from './client-electron';
configurePrismaForElectron();
import { PrismaClient } from '@prisma/client';
```

## File Structure After Build
```
release/
  win-unpacked/
    resources/
      app/                          # extraResources folder
        node_modules/
          @prisma/                  # Prisma packages
          .prisma/
            client/
              query_engine-windows.dll.node  # The critical binary
              schema.prisma
        .next/
        dist/
        prisma/
      app.asar                      # Main app code (no Prisma)
    FIL-PAT.exe
```

## Why This Works
1. **extraResources** puts Prisma in `resources/app/` - completely outside ASAR
2. **PRISMA_QUERY_ENGINE_LIBRARY** tells Prisma exactly where the binary is
3. **Early configuration** ensures paths are set before PrismaClient instantiation
4. **Consistent paths** between main process and renderer process

## Build Process
```powershell
# Clean previous build
Remove-Item -Recurse -Force .next, dist, dist-electron, release -ErrorAction SilentlyContinue

# Generate Prisma Client
npm run prisma:generate

# Build everything
npm run build:electron

# Test the portable exe
.\release\FIL-PAT-X.X.X-x64-win.exe
```

## Verification Steps
1. Check `resources/app/node_modules/.prisma/client/query_engine-windows.dll.node` exists
2. Check console logs for "Prisma engine path: ..." on app start
3. Verify database operations work (login, create patient, etc.)

## Alternative: Docker
If Electron packaging continues to have issues, the Docker deployment is fully configured and working:
```powershell
.\start-filpat.ps1
```

See `DOCKER_README.md` for complete Docker instructions.
