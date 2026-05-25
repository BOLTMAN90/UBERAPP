import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const windowsJavaRoots = [
  process.env.JAVA_HOME,
  'C:\\Program Files\\Microsoft\\jdk-17.0.19.10-hotspot',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.15.6-hotspot',
];

for (const root of windowsJavaRoots) {
  if (!root) {
    continue;
  }

  const javaPath = path.join(root, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (!existsSync(javaPath)) {
    continue;
  }

  process.env.JAVA_HOME = root;
  process.env.PATH = `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH ?? ''}`;
  break;
}

const child = spawn('npx firebase emulators:start --only auth,firestore', {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
