// Electron build script to ensure Prisma files are properly copied
const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const appOutDir = context.appOutDir;
  const isWindows = context.electronPlatformName === 'win32';
  
  console.log('\n=== Running afterPack hook ===');
  console.log('App output directory:', appOutDir);
  console.log('Platform:', context.electronPlatformName);
  
  if (!isWindows) {
    console.log('Skipping Prisma setup for non-Windows platform\n');
    return;
  }
  
  // Source: project's node_modules
  const projectRoot = path.resolve(__dirname);
  const sourcePrismaDir = path.join(projectRoot, 'node_modules', '.prisma');
  const sourcePrismaClient = path.join(sourcePrismaDir, 'client');
  
  // Destination: unpacked asar
  const unpackedDir = path.join(appOutDir, 'resources', 'app.asar.unpacked', 'node_modules');
  const destPrismaDir = path.join(unpackedDir, '.prisma');
  const destPrismaClient = path.join(destPrismaDir, 'client');
  
  console.log('\nSource Prisma directory:', sourcePrismaDir);
  console.log('Destination Prisma directory:', destPrismaDir);
  
  // Check if source exists
  if (!fs.existsSync(sourcePrismaClient)) {
    console.error('\n✗ ERROR: Source Prisma client not found!');
    console.error('  Expected at:', sourcePrismaClient);
    console.error('  Make sure to run "npx prisma generate" before building\n');
    return;
  }
  
  console.log('✓ Source Prisma client found');
  
  // List source files
  const sourceFiles = fs.readdirSync(sourcePrismaClient);
  console.log('  Files:', sourceFiles.length);
  const queryEngine = sourceFiles.find(f => f.includes('query_engine'));
  if (queryEngine) {
    const qePath = path.join(sourcePrismaClient, queryEngine);
    const qeStats = fs.statSync(qePath);
    console.log(`  ✓ Query engine: ${queryEngine} (${(qeStats.size / 1024 / 1024).toFixed(2)} MB)`);
  } else {
    console.error('  ✗ WARNING: No query engine found in source!');
  }
  
  // Ensure destination directory exists
  if (!fs.existsSync(destPrismaDir)) {
    console.log('\nCreating destination directory...');
    fs.mkdirSync(destPrismaDir, { recursive: true });
  }
  
  // Copy Prisma client to unpacked directory
  console.log('\nCopying Prisma client...');
  try {
    fs.cpSync(sourcePrismaClient, destPrismaClient, { recursive: true });
    console.log('✓ Prisma client copied successfully');
    
    // Verify destination
    if (fs.existsSync(destPrismaClient)) {
      const destFiles = fs.readdirSync(destPrismaClient);
      console.log('  Destination files:', destFiles.length);
      const destQueryEngine = destFiles.find(f => f.includes('query_engine'));
      if (destQueryEngine) {
        console.log(`  ✓ Query engine verified: ${destQueryEngine}`);
      } else {
        console.error('  ✗ WARNING: Query engine not found in destination!');
      }
    }
  } catch (error) {
    console.error('✗ ERROR copying Prisma client:', error.message);
  }
  
  console.log('\n=== afterPack hook completed ===\n');
};
