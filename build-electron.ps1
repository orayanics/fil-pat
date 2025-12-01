# FIL-PAT Electron Build Script
# Automates the complete build process for Windows .exe distribution

Write-Host "
╔══════════════════════════════════════════════════════════╗
║            FIL-PAT Electron Build Script                ║
║     Building standalone Windows executable...           ║
╚══════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "`n[1/7] Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "✗ Error: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green

# Check if npm is installed
$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
    Write-Host "✗ Error: npm is not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm $npmVersion found" -ForegroundColor Green

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "`n[2/7] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "`n[2/7] Dependencies already installed ✓" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "`n[3/7] Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to generate Prisma client!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated" -ForegroundColor Green

# Build Next.js application
Write-Host "`n[4/7] Building Next.js application..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to build Next.js app!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Next.js app built successfully" -ForegroundColor Green

# Build Electron main process
Write-Host "`n[5/7] Building Electron main process..." -ForegroundColor Yellow
npm run build:electron
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to build Electron!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Electron main process built" -ForegroundColor Green

# Package with electron-builder
Write-Host "`n[6/7] Packaging application with electron-builder..." -ForegroundColor Yellow
Write-Host "Creating portable .exe and installer..." -ForegroundColor Gray
Write-Host "This will take several minutes..." -ForegroundColor Gray
npm run dist
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to package application!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Application packaged successfully" -ForegroundColor Green

# Show results
Write-Host "`n[7/7] Build complete!" -ForegroundColor Yellow

if (Test-Path "release") {
    Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                  Build Successful! ✓                    ║" -ForegroundColor Cyan
    Write-Host "╠══════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  Output files:                                           ║" -ForegroundColor Cyan
    
    Get-ChildItem "release" -Filter "*.exe" | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        $fileName = $_.Name
        Write-Host "║  • $fileName ($sizeMB MB)" -ForegroundColor White
    }
    
    Write-Host "╠══════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  Distribution:                                           ║" -ForegroundColor Cyan
    Write-Host "║  - Copy .exe file to target computer                     ║" -ForegroundColor White
    Write-Host "║  - Run as Administrator (for firewall config)            ║" -ForegroundColor White
    Write-Host "║  - Patient devices can connect via same WiFi             ║" -ForegroundColor White
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    
    Write-Host "`nPress any key to open release folder..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    explorer "release"
} else {
    Write-Host "`n✗ Release folder not found! Build may have failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nBuild script completed successfully!" -ForegroundColor Green
Write-Host "See ELECTRON_BUILD_GUIDE.md for distribution instructions." -ForegroundColor Gray
