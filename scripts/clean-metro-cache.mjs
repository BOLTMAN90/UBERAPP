import { readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const projectRoot = join(import.meta.dirname, '..');

const pathsToRemove = [
  join(projectRoot, 'node_modules', '.cache'),
  join(projectRoot, '.expo'),
];

for (const target of pathsToRemove) {
  try {
    rmSync(target, { recursive: true, force: true });
    console.log('Removed:', target);
  } catch {
    // ignore
  }
}

const temp = tmpdir();
try {
  for (const name of readdirSync(temp)) {
    if (
      name.startsWith('metro-file-map-') ||
      name.startsWith('metro-cache-') ||
      name === 'haste-map-metro'
    ) {
      const full = join(temp, name);
      try {
        if (statSync(full).isFile() || statSync(full).isDirectory()) {
          rmSync(full, { recursive: true, force: true });
          console.log('Removed temp cache:', full);
        }
      } catch {
        // ignore
      }
    }
  }
} catch {
  // ignore temp read errors
}

console.log('Metro cache cleanup done. Run: npx expo start --clear');
