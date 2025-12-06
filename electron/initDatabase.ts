/**
 * Database Initialization for Electron
 * 
 * This module ensures the database is properly initialized on first run
 * of the Electron app, particularly for fresh .exe installations.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

/**
 * Check if database file exists
 */
export function databaseExists(dbPath: string): boolean {
  return fs.existsSync(dbPath);
}

/**
 * Initialize database with Prisma migrations and seed data
 * This runs automatically on first launch of the .exe
 */
export async function initializeDatabase(isDev: boolean): Promise<void> {
  console.log('🔍 Checking database status...');

  const bundledDbPath = getBundledDatabasePath(isDev);
  const runtimeDbPath = getRuntimeDatabasePath(isDev);

  const dbExists = databaseExists(runtimeDbPath);

  if (!dbExists) {
    console.log('📦 Fresh installation detected - initializing database...');
    console.log('');
    
    if (isDev) {
      // Development: run full setup
      await runDatabaseSetup(isDev);
    } else {
      // Production: Copy pre-built database from resources to userData
      await copyBundledDatabaseToRuntime(bundledDbPath, runtimeDbPath);
    }
    
    console.log('');
    console.log('✅ Database initialized successfully!');
  } else {
    console.log('✓ Database already exists');
  }
}

/**
 * Copy pre-built database file to userData directory (production only)
 */
async function copyBundledDatabaseToRuntime(sourceDb: string, targetDb: string): Promise<void> {
  console.log('📋 Copying pre-built database to user data...');

  if (!fs.existsSync(sourceDb)) {
    throw new Error(`Source database not found at: ${sourceDb}`);
  }

  fs.mkdirSync(path.dirname(targetDb), { recursive: true });
  fs.copyFileSync(sourceDb, targetDb);

  console.log('✓ Database ready at:', targetDb);
}

/**
 * Run Prisma migration and seed
 */
async function runDatabaseSetup(isDev: boolean): Promise<void> {
  const cwd = isDev
    ? path.join(__dirname, '..')
    : path.join(process.resourcesPath, 'app');

  // Step 1: Generate Prisma Client
  console.log('1️⃣  Generating Prisma client...');
  await runCommand('npx', ['prisma', 'generate'], cwd);

  // Step 2: Push database schema
  console.log('2️⃣  Creating database schema...');
  await runCommand('npx', ['prisma', 'db', 'push', '--accept-data-loss'], cwd);

  // Step 3: Seed database with test accounts
  console.log('3️⃣  Seeding database with test accounts and settings...');
  
  if (isDev) {
    // Development mode: Use tsx to run TypeScript directly
    const seedPath = path.join(__dirname, '..', 'src', 'lib', 'database', 'seed.ts');
    await runCommand('npx', ['tsx', seedPath], cwd);
  } else {
    // Production mode: Seed is bundled in dist folder
    // Use node to run the compiled JavaScript
    const seedPath = path.join(process.resourcesPath, 'app', 'dist', 'lib', 'database', 'seed.js');
    
    // Verify seed file exists
    if (!fs.existsSync(seedPath)) {
      console.warn('⚠ Seed file not found at:', seedPath);
      console.log('Attempting alternative seed location...');
      
      // Alternative: Try running seed via require
      try {
        const seed = require(seedPath);
        if (typeof seed.default === 'function') {
          await seed.default();
        }
      } catch (error) {
        console.error('Failed to load seed module:', error);
        throw new Error('Could not initialize database - seed file missing');
      }
    } else {
      await runCommand('node', [seedPath], cwd);
    }
  }
  
  console.log('✅ Test accounts created:');
  console.log('   Admin: admin / admin123');
  console.log('   Clinician: clinician / clinician123');
}

/**
 * Helper to run shell commands with proper error handling
 */
function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      // Show important messages
      if (text.includes('✅') || text.includes('🎉') || text.includes('Created')) {
        console.log(text.trim());
      }
    });

    proc.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error('Command failed:', command, args.join(' '));
        console.error('Error output:', errorOutput);
        reject(new Error(`Command exited with code ${code}`));
      }
    });

    proc.on('error', (error) => {
      console.error('Failed to execute command:', error);
      reject(error);
    });
  });
}

/**
 * Ensure database directory exists
 */
export function ensureDatabaseDirectory(isDev: boolean): void {
  if (isDev) {
    const devDir = path.join(__dirname, '..', 'prisma');
    if (!fs.existsSync(devDir)) {
      console.log('Creating database directory:', devDir);
      fs.mkdirSync(devDir, { recursive: true });
    }
    return;
  }

  const bundledDir = path.join(process.resourcesPath, 'prisma');
  if (!fs.existsSync(bundledDir)) {
    console.log('Creating bundled database directory:', bundledDir);
    fs.mkdirSync(bundledDir, { recursive: true });
  }

  const runtimeDir = path.dirname(getRuntimeDatabasePath(false));
  if (!fs.existsSync(runtimeDir)) {
    console.log('Creating runtime database directory:', runtimeDir);
    fs.mkdirSync(runtimeDir, { recursive: true });
  }
}

function getBundledDatabasePath(isDev: boolean): string {
  return isDev
    ? path.join(__dirname, '..', 'prisma', 'filpat.db')
    : path.join(process.resourcesPath, 'prisma', 'filpat.db');
}

function getRuntimeDatabasePath(isDev: boolean): string {
  if (isDev) {
    return path.join(__dirname, '..', 'prisma', 'filpat.db');
  }
  const userData = app.getPath('userData');
  return path.join(userData, 'filpat.db');
}
