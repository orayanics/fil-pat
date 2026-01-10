// Pre-build script to generate Prisma client with correct binaries for Electron
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Pre-build: Generating Prisma Client ===');

// Get the project root (parent of scripts directory)
const projectRoot = path.join(__dirname, '..');
const platform = process.platform;
const prismaEngines = {
  win32: 'query_engine-windows.dll.node',
  darwin: 'libquery_engine-darwin.dylib.node',
  linux: 'libquery_engine-linux.so.node',
};
const expectedEngine = prismaEngines[platform];

if (!expectedEngine) {
  console.warn(`No Prisma query engine mapping for platform ${platform}. Skipping validation.`);
}

// Clean existing Prisma client
const prismaClientPath = path.join(projectRoot, 'node_modules', '.prisma');
if (fs.existsSync(prismaClientPath)) {
  console.log('Removing existing Prisma client...');
  fs.rmSync(prismaClientPath, { recursive: true, force: true });
}

console.log(`Generating Prisma client for ${platform}...`);
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: projectRoot,
    env: {
      ...process.env,
      PRISMA_CLI_QUERY_ENGINE_TYPE: 'library',
      PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1'
    }
  });
  console.log('Prisma client generated successfully');
  
  if (expectedEngine) {
    const queryEnginePath = path.join(
      projectRoot, 
      'node_modules', 
      '.prisma', 
      'client',
      expectedEngine
    );
    
    if (fs.existsSync(queryEnginePath)) {
      console.log('✓ Query engine binary verified:', queryEnginePath);
      const stats = fs.statSync(queryEnginePath);
      console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.error('✗ Query engine binary NOT found at:', queryEnginePath);
      console.error('  Available files in .prisma/client:');
      const clientDir = path.join(projectRoot, 'node_modules', '.prisma', 'client');
      if (fs.existsSync(clientDir)) {
        fs.readdirSync(clientDir).forEach(file => {
          console.error('  -', file);
        });
      }
    }
  }
} catch (error) {
  console.error('Failed to generate Prisma client:', error.message);
  process.exit(1);
}

console.log('=== Pre-build complete ===\n');
