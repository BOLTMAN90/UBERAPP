/**
 * Android + USB: forwards Metro ports from the phone to this PC, then starts Expo in localhost mode.
 * Use when the phone is on mobile data or a different network than the dev machine.
 *
 * Requires: Android USB debugging enabled, device connected, `adb` on PATH.
 */
import { spawn, spawnSync } from 'node:child_process';

function adb(args, inherit = true) {
  return spawnSync('adb', args, {
    shell: true,
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
  });
}

const devices = adb(['devices'], false);
if (devices.error) {
  console.error('[expo-android-usb] adb not found. Install Android platform-tools and add adb to PATH.');
  process.exit(1);
}

const lines = String(devices.stdout ?? '')
  .split('\n')
  .slice(1)
  .filter((l) => l.trim().endsWith('\tdevice'));

if (!lines.length) {
  console.error(
    '[expo-android-usb] No Android device in "device" state. Connect USB, enable USB debugging, authorize this PC.',
  );
  process.exit(1);
}

for (let port = 8081; port <= 8090; port++) {
  adb(['reverse', `tcp:${port}`, `tcp:${port}`]);
}

console.log('[expo-android-usb] adb reverse tcp:8081-8090 → this PC. Starting Expo with --localhost …');

const extra = process.argv.slice(2);
const child = spawn('npx', ['expo', 'start', '--localhost', ...extra], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: 'localhost' },
});

child.on('exit', (code) => process.exit(code ?? 0));
