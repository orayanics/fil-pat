// Before build script to verify Prisma client
const fs = require('fs');
const path = require('path');

console.log('=== Before Build: Verifying Prisma Client ===');

const projectRoot = path.resolve(__dirname, '..');
const prismaEngines = {
  win32: 'query_engine-windows.dll.node',
  darwin: 'libquery_engine-darwin.dylib.node',
  linux: 'libquery_engine-linux.so.node',
};

const engineFilename = prismaEngines[process.platform];

if (!engineFilename) {
  console.warn(`⚠ No Prisma query engine mapping for platform: ${process.platform}`);
  console.log('=== Before Build Complete ===\n');
  process.exit(0);
}

const queryEnginePath = path.join(
  projectRoot,
  'node_modules',
  '.prisma',
  'client',
  engineFilename
);

if (fs.existsSync(queryEnginePath)) {
  const stats = fs.statSync(queryEnginePath);
  console.log('✓ Prisma query engine verified');
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Path: ${queryEnginePath}`);
  console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
} else {
  console.warn('⚠ Prisma query engine not found at:', queryEnginePath);
  console.warn('  Build may fail. Run: npm run db:generate');
}

console.log('=== Before Build Complete ===\n');
