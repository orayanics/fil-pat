// Electron build script to ensure Prisma files are properly copied
const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

exports.default = async function (context) {
  const { appOutDir, electronPlatformName, packager } = context;

  console.log('\n=== Running afterPack hook ===');
  console.log('App output directory:', appOutDir);
  console.log('Platform:', electronPlatformName);

  // Source: project's node_modules
  const projectRoot = path.resolve(__dirname);
  const sourcePrismaClient = path.join(projectRoot, 'node_modules', '.prisma', 'client');

  if (!fs.existsSync(sourcePrismaClient)) {
    console.error('\n✗ ERROR: Source Prisma client not found!');
    console.error('  Expected at:', sourcePrismaClient);
    console.error('  Make sure to run "npx prisma generate" before building\n');
    return;
  }

  const resourcesDir = await packager.getResourcesDir(appOutDir);
  const unpackedNodeModules = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules');
  const destPrismaClient = path.join(unpackedNodeModules, '.prisma', 'client');

  console.log('\nSource Prisma client:', sourcePrismaClient);
  console.log('Destination Prisma client:', destPrismaClient);

  const sourceFiles = fs.readdirSync(sourcePrismaClient);
  console.log('  Files:', sourceFiles.length);
  const queryEngine = sourceFiles.find((f) => f.includes('query_engine'));
  if (queryEngine) {
    const qePath = path.join(sourcePrismaClient, queryEngine);
    const qeStats = fs.statSync(qePath);
    console.log(`  ✓ Query engine: ${queryEngine} (${(qeStats.size / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    console.warn('  ✗ WARNING: No query engine found in source!');
  }

  ensureDir(path.join(unpackedNodeModules, '.prisma'));

  console.log('\nCopying Prisma client to unpacked directory...');
  try {
    fs.cpSync(sourcePrismaClient, destPrismaClient, { recursive: true });
    console.log('✓ Prisma client copied successfully');
  } catch (error) {
    console.error('✗ ERROR copying Prisma client:', error.message);
  }

  console.log('\n=== afterPack hook completed ===\n');
};
