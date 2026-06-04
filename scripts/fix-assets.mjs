/**
 * Converts mislabeled JPEG assets to real PNGs (required for Android AAPT / EAS Build).
 * Run: node scripts/fix-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const imagesDir = path.join(root, 'assets', 'images');

async function loadSharp() {
  try {
    const require = createRequire(import.meta.url);
    return require('sharp');
  } catch {
    const { execSync } = await import('node:child_process');
    execSync('npm install --no-save sharp@0.33.5', { cwd: root, stdio: 'inherit' });
    const require = createRequire(import.meta.url);
    return require('sharp');
  }
}

async function toPng(sharp, srcName, destName, size) {
  const src = path.join(imagesDir, srcName);
  const dest = path.join(imagesDir, destName);
  if (!fs.existsSync(src)) {
    console.warn(`skip missing: ${srcName}`);
    return;
  }
  let pipeline = sharp(src);
  if (size) {
    pipeline = pipeline.resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    });
  }
  await pipeline.png().toFile(dest);
  fs.renameSync(dest, src);
  console.log(`fixed ${srcName}${size ? ` (${size}x${size})` : ''}`);
}

const sharp = await loadSharp();
await toPng(sharp, 'icon.png', 'icon.tmp.png', 1024);
await toPng(sharp, 'adaptive-icon.png', 'adaptive-icon.tmp.png', 1024);
await toPng(sharp, 'boltride-logo.png', 'boltride-logo.tmp.png');
await toPng(sharp, 'favicon.png', 'favicon.tmp.png');
await toPng(sharp, 'splash-icon.png', 'splash-icon.tmp.png');
console.log('Done. Re-run: npx expo-doctor');
