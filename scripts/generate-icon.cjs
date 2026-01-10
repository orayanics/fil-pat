#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const png2icons = require('png2icons');
const pngToIco = typeof pngToIcoModule === 'function' ? pngToIcoModule : pngToIcoModule.default;

const sizes = [16, 24, 32, 48, 64, 128, 256];
const workspaceRoot = path.resolve(__dirname, '..');
const source = path.join(workspaceRoot, 'assets', 'icons', 'icon.png');
const icoTarget = path.join(workspaceRoot, 'assets', 'icons', 'icon.ico');
const icnsTarget = path.join(workspaceRoot, 'assets', 'icons', 'icon.icns');

async function ensureSource() {
  try {
    await fs.access(source);
  } catch (error) {
    throw new Error(`Source PNG not found at ${source}`);
  }
}

async function createResizedBuffers(inputBuffer) {
  return Promise.all(
    sizes.map(async (size) => {
      const buffer = await sharp(inputBuffer)
        .resize(size, size, { fit: 'cover' })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
      return buffer;
    })
  );
}

async function main() {
  await ensureSource();
  const input = await fs.readFile(source);
  const resizedBuffers = await createResizedBuffers(input);
  const icoBuffer = await pngToIco(resizedBuffers);
  await fs.writeFile(icoTarget, icoBuffer);

  const icnsBuffer = png2icons.createICNS(input, png2icons.BICUBIC, 0);
  if (!icnsBuffer) {
    throw new Error('Failed to generate ICNS file from source PNG.');
  }
  await fs.writeFile(icnsTarget, icnsBuffer);

  console.log(`Generated icon at ${icoTarget}`);
  console.log(`Generated icon at ${icnsTarget}`);
  console.log(`ICO sizes: ${sizes.join(', ')}px`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
