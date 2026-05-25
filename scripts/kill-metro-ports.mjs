/**
 * Free Metro ports (8081, 8083) so Expo starts on the default port.
 * Windows: uses netstat + taskkill. Other OS: best-effort lsof.
 */
import { execSync } from 'node:child_process';

const PORTS = [8081, 8083];

function killOnWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const match = line.match(/LISTENING\s+(\d+)\s*$/i);
      if (match) pids.add(match[1]);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[kill-metro] Stopped PID ${pid} on port ${port}`);
      } catch {
        // Already stopped.
      }
    }
  } catch {
    // Port not in use.
  }
}

function killOnUnix(port) {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`[kill-metro] Stopped PID ${pid} on port ${port}`);
    }
  } catch {
    // Port not in use.
  }
}

for (const port of PORTS) {
  if (process.platform === 'win32') {
    killOnWindows(port);
  } else {
    killOnUnix(port);
  }
}

console.log('[kill-metro] Ports cleared. Start Expo with: npm run start:clean');
