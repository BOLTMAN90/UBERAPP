import { spawn } from 'node:child_process';

const child = spawn('npx expo start', {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    EXPO_PUBLIC_USE_FIREBASE_EMULATORS: 'true',
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
