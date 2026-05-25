/**
 * Starts Expo on LAN with a stable hostname for Expo Go.
 * - Reads REACT_NATIVE_PACKAGER_HOSTNAME from .env if set (manual override).
 * - Otherwise picks the best non-virtual IPv4 (Wi‑Fi / Ethernet, not VPN/Docker).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function readManualHostFromEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return null;
  }
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const m = trimmed.match(/^REACT_NATIVE_PACKAGER_HOSTNAME\s*=\s*(.+)$/);
    if (m) {
      return m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

/** Prefer real LAN; penalize VPN, Docker, Hyper-V, Tailscale, etc. */
function scoreInterface(ifaceName, addr) {
  const n = ifaceName.toLowerCase();
  const virtual =
    /virtual|vmware|vethernet|hyper-v|wsl|docker|vbox|zerotier|tailscale|nordlynx|windscribe|nordvpn|expressvpn|openvpn|tun|tap|vpn|vmnet|npcap|nordic|hamachi|zeroconf|bluetooth|mobile|iphone|rndis/i.test(
      n,
    );
  if (virtual) {
    return -1000;
  }
  if (addr.startsWith('169.254.')) {
    return -1000;
  }
  if (addr.startsWith('127.')) {
    return -1000;
  }
  if (addr.startsWith('172.17.')) {
    return -800;
  }
  if (/^192\.168\./.test(addr)) {
    return 400;
  }
  if (/^10\./.test(addr)) {
    return 250;
  }
  if (/^172\.(1[89]|[2-9]\d|3[01])\./.test(addr)) {
    return 200;
  }
  if (/^172\./.test(addr)) {
    return 50;
  }
  return 100;
}

function pickLanIPv4() {
  const nets = os.networkInterfaces();
  const scored = [];
  for (const ifaceName of Object.keys(nets)) {
    for (const net of nets[ifaceName] ?? []) {
      const fam = net.family;
      const isV4 = fam === 'IPv4' || fam === 4;
      if (!isV4 || net.internal) {
        continue;
      }
      const addr = net.address;
      const score = scoreInterface(ifaceName, addr);
      scored.push({ ifaceName, addr, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored.find((s) => s.score > 0);
  if (scored.length) {
    console.log('[expo-start-lan] IPv4 candidates (interface → score):');
    for (const row of scored.slice(0, 8)) {
      console.log(`  ${row.addr}  (${row.ifaceName})  score=${row.score}`);
    }
  }
  return best?.addr ?? scored[0]?.addr ?? null;
}

const manual = readManualHostFromEnvFile();
const env = { ...process.env };

if (manual) {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = manual;
  console.log(`[expo-start-lan] Using REACT_NATIVE_PACKAGER_HOSTNAME from .env: ${manual}`);
} else if (!env.REACT_NATIVE_PACKAGER_HOSTNAME) {
  const host = pickLanIPv4();
  if (host) {
    env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
    console.log(`[expo-start-lan] REACT_NATIVE_PACKAGER_HOSTNAME=${host}`);
  } else {
    console.warn('[expo-start-lan] No usable IPv4 found; Expo will choose a host.');
  }
} else {
  console.log(`[expo-start-lan] Using existing REACT_NATIVE_PACKAGER_HOSTNAME=${env.REACT_NATIVE_PACKAGER_HOSTNAME}`);
}

const forwarded = process.argv.slice(2);
const hasHostFlag = forwarded.some(
  (a) => a === '--localhost' || a === '--lan' || a === '--tunnel' || a.startsWith('--host'),
);
const expoArgs = ['expo', 'start', ...(hasHostFlag ? [] : ['--lan']), ...forwarded];

console.log(
  '[expo-start-lan] Tip: open the app with Expo Go (scan QR). Pressing "a" needs Android Studio + SDK; adb errors are safe to ignore.',
);

const child = spawn('npx', expoArgs, {
  stdio: 'inherit',
  shell: true,
  env,
  cwd: process.cwd(),
});

child.on('exit', (code) => process.exit(code ?? 0));
