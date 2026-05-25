import { spawn } from 'node:child_process';
import net from 'node:net';

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen({ port, host: '0.0.0.0', exclusive: true });
  });
}

async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No free Expo port found between ${startPort} and ${endPort}.`);
}

const startPort = Number(process.env.EXPO_DEV_PORT ?? 8081);
const endPort = Number(process.env.EXPO_DEV_PORT_END ?? 8099);
const port = await findAvailablePort(startPort, endPort);

console.log(`Web UI: http://localhost:${port}`);

const child = spawn(`npx expo start --web --port ${port}`, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    EXPO_DEV_SERVER_PORT: String(port),
    RCT_METRO_PORT: String(port),
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
