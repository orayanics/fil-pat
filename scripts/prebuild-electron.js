// Pre-build script to generate Prisma client with correct binaries for Electron
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Pre-build: Generating Prisma Client ===');

// Clean existing Prisma client
const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma');
if (fs.existsSync(prismaClientPath)) {
  console.log('Removing existing Prisma client...');
  fs.rmSync(prismaClientPath, { recursive: true, force: true });
}

// Generate Prisma client with Windows binary
console.log('Generating Prisma client for Windows...');
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_CLI_QUERY_ENGINE_TYPE: 'library',
      PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1'
    }
  });
  console.log('Prisma client generated successfully');
  
  // Verify query engine exists
  const queryEnginePath = path.join(
    __dirname, 
    'node_modules', 
    '.prisma', 
    'client',
    'query_engine-windows.dll.node'
  );
  
  if (fs.existsSync(queryEnginePath)) {
    console.log('✓ Query engine binary verified:', queryEnginePath);
    const stats = fs.statSync(queryEnginePath);
    console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error('✗ Query engine binary NOT found at:', queryEnginePath);
    console.error('  Available files in .prisma/client:');
    const clientDir = path.join(__dirname, 'node_modules', '.prisma', 'client');
    if (fs.existsSync(clientDir)) {
      fs.readdirSync(clientDir).forEach(file => {
        console.error('  -', file);
      });
    }
  }
} catch (error) {
  console.error('Failed to generate Prisma client:', error.message);
  process.exit(1);
}

console.log('=== Pre-build complete ===\n');
